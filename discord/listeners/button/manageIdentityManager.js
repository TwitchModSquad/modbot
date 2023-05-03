const { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const api = require("../../../api/");

const {interactions} = require("../../commands/manage");

const listener = {
    name: 'manageIdentityManager',
    /**
     * Verifies a button press should be sent to this listener
     * @param {ButtonInteraction} interaction 
     */
    verify(interaction) {
        return interaction.component.customId.startsWith("id-") && !interaction.customId.startsWith("id-create-");
    },
    /**
     * Listener for a button press
     * @param {ButtonInteraction} interaction 
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

        if (interaction.component.customId.startsWith("id-at-")) {
            // add twitch

            const modal = new ModalBuilder()
                .setCustomId(interaction.component.customId)
                .setTitle(`Add Twitch - ${target.name}`)
                .addComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId("users")
                                .setLabel("Twitch Usernames")
                                .setPlaceholder("Separate users using new lines")
                                .setStyle(TextInputStyle.Paragraph)
                                .setMinLength(2)
                                .setMaxLength(512)
                                .setRequired(true)
                        )
                );

            interaction.showModal(modal);
        } else if (interaction.component.customId.startsWith("id-ad-")) {
            // add discord

            const modal = new ModalBuilder()
                .setCustomId(interaction.component.customId)
                .setTitle(`Add Discord - ${target.name}`)
                .addComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId("users")
                                .setLabel("Discord IDs")
                                .setPlaceholder("Separate users using new lines. IDs ONLY")
                                .setStyle(TextInputStyle.Paragraph)
                                .setMinLength(10)
                                .setMaxLength(1024)
                                .setRequired(true)
                        )
                );

            interaction.showModal(modal);
        } else if (interaction.component.customId.startsWith("id-as-")) {
            // add streamer

            const modal = new ModalBuilder()
                .setCustomId(interaction.component.customId)
                .setTitle(`Add Streamer - ${target.name}`)
                .addComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId("streamers")
                                .setLabel("Twitch Usernames")
                                .setPlaceholder("Separate streamers using new lines")
                                .setStyle(TextInputStyle.Paragraph)
                                .setMinLength(2)
                                .setMaxLength(512)
                                .setRequired(true)
                        )
                );

            interaction.showModal(modal);
        } else if (interaction.component.customId.startsWith("id-am-")) {
            // add moderator

            const modal = new ModalBuilder()
                .setCustomId(interaction.component.customId)
                .setTitle(`Add Moderator - ${target.name}`)
                .addComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId("moderators")
                                .setLabel("Twitch Usernames")
                                .setPlaceholder("Separate moderators using new lines")
                                .setStyle(TextInputStyle.Paragraph)
                                .setMinLength(2)
                                .setMaxLength(512)
                                .setRequired(true)
                        )
                );

            interaction.showModal(modal);
        } else if (interaction.component.customId.startsWith("id-mo-")) {
            // more options

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("id-aut-" + target.id)
                        .setLabel("Toggle Authentication")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId("id-del-" + target.id)
                        .setLabel("Delete Identity")
                        .setStyle(ButtonStyle.Danger)
                );

            interaction.reply({
                content: "View more options below",
                components: [
                    buttons,
                ],
                ephemeral: true,
            });
        } else if (interaction.component.customId.startsWith("id-aut-") && user.identity.admin) {
            // more options - toggle authentication

            target.authenticated = !target.authenticated;
            await target.post();
            await updateInteraction();

            interaction.success(target.authenticated ? "The user is **now** authenticated!" : "The user is **no longer** authenticated!");
        } else if (interaction.component.customId.startsWith("id-del-") && user.identity.admin) {
            // more options - delete

            
        }
    }
};

module.exports = listener;