const { StringSelectMenuInteraction, EmbedBuilder, codeBlock } = require("discord.js");
const api = require("../../../api/");
const con = require("../../../database");

const {interactions} = require("../../commands/manage");

const listener = {
    name: 'manageIdentityManager',
    /**
     * Verifies a select menu interaction should be sent to this listener
     * @param {StringSelectMenuInteraction} interaction 
     */
    verify(interaction) {
        return interaction.component.customId.startsWith("id-");
    },
    /**
     * Listener for a select menu interaction
     * @param {StringSelectMenuInteraction} interaction 
     */
    async listener (interaction) {
        const user = await api.Discord.getUserById(interaction.user.id);

        if (!user.identity?.id) {
            interaction.error("You do not have permission to manage this user.");
            return;
        }

        let targetId = interaction.component.customId.split("-").pop();
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

        if (interaction.component.customId.startsWith("id-rt-")) {
            // remove twitch

            for (let i = 0; i < interaction.values.length; i++) {
                try {
                    const user = await api.Twitch.getUserById(interaction.values[i]);
    
                    user.identity = null;
                    await user.post();
    
                    target.twitchAccounts = target.twitchAccounts.filter(x => x.id !== user.id);

                    success += `\n${user.display_name}`;
                } catch(err) {
                    errors += `\n${interaction.values[i]} - ${String(err)}`;
                }
            }
        } else if (interaction.component.customId.startsWith("id-rd-")) {
            // remove discord

            for (let i = 0; i < interaction.values.length; i++) {
                try {
                    const user = await api.Discord.getUserById(interaction.values[i]);
    
                    user.identity = null;
                    await user.post();
    
                    target.discordAccounts = target.discordAccounts.filter(x => x.id !== user.id);

                    success += `\n${user.name}#${user.discriminator}`;
                } catch(err) {
                    errors += `\n${interaction.values[i]} - ${String(err)}`;
                }
            }
        } else if (interaction.component.customId.startsWith("id-rs-")) {
            // remove streamer

            try {
                await con.pquery("delete from identity__moderator where identity_id = ? and modfor_id in (?);", [
                    target.id,
                    interaction.values,
                ]);
            } catch(err) {
                errors += `\n${String(err)}`;
                api.Logger.warning(err);
            }
        } else if (interaction.component.customId.startsWith("id-rm-")) {
            // remove moderator

            try {
                await con.pquery("delete from identity__moderator where identity_id in (?) and modfor_id = ?;", [
                    interaction.values,
                    target.id,
                ]);
            } catch(err) {
                errors += `\n${String(err)}`;
                api.Logger.warning(err);
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
            })
        }

        if (errors.length > 0) {
            embed.addFields({
                name: "Errors",
                value: codeBlock(errors),
            })
        }

        interaction.editReply({
            embeds: [embed],
            ephemeral: true,
        })
    }
};

module.exports = listener;