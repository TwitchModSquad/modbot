const { StringSelectMenuInteraction } = require("discord.js");
const api = require("../../../api/");
const con = require("../../../database");

const listener = {
    name: 'archiveEditManager',
    /**
     * Verifies a select menu interaction should be sent to this listener
     * @param {StringSelectMenuInteraction} interaction 
     */
    verify(interaction) {
        return interaction.isStringSelectMenu() && interaction.component.customId === "remove-users";
    },
    /**
     * Listener for a select menu interaction
     * @param {StringSelectMenuInteraction} interaction 
     */
    listener (interaction) {
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
                        const embed = new EmbedBuilder()
                            .setTitle("Edited successfully!");
                        interaction.reply({embeds: [embed], ephemeral: true});
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
    }
};

module.exports = listener;