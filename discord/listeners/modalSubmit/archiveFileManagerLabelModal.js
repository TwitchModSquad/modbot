const api = require("../../../api/index");
const {cache, temporaryMessage} = require("../../commands/archive");
const {parseFileMessage} = require("../archiveFileManager");

const listener = {
    name: 'archiveFileManagerLabelModal',
    /**
     * Verifies a button press should be sent to this listener
     * @param {ModalSubmitInteraction} interaction 
     */
    verify(interaction) {
        return interaction.customId.startsWith("set-label-");
    },
    /**
     * Listener for a button press
     * @param {ModalSubmitInteraction} interaction 
     */
    listener (interaction) {
        let messageId = interaction.customId.replace("set-label-", "");

        api.Discord.getUserById(interaction.member.id).then(user => {
            if (user.identity?.id) {
                if (cache.hasOwnProperty(user.identity.id) && cache[user.identity.id].hasOwnProperty("files")) {
                    let file = cache[user.identity.id].files.find(x => x.message.id == messageId);

                    if (file) {
                        file.label = interaction.fields.getTextInputValue("label");
                        file.message.edit(parseFileMessage(file)).then(() => {}, global.api.Logger.warning);

                        temporaryMessage(interaction, "reply", "File label changed!", 5000, "```New label: " + file.label + "```\n" + "[View new file information here](" + file.message.url + ")")
                    } else {
                        interaction.reply({content: "Missing cache data. This is likely due to an unexpected restart of ModBot.", ephemeral: true});
                    }
                } else {
                    interaction.reply({content: "Missing cache data. This is likely due to an unexpected restart of ModBot.", ephemeral: true});
                }
            } else {
                interaction.reply({content: "Your user is not properly linked to TMS.", ephemeral: true});
            }
        }, error => {
            interaction.reply({content: "Error: " + error, ephemeral: true});
        });
    }
};

module.exports = listener;