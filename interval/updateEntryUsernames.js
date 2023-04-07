const api = require("../api/");
const con = require("../database");
const {EmbedBuilder, codeBlock} = require("discord.js");
const config = require("../config.json");

module.exports = () => {
    con.query("select distinct value, type, archive_id from archive__users where (type = 'discord' or type = 'twitch') and user and date_add(last_updated, interval 2 day) < now();", async (err, res) => {
        if (err) {
            global.api.Logger.warning(err);
            return;
        }

        const nameChangeChannel = await global.client.discord.channels.fetch(config.channels.archive_name_changes);

        if (!nameChangeChannel) {
            global.api.Logger.warning("could not find name change channel");
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
        
                        if (helixUser.displayName.toLowerCase() !== user.login) {
                            await con.pquery("update twitch__username set last_seen = now() where id = ? and display_name = ?;", [user.id, user.display_name]);
                            await con.pquery("insert into twitch__username (id, display_name) values (?, ?) on duplicate key update display_name = ?;", [user.id, helixUser.displayName, helixUser.displayName]);
                            await con.pquery("update twitch__user set display_name = ? where id = ?;", [helixUser.displayName, user.id]);

                            const embed = new EmbedBuilder()
                                .setTitle("Twitch Name Change")
                                .setURL(user.getShortlink())
                                .setDescription("The following name change was detected!")
                                .addFields(
                                    {
                                        name: "Old Username",
                                        value: codeBlock(user.display_name),
                                        inline: true,
                                    },
                                    {
                                        name: "New Username",
                                        value: codeBlock(helixUser.displayName),
                                        inline: true,
                                    }
                                )
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
                                    global.api.Logger.warning(err);
                                }
                            }

                            if (archiveEntriesString !== "")
                                embed.addFields({
                                    name: "Archive Entries",
                                    value: archiveEntriesString,
                                });

                            nameChangeChannel.send({content: " ", embeds: [embed]});
                        }
                    } catch (err) {
                        global.api.Logger.warning(helixUser?.id);
                        global.api.Logger.warning(err);
                    }
                });
            } catch (err) {
                global.api.Logger.warning(err);
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

                    const embed = new EmbedBuilder()
                        .setTitle("Discord Name Change")
                        .setURL(user.getShortlink())
                        .setDescription("The following name change was detected for " + retrievedUser.toString() + "!")
                        .addFields(
                            {
                                name: "Old Username",
                                value: codeBlock(user.name + "#" + user.discriminator),
                                inline: true,
                            },
                            {
                                name: "New Username",
                                value: codeBlock(retrievedUser.tag),
                                inline: true,
                            }
                        )
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
                            global.api.Logger.warning(err);
                        }
                    }

                    if (archiveEntriesString !== "")
                        embed.addFields({
                            name: "Archive Entries",
                            value: archiveEntriesString,
                        });
                    
                    nameChangeChannel.send({content: " ", embeds: [embed]});
                }
            } catch (err) {
                global.api.Logger.warning(id);
                global.api.Logger.warning(err);
            }
        });

        con.query("update archive__users set last_updated = now() where user;");
    });
};
