const { ModalBuilder, TextInputBuilder, ButtonInteraction, TextInputStyle, ActionRowBuilder } = require("discord.js");
const api = require("../../../api/");
const con = require("../../../database");

const listener = {
    name: 'archiveEditManager',
    /**
     * Verifies a button press should be sent to this listener
     * @param {ButtonInteraction} interaction 
     */
    verify(interaction) {
        const customId = interaction.component.customId;

        return customId === "cancel-edit"
            || customId === "edit-offense"
            || customId === "edit-description"
            || customId === "add-twitch-user"
            || customId === "add-discord-user"
            || customId === "add-file"
    },
    /**
     * Listener for a button press
     * @param {ButtonInteraction} interaction 
     */
    listener (interaction) {
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
                            const offense = new TextInputBuilder()
                                .setCustomId("offense")
                                .setLabel("Offense")
                                .setStyle(TextInputStyle.Short)
                                .setMinLength(3)
                                .setMaxLength(256)
                                .setPlaceholder("Write something like 'Harrassment' or 'Unsolicted Pictures' (Note: Don't put links here!)")
                                .setRequired(true)
                                .setValue(entry.offense);
                            
                            const modal = new ModalBuilder()
                                .setCustomId("edit-offense-" + entry.id)
                                .setTitle("Edit Offense for " + entry.id)
                                .addComponents(
                                        new ActionRowBuilder().addComponents(offense)
                                    );
        
                            interaction.showModal(modal);
                        } else if (customId === "edit-description") {
                            const description = new TextInputBuilder()
                                .setCustomId("description")
                                .setLabel("Description")
                                .setStyle(TextInputStyle.Paragraph)
                                .setMinLength(32)
                                .setMaxLength(2048)
                                .setPlaceholder("Go into more detail!")
                                .setRequired(true)
                                .setValue(entry.description);

                            const modal = new ModalBuilder()
                                .setCustomId("edit-description-" + entry.id)
                                .setTitle("Edit Description for " + entry.id)
                                .addComponents(
                                        new ActionRowBuilder().addComponents(description)
                                    );
        
                            interaction.showModal(modal);
                        } else if (customId === "add-twitch-user") {
                            const query = new TextInputBuilder()
                                .setCustomId("query")
                                .setLabel("Twitch Username")
                                .setStyle(TextInputStyle.Short)
                                .setMinLength(3)
                                .setMaxLength(64)
                                .setPlaceholder("Give a twitch username!")
                                .setRequired(true);

                            const modal = new ModalBuilder()
                                .setCustomId("add-twitch-user-" + entry.id)
                                .setTitle("Add a Twitch user to " + entry.id)
                                .addComponents(
                                        new ActionRowBuilder().addComponents(query)
                                    );
        
                            interaction.showModal(modal);
                        } else if (customId === "add-discord-user") {
                            const query = new TextInputBuilder()
                                .setCustomId("query")
                                .setLabel("Discord ID")
                                .setStyle(TextInputStyle.Short)
                                .setMinLength(17)
                                .setMaxLength(64)
                                .setPlaceholder("Give a discord ID!")
                                .setRequired(true);
                            
                            const modal = new ModalBuilder()
                                .setCustomId("add-discord-user-" + entry.id)
                                .setTitle("Add a Twitch user to " + entry.id)
                                .addComponents(
                                        new ActionRowBuilder().addComponents(query)
                                    );
        
                            interaction.showModal(modal);
                        } else if (customId === "add-file") {
                            const label = new TextInputBuilder()
                                .setCustomId("label")
                                .setLabel("Label")
                                .setStyle(TextInputStyle.Short)
                                .setMaxLength(64)
                                .setPlaceholder("Give it a good name!")
                                .setRequired(false);

                            const url = new TextInputBuilder()
                                .setCustomId("url")
                                .setLabel("URL to data")
                                .setStyle(TextInputStyle.Short)
                                .setMinLength(5)
                                .setMaxLength(256)
                                .setPlaceholder("A link to the file. If we can't retrieve a file from it, we'll just add it as a link.")
                                .setRequired(true);

                            const modal = new ModalBuilder()
                                .setCustomId("add-file-" + entry.id)
                                .setTitle("Add a file to " + entry.id)
                                .addComponents(
                                        new ActionRowBuilder().addComponents(label),
                                        new ActionRowBuilder().addComponents(url)
                                    );
        
                            interaction.showModal(modal);
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
    }
};

module.exports = listener;