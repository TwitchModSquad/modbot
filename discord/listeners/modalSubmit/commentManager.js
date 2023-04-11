const { EmbedBuilder } = require("discord.js");
const api = require("../../../api/index");

const listener = {
    name: 'commentManager',
    /**
     * Verifies a button press should be sent to this listener
     * @param {ModalSubmitInteraction} interaction 
     */
    verify(interaction) {
        return interaction.customId.startsWith("comment-");
    },
    /**
     * Listener for a button press
     * @param {ModalSubmitInteraction} interaction 
     */
    async listener (interaction) {
        const handleSuccess = message => {
            interaction.reply({embeds: [new EmbedBuilder().setTitle("Success!").setDescription(message).setColor(0x2dad3e)], ephemeral: true})
        }

        const handleError = (err, method = "reply") => {
            global.api.Logger.warning(err);
            interaction[method]({embeds: [new EmbedBuilder().setTitle("Uh oh!").setDescription(""+err).setColor(0x9e392f)], ephemeral: true})
        }

        api.Discord.getUserById(interaction.member.id, false, true).then(user => {
            if (user.identity?.id) {
                api.getFullIdentity(user.identity.id).then(async identity => {
                    const twitchUser = await api.Twitch.getUserById(interaction.customId.replace("comment-",""));

                    twitchUser.addCustomComment(interaction.fields.getTextInputValue("comment"), identity).then(comment => {
                        handleSuccess(`Added mod comment \`${comment.comment.comment}\` to \`${twitchUser.display_name}\`!`)
                    }, err => handleError(String(err)));
                }).catch(err => handleError(err + ""));
            } else {
                handleError("You must link your account with TMS before you can use Crossban functions!\nAsk a user for an invite link.");
            }
        }).catch(handleError);
    }
};

module.exports = listener;