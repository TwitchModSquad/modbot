const {Modal, TextInputComponent, showModal} = require("discord-modals");
const { MessageEmbed } = require("discord.js");
const api = require("../../api/index");
const con = require("../../database");

const listener = {
    name: 'archiveEditManager',
    eventName: 'interactionCreate',
    eventType: 'on',
    listener (interaction) {
        if (interaction.isButton()) {
            let customId = interaction.component.customId;

            if (!customId) customId = interaction.component.custom_id;

            if (customId === "cancel-edit") {
                interaction.message.delete().then(() => {
                    con.query("delete from archive__messages where id = ?;", [interaction.message.id], err => {
                        if (err) global.api.Logger.warning(err);
                    });
                }, global.api.Logger.warning);
            } else
                if (customId === "edit-offense"
                    || customId === "edit-description"
                    || customId === "add-twitch-user"
                    || customId === "add-discord-user"
                    || customId === "add-file") {
                con.query("select archive_id from archive__messages where id = ?;", [interaction.message.id], (err, res) => {
                    if (err) global.api.Logger.warning(err);

                    if (res.length > 0) {
                        api.Archive.getEntryById(res[0].archive_id).then(entry => {
                            if (customId === "edit-offense") {
                                const modal = new Modal()
                                    .setCustomId("edit-offense-" + entry.id)
                                    .setTitle("Edit Offense for " + entry.id)
                                    .addComponents(
                                        new TextInputComponent()
                                            .setCustomId("offense")
                                            .setLabel("Offense")
                                            .setStyle("SHORT")
                                            .setMinLength(3)
                                            .setMaxLength(256)
                                            .setPlaceholder("Write something like 'Harrassment' or 'Unsolicted Pictures' (Note: Don't put links here!)")
                                            .setRequired(true)
                                            .setDefaultValue(entry.offense));
            
                                showModal(modal, {
                                    client: global.client.discord,
                                    interaction: interaction,
                                });
                            } else if (customId === "edit-description") {
                                const modal = new Modal()
                                    .setCustomId("edit-description-" + entry.id)
                                    .setTitle("Edit Description for " + entry.id)
                                    .addComponents(
                                        new TextInputComponent()
                                            .setCustomId("description")
                                            .setLabel("Description")
                                            .setStyle("LONG")
                                            .setMinLength(32)
                                            .setMaxLength(2048)
                                            .setPlaceholder("Go into more detail!")
                                            .setRequired(true)
                                            .setDefaultValue(entry.description));
            
                                showModal(modal, {
                                    client: global.client.discord,
                                    interaction: interaction,
                                });
                            } else if (customId === "add-twitch-user") {
                                const modal = new Modal()
                                    .setCustomId("add-twitch-user-" + entry.id)
                                    .setTitle("Add a Twitch user to " + entry.id)
                                    .addComponents(
                                        new TextInputComponent()
                                            .setCustomId("query")
                                            .setLabel("Twitch Username")
                                            .setStyle("SHORT")
                                            .setMinLength(3)
                                            .setMaxLength(64)
                                            .setPlaceholder("Give a twitch username!")
                                            .setRequired(true));
            
                                showModal(modal, {
                                    client: global.client.discord,
                                    interaction: interaction,
                                });
                            } else if (customId === "add-discord-user") {
                                const modal = new Modal()
                                    .setCustomId("add-discord-user-" + entry.id)
                                    .setTitle("Add a Twitch user to " + entry.id)
                                    .addComponents(
                                        new TextInputComponent()
                                            .setCustomId("query")
                                            .setLabel("Discord ID")
                                            .setStyle("SHORT")
                                            .setMinLength(17)
                                            .setMaxLength(64)
                                            .setPlaceholder("Give a discord ID!")
                                            .setRequired(true));
            
                                showModal(modal, {
                                    client: global.client.discord,
                                    interaction: interaction,
                                });
                            } else if (customId === "add-file") {
                                const modal = new Modal()
                                    .setCustomId("add-file-" + entry.id)
                                    .setTitle("Add a file to " + entry.id)
                                    .addComponents(
                                        new TextInputComponent()
                                            .setCustomId("label")
                                            .setLabel("Label")
                                            .setStyle("SHORT")
                                            .setMaxLength(64)
                                            .setPlaceholder("Give it a good name!")
                                            .setRequired(false),
                                        new TextInputComponent()
                                            .setCustomId("url")
                                            .setLabel("URL to data")
                                            .setStyle("SHORT")
                                            .setMinLength(5)
                                            .setMaxLength(256)
                                            .setPlaceholder("A link to the file. If we can't retrieve a file from it, we'll just add it as a link.")
                                            .setRequired(true));
            
                                showModal(modal, {
                                    client: global.client.discord,
                                    interaction: interaction,
                                });
                            }
                        }, err => {
                            global.api.Logger.warning(err);
                            interaction.reply("We couldn't resolve this message ID to an archive entry.");
                        });
                    } else {
                        interaction.reply("We couldn't resolve this message ID to an archive entry.");
                    }
                });
            }
        } else if (interaction.isSelectMenu()) {
            if (interaction.component.customId === "remove-users"
                || interaction.component.customId === "remove-files") {
                con.query("select archive_id from archive__messages where id = ?;", [interaction.message.id], (err, res) => {
                    if (err) global.api.Logger.warning(err);

                    if (res.length > 0) {
                        api.Discord.getUserById(interaction.user.id).then(user => {
                            if (!user.identity?.id) {
                                interaction.reply("You aren't properly linked to TMS");
                                return;
                            }

                            api.Archive.getEntryById(res[0].archive_id).then(entry => {
                                if (interaction.component.customId === "remove-users") {
                                    interaction.values.forEach(value => {
                                        entry.removeUser(value, user.identity);
                                    });
                                } else {
                                    interaction.values.forEach(value => {
                                        entry.removeFile(value, user.identity);
                                    });
                                }
                                const embed = new MessageEmbed()
                                    .setTitle("Edited successfully!");
                                interaction.reply({content: ' ', embeds: [embed], ephemeral: true});
                            }, err => {
                                global.api.Logger.warning(err);
                                interaction.reply("We couldn't resolve this message ID to an archive entry.");
                            });
                        }, err => {
                            interaction.reply("You aren't properly linked to TMS");
                        })
                    } else {
                        interaction.reply("We couldn't resolve this message ID to an archive entry.");
                    }
                });
            } else if (interaction.component.customId === "remove-files") {

            }
        }
    }
};

module.exports = listener;