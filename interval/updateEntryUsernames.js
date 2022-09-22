const api = require("../api/");
const con = require("../database");
const {MessageEmbed} = require("discord.js");
const config = require("../config.json");

module.exports = () => {
    con.query("select distinct value, type, archive_id from archive__users where (type = 'discord' or type = 'twitch') and user and date_add(last_updated, interval 2 day) < now();", async (err, res) => {
        if (err) {
            console.error(err);
            return;
        }

        const nameChangeChannel = await global.client.discord.channels.fetch(config.channels.archive_name_changes);

        if (!nameChangeChannel) {
            console.error("could not find name change channel");
            return;
        }

        let twitchIds = [];
        let discordIds = [];

        res.forEach(row => {
            if (row.type === "twitch") {
                twitchIds = [
                    ...twitchIds,
                    row.value,
                ];
            } else {
                discordIds = [
                    ...discordIds,
                    row.value,
                ];
            }
        });

        const refreshTwitchNames = async ids => {
            let helixUsers;
            try {
                helixUsers = await api.Twitch.Direct.helix.users.getUsersByIds(ids);

                helixUsers.forEach(async helixUser => {
                    try {
                        let user = await api.Twitch.getUserById(helixUser.id, true);
        
                        if (helixUser.displayName.toLowerCase() !== user.display_name.toLowerCase()) {
                            await con.pquery("update twitch__username set last_seen = now() where id = ? and display_name = ?;", [user.id, user.display_name]);
                            await con.pquery("insert into twitch__username (id, display_name) values (?, ?) on duplicate key update display_name = ?;", [user.id, helixUser.displayName, helixUser.displayName]);
                            await con.pquery("update twitch__user set display_name = ? where id = ?;", [helixUser.displayName, user.id]);

                            const embed = new MessageEmbed()
                                .setTitle("Twitch Name Change")
                                .setURL(user.getShortlink())
                                .setDescription("The following name change was detected!")
                                .addField("Old Username", "```\n" + user.display_name + "```", true)
                                .addField("New Username", "```\n" + helixUser.displayName + "```", true)
                                .setColor(0x772ce8);
                            
                            user = await api.Twitch.getUserById(helixUser.id, true);

                            let archiveEntriesString = "";
                            let archiveEntries = res.filter(x => x.value == helixUser.id && x.type === "twitch");
                            
                            for (let i = 0; i < archiveEntries.length; i++) {
                                try {
                                    const entry = await api.Archive.getEntryById(archiveEntries[i].archive_id);
                                    const message = await entry.getPublicRecordMessage();
                                    
                                    archiveEntriesString += `\n[${entry.offense}](${message.url})`;

                                    entry.refreshMessages();
                                } catch (err) {
                                    console.error(err);
                                }
                            }

                            if (archiveEntriesString !== "")
                                embed.addField("Archive Entries", archiveEntriesString);

                            nameChangeChannel.send({content: " ", embeds: [embed]});
                        }
                    } catch (err) {
                        console.error(helixUser?.id);
                        console.error(err);
                    }
                });
            } catch (err) {
                console.error(err);
                return;
            }
        };

        let currentIDList = [];
        twitchIds.forEach(id => {
            currentIDList = [
                ...currentIDList,
                id,
            ]

            if (currentIDList.length === 100) {
                refreshTwitchNames(currentIDList);
                currentIDList = [];
            }
        });
        refreshTwitchNames(currentIDList);

        discordIds.forEach(async id => {
            try {
                let user = await api.Discord.getUserById(id, true);
                let retrievedUser = await global.client.discord.users.fetch(id);

                if (user.name.toLowerCase() !== retrievedUser.username.toLowerCase() || user.discriminator !== retrievedUser.discriminator) {
                    await con.pquery("update discord__username set last_seen = now() where id = ? and name = ? and discriminator = ?;", [user.id, user.name, user.discriminator]);
                    await con.pquery("insert into discord__username (id, name, discriminator) values (?, ?, ?) on duplicate key update name = ?, discriminator = ?;", [user.id, retrievedUser.username, retrievedUser.discriminator, retrievedUser.username, retrievedUser.discriminator]);
                    await con.pquery("update discord__user set name = ?, discriminator = ? where id = ?;", [retrievedUser.username, retrievedUser.discriminator, retrievedUser.id]);

                    const embed = new MessageEmbed()
                        .setTitle("Discord Name Change")
                        .setURL(user.getShortlink())
                        .setDescription("The following name change was detected for " + retrievedUser.toString() + "!")
                        .addField("Old Username", "```\n" + user.name + "#" + user.discriminator + "```", true)
                        .addField("New Username", "```\n" + retrievedUser.tag + "```", true)
                        .setColor(0x772ce8);

                    user = await api.Discord.getUserById(id, true);

                    let archiveEntriesString = "";
                    let archiveEntries = res.filter(x => x.value == retrievedUser.id && x.type === "discord");
                    
                    for (let i = 0; i < archiveEntries.length; i++) {
                        try {
                            const entry = await api.Archive.getEntryById(archiveEntries[i].archive_id);
                            const message = await entry.getPublicRecordMessage();
                            
                            archiveEntriesString += `\n[${entry.offense}](${message.url})`;

                            entry.refreshMessages();
                        } catch (err) {
                            console.error(err);
                        }
                    }

                    if (archiveEntriesString !== "")
                        embed.addField("Archive Entries", archiveEntriesString);
                    
                    nameChangeChannel.send({content: " ", embeds: [embed]});
                }
            } catch (err) {
                console.error(id);
                console.error(err);
            }
        });

        con.query("update archive__users set last_updated = now() where user;");
    });
};
