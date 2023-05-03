const { ModalSubmitInteraction, EmbedBuilder, codeBlock } = require("discord.js");
const api = require("../../../api/");
const con = require("../../../database");

const {interactions} = require("../../commands/manage");
const FullIdentity = require("../../../api/FullIdentity");

const listener = {
    name: 'manageIdentityManager',
    /**
     * Verifies a button press should be sent to this listener
     * @param {ModalSubmitInteraction} interaction 
     */
    verify(interaction) {
        return interaction.customId.startsWith("id-");
    },
    /**
     * Listener for a button press
     * @param {ModalSubmitInteraction} interaction 
     */
    async listener (interaction) {
        const user = await api.Discord.getUserById(interaction.user.id);

        if (!user.identity?.id) {
            interaction.error("You do not have permission to manage this user.");
            return;
        }

        let targetId = interaction.customId.split("-").pop();
        let target;

        try {
            target = await api.getFullIdentity(targetId);
        } catch(err) {
            api.Logger.warning(err);
        }

        if (!target) {
            interaction.error("Target could not be found.");
            return;
        }

        if (target.admin && !user.identity.admin) {
            interaction.error("You do not have permission to manage this user.");
            return;
        }

        if (target.mod && !(user.identity.mod || user.identity.admin)) {
            interaction.error("You do not have permission to manage this user.");
            return;
        }

        const updateInteraction = async () => {
            if (!interactions.hasOwnProperty(interaction.user.id)) return;

            try {
                const message = await target.editEmbed(user.identity.admin);
                await interactions[interaction.user.id].editReply(message);
            } catch(err) {
                api.Logger.severe(err);
            }
        }

        await interaction.deferReply({ephemeral: true});

        let success = "";
        let errors = "";

        if (interaction.customId.startsWith("id-at-")) {
            // add twitch

            let split = interaction.fields.getTextInputValue("users").split("\n");
            let retrievedUsers = [];

            for (let i = 0; i < split.length; i++) {
                try {
                    const user = (await api.Twitch.getUserByName(split[i], true))[0];
                    retrievedUsers = [
                        ...retrievedUsers,
                        user,
                    ];

                    success += `\n${user.display_name}`;
                } catch(err) {
                    api.Logger.warning(err);
                    errors += `\n${split[i]} - ${String(err)}`;
                }
            }

            target.twitchAccounts = [
                ...target.twitchAccounts,
                ...retrievedUsers,
            ];
        } else if (interaction.customId.startsWith("id-ad-")) {
            // add discord

            let split = interaction.fields.getTextInputValue("users").split("\n");
            let retrievedUsers = [];

            for (let i = 0; i < split.length; i++) {
                try {
                    const user = await api.Discord.getUserById(split[i], true, true);
                    retrievedUsers = [
                        ...retrievedUsers,
                        user,
                    ];

                    success += `\n${user.name}#${user.discriminator}`;
                } catch(err) {
                    api.Logger.warning(err);
                    errors += `\n${split[i]} - ${String(err)}`;
                }
            }

            target.discordAccounts = [
                ...target.discordAccounts,
                ...retrievedUsers,
            ];
        } else if (interaction.customId.startsWith("id-as-")) {
            // add streamer

            let split = interaction.fields.getTextInputValue("streamers").split("\n");

            for (let i = 0; i < split.length; i++) {
                try {
                    const user = (await api.Twitch.getUserByName(split[i], true))[0];

                    await user.refreshFollowers();

                    let identity = user.identity;
                    let createdIdentity = false;

                    if (!identity?.id) {
                        createdIdentity = true;
                        identity = new FullIdentity(null, user.display_name, false, false, false, [user], []);
                        await identity.post();
                    }

                    let active = user.affiliation === "partner" || user.follower_count >= 5000;

                    await con.pquery("insert into identity__moderator (identity_id, modfor_id, active) values (?, ?, ?);", [
                        target.id,
                        identity.id,
                        active,
                    ]);

                    success += `\n${user.display_name} - Identity ${identity.id}${createdIdentity ? " [Created]" : ""} - ${active ? "Active" : "Inactive"}`;
                } catch(err) {
                    api.Logger.warning(err);
                    errors += `\n${split[i]} - ${String(err)}`;
                }
            }
        } else if (interaction.customId.startsWith("id-am-")) {
            // add moderator

            let split = interaction.fields.getTextInputValue("moderators").split("\n");

            for (let i = 0; i < target.twitchAccounts.length; i++) {
                await target.twitchAccounts[i].refreshFollowers();
            }

            let active = false;

            target.twitchAccounts.forEach(account => {
                if (account.affiliation === "partner" || account.follower_count >= 5000)
                    active = true;
            });

            for (let i = 0; i < split.length; i++) {
                try {
                    const user = (await api.Twitch.getUserByName(split[i], true))[0];

                    let identity = user.identity;
                    let createdIdentity = false;

                    if (!identity?.id) {
                        createdIdentity = true;
                        identity = new FullIdentity(null, user.display_name, false, false, false, [user], []);
                        await identity.post();
                    }

                    await con.pquery("insert into identity__moderator (identity_id, modfor_id, active) values (?, ?, ?);", [
                        identity.id,
                        target.id,
                        active,
                    ]);

                    success += `\n${user.display_name} - Identity ${identity.id}${createdIdentity ? " [Created]" : ""} - ${active ? "Active" : "Inactive"}`;
                } catch(err) {
                    api.Logger.warning(err);
                    errors += `\n${split[i]} - ${String(err)}`;
                }
            }
        } else return;

        await target.post();
        await updateInteraction();

        const embed = new EmbedBuilder()
            .setTitle("Action has been completed!")
            .setColor(0x772ce8);

        if (success.length > 0) {
            embed.addFields({
                name: "Successes",
                value: codeBlock(success),
                inline: true,
            })
        }

        if (errors.length > 0) {
            embed.addFields({
                name: "Errors",
                value: codeBlock(errors),
                inline: true,
            })
        }

        interaction.editReply({
            embeds: [embed],
            ephemeral: true,
        })
    }
};

module.exports = listener;