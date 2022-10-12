const {MessageActionRow, MessageSelectMenu} = require("discord.js");

const api = require("../../api/index");
const con = require("../../database");
const fs = require("fs");
const {cache} = require("../commands/archive");
const {DIRECTORY} = require("./archiveFileManager");
const config = require("../../config.json");

const listener = {
    name: 'archiveSubmit',
    eventName: 'interactionCreate',
    eventType: 'on',
    listener (interaction) {
        if (interaction.isButton()) {
            if (interaction.component.customId === "submit-archive") {
                api.Discord.getUserById(interaction.member.id).then(user => {
                    if (user.identity?.id) {
                        if (cache.hasOwnProperty(user.identity.id)) {
                            const id = api.stringGenerator(8).toLowerCase();
                            const entry = cache[user.identity.id];

                            con.query("insert into archive (id, owner_id, offense, description, time_submitted) values (?, ?, ?, ?, ?);", [id, user.identity.id, entry.offense, entry.description, new Date().getTime()], async err => {
                                if (!err) {
                                    con.query("insert into archive__logs (archive_id, action, initiated_by) values (?, 'create', ?);", [id, user.identity.id], err => {
                                        if (err) global.api.Logger.warning(err);
                                    });

                                    for (let t = 0; t < entry.twitch.length; t++) {
                                        let name = entry.twitch[t];
                                        try {
                                            let accounts = await api.Twitch.getUserByName(name, true);
            
                                            for (let ta = 0; ta < accounts.length; ta++) {
                                                await con.pquery("insert into archive__users (archive_id, type, user, value) values (?, 'twitch', 1, ?);", [id, accounts[ta].id]);
                                            }
                                        } catch (err) {
                                            await con.pquery("insert into archive__users (archive_id, type, user, value) values (?, 'twitch', 0, ?);", [id, name]);
                                        }
                                    }
                                    
                                    for (let d = 0; d < entry.discord.length; d++) {
                                        let discordId = entry.discord[d];
                                        try {
                                            let account = await api.Discord.getUserById(discordId, false, true);
            
                                            await con.pquery("insert into archive__users (archive_id, type, user, value) values (?, 'discord', 1, ?);", [id, account.id]);
                                        } catch (err) {
                                            await con.pquery("insert into archive__users (archive_id, type, user, value) values (?, 'discord', 0, ?);", [id, discordId]);
                                        }
                                    }
            
                                    for (let i = 0; i < entry.identity.length; i++) {
                                        let identityId = entry.identity[i];
                                        try {
                                            let account = await api.getFullIdentity(identityId);
            
                                            await con.pquery("insert into archive__users (archive_id, type, user, value) values (?, 'identity', 1, ?);", [id, account.id]);
                                        } catch (err) {}
                                    }

                                    if (entry.hasOwnProperty("files")) {
                                        entry.files.forEach(file => {
                                            try {
                                                if (file.hasOwnProperty("local_path")) {
                                                    fs.renameSync(file.local_path, DIRECTORY + file.name);
                                                    file.local_path = DIRECTORY + file.name;
                                                }
                                                con.query("insert into archive__files (archive_id, local_path, remote_path, name, content_type, label) values (?, ?, ?, ?, ?, ?);", [id, file.local_path, file.remote_path, file.name, file.content_type, file.label], err => {
                                                    if (err) global.api.Logger.warning(err);
                                                });
                                            } catch (err) {
                                                global.api.Logger.warning(err);
                                            }
                                        });
                                    }

                                    let guild = entry.thread.guild;
                                    entry.thread.delete().then(() => {
                                        delete cache[user.identity.id];

                                        api.Archive.getEntryById(id).then(async entry => {
                                            const embed = await entry.discordEmbed();

                                            interaction.member.send({content: "**You submitted a ban archive entry!**", embeds: [embed]}).then(message => {
                                                con.query("insert into archive__messages (id, guild_id, channel_id, archive_id, reason) values (?, ?, ?, ?, 'receipt');", [message.id, interaction.member.guild.id, interaction.member.id, entry.id]);
                                            }, global.api.Logger.warning)

                                            guild.channels.fetch(config.channels.archive_sort).then(sortChannel => {
                                                const selectMenu = new MessageSelectMenu()
                                                    .setCustomId("target")
                                                    .setMinValues(1)
                                                    .setMaxValues(1)
                                                    .setPlaceholder("Select the target channel for this entry");

                                                config.channels.archive_sort_targets.forEach(channel => {
                                                    selectMenu.addOptions(channel);
                                                });

                                                const row = new MessageActionRow()
                                                    .addComponents(selectMenu);

                                                sortChannel.send({content: " ", embeds: [embed], components: [row]}).then(message => {
                                                    con.query("insert into archive__messages (id, guild_id, channel_id, archive_id, reason) values (?, ?, ?, ?, 'sort');", [message.id, sortChannel.guild.id, sortChannel.id, entry.id]);
                                                }, global.api.Logger.warning);
                                            }, global.api.Logger.warning);
                                        }, global.api.Logger.warning);
                                    }, err => {
                                        global.api.Logger.warning(err);
                                    });
                                } else
                                    interaction.reply("Error: " + err);
                            });
                        } else {
                            interaction.reply("Cache missing data. This may be due to an unexpected restart of TMS");
                        }
                    } else {
                        interaction.reply("Member improperly linked to TMS");
                    }
                }, error => {
                    interaction.reply("Unable to find member");
                });
            }
        }
    }
};

module.exports = listener;