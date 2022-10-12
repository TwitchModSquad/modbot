const api = require("../../api/index");
const {cache, temporaryMessage} = require("../commands/archive");
const {parseFileMessage} = require("./archiveFileManager");

const listener = {
    name: 'archiveFileManagerLabelModal',
    eventName: 'modalSubmit',
    eventType: 'on',
    listener (modal) {
        if (modal.customId.startsWith("set-label-")) {
            let messageId = modal.customId.replace("set-label-", "");

            api.Discord.getUserById(modal.member.id).then(user => {
                if (user.identity?.id) {
                    if (cache.hasOwnProperty(user.identity.id) && cache[user.identity.id].hasOwnProperty("files")) {
                        let file = cache[user.identity.id].files.find(x => x.message.id == messageId);

                        if (file) {
                            file.label = modal.getTextInputValue("label");
                            file.message.edit(parseFileMessage(file)).then(() => {}, global.api.Logger.warning);

                            temporaryMessage(modal, "reply", "File label changed!", 5000, "```New label: " + file.label + "```\n" + "[View new file information here](" + file.message.url + ")")
                        } else {
                            modal.reply({content: "Missing cache data. This is likely due to an unexpected restart of ModBot.", ephemeral: true});
                        }
                    } else {
                        modal.reply({content: "Missing cache data. This is likely due to an unexpected restart of ModBot.", ephemeral: true});
                    }
                } else {
                    modal.reply({content: "Your user is not properly linked to TMS.", ephemeral: true});
                }
            }, error => {
                modal.reply({content: "Error: " + error, ephemeral: true});
            });
        }
    }
};

module.exports = listener;