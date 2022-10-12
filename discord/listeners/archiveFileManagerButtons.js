const {cache} = require("../commands/archive");
const {Modal, TextInputComponent, showModal} = require("discord-modals");
const api = require("../../api/index");

const fs = require("fs");

const listener = {
    name: 'archiveFileManagerButtons',
    eventName: 'interactionCreate',
    eventType: 'on',
    listener (interaction) {
        if (interaction.isButton()) {
            if (interaction.component.customId === "set-label") {
                const modal = new Modal()
                    .setCustomId("set-label-" + interaction.message.id)
                    .setTitle("Set File Label")
                    .addComponents(
                        new TextInputComponent()
                            .setCustomId("label")
                            .setLabel("Label")
                            .setStyle("SHORT")
                            .setMinLength(3)
                            .setMaxLength(64)
                            .setRequired(true)
                    );

                showModal(modal, {
                    client: global.client.discord,
                    interaction: interaction,
                });
            } else if (interaction.component.customId === "remove-file") {
                api.Discord.getUserById(interaction.member.id).then(user => {
                    let file = cache[user.identity.id].files.find(x => x.message.id === interaction.message.id);

                    if (file && file.hasOwnProperty("local_path")) {
                        fs.unlink(file.local_path, err => {
                            if (err) global.api.Logger.warning(err);
                        });
                    }

                    cache[user.identity.id].files = cache[user.identity.id].files.filter(x => x.message.id !== interaction.message.id);
                    interaction.message.delete();
                }, err => {
                    global.api.Logger.warning(err);
                    interaction.reply("You're not properly linked to TMS");
                });
            }
        }
    }
};

module.exports = listener;