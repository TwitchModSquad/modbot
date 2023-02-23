const {EmbedBuilder, codeBlock, cleanCodeBlockContent, AuditLogEvent} = require("discord.js");
const {Discord} = require("../../api/index");
const config = require("../../config.json");

const getBanInfo = ban => {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            // Fetch a couple audit logs than just one as new entries could've been added right after this event was emitted.
            const fetchedLogs = await ban.guild.fetchAuditLogs({
                limit: 6,
                type: AuditLogEvent.MemberBanAdd
            }).catch(global.api.Logger.warning);

            fetchedLogs.entries.forEach(e => global.api.Logger.info(e.extra));
            const auditEntry = fetchedLogs.entries.find(a =>
                // Small filter function to make use of the little discord provides to narrow down the correct audit entry.
                a.target.id === ban.user.id &&
                // Ignore entries that are older than 5 seconds to reduce false positives.
                Date.now() - a.createdTimestamp < 5000
            );
        
            // If entry exists, grab the user that deleted the message and display username + tag, if none, display 'Unknown'. 
            resolve(auditEntry ? auditEntry : null);
        }, 750);
    });
}

const listener = {
    name: 'logUserBan',
    eventName: 'guildBanAdd',
    eventType: 'on',
    listener (ban) {
        Discord.getGuild(ban.guild.id).then(async guild => {
            const banInfo = await getBanInfo(ban);
            let bannedBy = null;

            if (banInfo?.executor?.id) {
                try {
                    bannedBy = await Discord.getUserById(banInfo.executor.id, false, true);
                } catch(err) {
                    global.api.Logger.warning(err);
                }
            }

            Discord.getUserById(ban.user.id, false, true).then(user => {
                guild.addUserBan(user, banInfo?.reason ? banInfo.reason : null, bannedBy).then(() => {}, global.api.Logger.warning);
            }).catch(global.api.Logger.warning);

            guild.getSetting("lde-enabled", "boolean").then(enabled => {
                guild.getSetting("lde-user-ban", "boolean").then(banEnabled => {
                    if (enabled && banEnabled) {
                        guild.getSetting("lde-channel", "channel").then(async channel => {
                            let author = ban.user;
    
                            let embed = new EmbedBuilder()
                                    .setTitle("User Banned")
                                    .setDescription(`User ${ban.user} was banned from the guild`)
                                    .setColor(0xb53131)
                                    .setAuthor({name: author.username, iconURL: author.avatarURL()});
    
                            if (banInfo?.reason) {
                                embed.addFields({
                                    name: "Reason",
                                    value: codeBlock(cleanCodeBlockContent(banInfo.reason.toString())),
                                    inline: true,
                                })
                            }
    
                            if (banInfo?.executor) {
                                embed.addFields({
                                    name: "Moderator",
                                    value: banInfo.executor.toString(),
                                    inline: true,
                                });
                            }
    
                            channel.send({embeds: [embed]});
                        }).catch(global.api.Logger.warning);
                    }
                }).catch(global.api.Logger.warning);
            }).catch(global.api.Logger.warning);

            global.client.discord.channels.fetch(config.liveban_channel).then(banChannel => {
                const embed = new EmbedBuilder()
                        .setTitle("Discord user was Banned!")
                        .setDescription(`User ${ban.user} was banned from the guild \`${ban.guild.name}\``)
                        .setURL(`https://tms.to/d/${ban.user.id}`)
                        .setColor(0xb53131)
                        .setAuthor({name: ban.guild.name, iconURL: ban.guild.iconURL()});

                if (banInfo?.reason)
                    embed.addFields({
                        name: "Reason",
                        value: codeBlock(cleanCodeBlockContent(banInfo.reason.toString())),
                        inline: true,
                    });

                if (banInfo?.executor)
                    embed.addFields({
                        name: "Moderator",
                        value: codeBlock(cleanCodeBlockContent(banInfo.executor.toString())),
                        inline: true,
                    });

                banChannel.send({embeds: [embed]});
            });
        }).catch(global.api.Logger.warning);
    }
};

module.exports = listener;