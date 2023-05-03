const api = require("../../api/index");
const con = require("../../database");

const listener = {
    name: 'archiveMove',
    eventName: 'interactionCreate',
    eventType: 'on',
    listener (interaction) {
        if (interaction.isSelectMenu() && interaction.component.customId === "target") {
            if (interaction.values.length === 1) {
                api.Discord.getUserById(interaction.member.id).then(user => {
                    if (user.identity?.id) {
                        con.query("select archive_id from archive__messages where id = ?;", [interaction.message.id], (err, res) => {
                            if (err) {global.api.Logger.warning(err);return;}
        
                            if (res.length > 0) {
                                api.Archive.getEntryById(res[0].archive_id).then(entry => {
                                    interaction.guild.channels.fetch(interaction.values[0]).then(async channel => {
                                        let identity = null;

                                        try {
                                            identity = await api.getFullIdentity(user.identity.id);
                                        } catch(e) {}

                                        entry.move(channel, identity);
                                    }, err => {
                                        global.api.Logger.warning(err);
                                        interaction.reply("Could not resolve new channel");
                                    });
                                }, err => {
                                    interaction.reply("Error: " + err);
                                });
                            } else {
                                interaction.reply("Could not resolve archive entry");
                            }
                        });
                    } else {
                        interaction.reply("You aren't properly linked to TMS");
                    }
                }, err => {
                    interaction.reply("Error: " + err);
                });
            } else {
                interaction.reply("You must select one channel.");
            }
        }
    }
};

module.exports = listener;