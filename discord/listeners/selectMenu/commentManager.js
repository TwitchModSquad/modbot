const { StringSelectMenuInteraction, EmbedBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const api = require("../../../api/index");

const listener = {
    name: 'commentManager',
    /**
     * Verifies a select menu interaction should be sent to this listener
     * @param {StringSelectMenuInteraction} interaction 
     */
    verify(interaction) {
        return interaction.isStringSelectMenu() && interaction.component.customId.startsWith("comment-");
    },
    /**
     * Listener for a select menu interaction
     * @param {StringSelectMenuInteraction} interaction 
     */
    listener (interaction) {
        const handleSuccess = message => {
            interaction.reply({embeds: [new EmbedBuilder().setTitle("Success!").setDescription(message).setColor(0x2dad3e)], ephemeral: true})
        }
        
        const handleError = (err, method = "reply") => {
            global.api.Logger.warning(err);
            interaction[method]({embeds: [new EmbedBuilder().setTitle("Uh oh!").setDescription(err).setColor(0x9e392f)], ephemeral: true})
        }

        api.Discord.getUserById(interaction.member.id, false, true).then(user => {
            if (user.identity?.id) {
                api.getFullIdentity(user.identity.id).then(async identity => {
                    const twitchUser = await api.Twitch.getUserById(interaction.component.customId.replace("comment-",""));

                    if (interaction.values[0] === "custom") {
                        const modal = new ModalBuilder()
                            .setCustomId(interaction.component.customId)
                            .setTitle("Add Comment : " + twitchUser.display_name)
                            .setComponents(
                                new ActionRowBuilder()
                                    .setComponents(
                                        new TextInputBuilder()
                                            .setCustomId("comment")
                                            .setLabel("Comment")
                                            .setMinLength(6)
                                            .setMaxLength(512)
                                            .setRequired(true)
                                            .setStyle(TextInputStyle.Short)
                                            .setPlaceholder("Bad things, or good things")
                                    )
                            );

                        interaction.showModal(modal);
                    } else {
                        twitchUser.addComment(interaction.values[0], identity).then(comment => {
                            handleSuccess(`Added mod comment \`${comment.comment.comment}\` to \`${twitchUser.display_name}\`!`)
                        }, err => handleError(String(err)));
                    }
                }).catch(err => handleError(String(err)));
            } else {
                handleError("You must link your account with TMS before you can use comment functions!\nAsk a user for an invite link.");
            }
        }).catch(handleError);
    }
};

module.exports = listener;