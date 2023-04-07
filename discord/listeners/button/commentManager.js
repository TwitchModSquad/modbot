const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const api = require("../../../api/index");
const config = require("../../../config.json");
const con = require("../../../database");

const listener = {
    name: 'commentManager',
    /**
     * Verifies a button press should be sent to this listener
     * @param {ButtonInteraction} interaction 
     */
    verify(interaction) {
        return interaction.isButton() && interaction.component.customId.startsWith("comment-");
    },
    /**
     * Listener for a button press
     * @param {ButtonInteraction} interaction 
     */
    async listener (interaction) {
        const handleSuccess = message => {
            interaction.reply({embeds: [new EmbedBuilder().setTitle(message).setColor(0x2dad3e)], ephemeral: true})
        }

        const handleError = (err, method = "reply") => {
            global.api.Logger.warning(err);
            interaction[method]({embeds: [new EmbedBuilder().setTitle("Uh oh!").setDescription(err).setColor(0x9e392f)], ephemeral: true})
        }

        api.Discord.getUserById(interaction.member.id, false, true).then(user => {
            if (user.identity?.id) {
                api.getFullIdentity(user.identity.id).then(async identity => {
                    const twitchUser = await api.Twitch.getUserById(interaction.component.customId.replace("comment-",""));

                    const modal = new ModalBuilder()
                        .setCustomId(interaction.component.customId)
                        .setTitle("Add Comment : " + twitchUser.display_name)
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId("comment")
                                .setLabel("Comment")
                                .setMinLength(6)
                                .setMaxLength(512)
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(true)
                                .setPlaceholder("Known Troublemaker")
                        );

                    interaction.showModal(modal);
                }).catch(err => handleError(err + ""));
            } else {
                handleError("You must link your account with TMS before you can use Crossban functions!\nAsk a user for an invite link.");
            }
        }).catch(handleError);
    }
};

module.exports = listener;