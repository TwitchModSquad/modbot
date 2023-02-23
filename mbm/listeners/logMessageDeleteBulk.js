const { EmbedBuilder, codeBlock, cleanCodeBlockContent } = require("discord.js");
const {Discord} = require("../../api/index");
const con = require("../../database");

const getExecutor = message => {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            // Fetch a couple audit logs than just one as new entries could've been added right after this event was emitted.
            const fetchedLogs = await message.guild.fetchAuditLogs({
                limit: 6,
                type: 'MESSAGE_DELETE'
            }).catch(global.api.Logger.warning);
            
            const auditEntry = fetchedLogs.entries.find(a =>
                // Small filter function to make use of the little discord provides to narrow down the correct audit entry.
                a.target.id === message.author.id &&
                a.extra.channel.id === message.channel.id &&
                // Ignore entries that are older than 5 seconds to reduce false positives.
                Date.now() - a.createdTimestamp < 5000
            );
        
            // If entry exists, grab the user that deleted the message and display username + tag, if none, display 'Unknown'. 
            resolve(auditEntry?.executor ? auditEntry.executor : null);
        }, 1500);
    });
}

const listener = {
    name: 'logMessageDeleteBulk',
    eventName: 'messageDeleteBulk',
    eventType: 'on',
    listener (messages) {
        if (messages.size > 0 && messages?.[0]?.guild.id) {
            Discord.getGuild(messages[0].guild.id).then(async guild => {
                const executor = await getExecutor(messages[0]);
                messages.each(message => {
                    Discord.getUserById(message.author.id, false, true).then(user => {
                        con.query("insert into discord__edit (guild_id, channel_id, message_id, user_id, executor, old_message, new_message) values (?, ?, ?, ?, ?, ?, null);", [
                            guild.id,
                            message.channel.id,
                            message.id,
                            user.id,
                            executor !== null ? executor.id : null,
                            message.content
                        ], err => {
                            if (err) {
                                global.api.Logger.warning(err);
                            }
                        });
                    }).catch(err => {
                        global.api.Logger.warning(err);
                    });
    
                    if (!message.author.bot) {
                        guild.getSetting("lde-enabled", "boolean").then(enabled => {
                            guild.getSetting("lde-message-delete", "boolean").then(messageDeleteEnabled => {
                                if (enabled && messageDeleteEnabled) {
                                    guild.getSetting("lde-channel", "channel").then(async channel => {
                                        let author = message.author;
        
                                        if (executor) author = executor;
        
                                        const embed = new EmbedBuilder()
                                                .setTitle("Message Deleted")
                                                .addFields(
                                                    {
                                                        name: "Channel",
                                                        value: message.channel.toString(),
                                                        inline: true,
                                                    },
                                                    {
                                                        name: "Author",
                                                        value: message.author.toString(),
                                                        inline: true,
                                                    }
                                                )
                                                .setColor(0x4c80d4)
                                                .setAuthor({name: author.username, iconURL: author.avatarURL()});
        
        
                                        if (executor !== null) {
                                            embed.addFields({
                                                name: "Moderator",
                                                value: executor.toString(),
                                                inline: true,
                                            });
                                        }
                                        if (message?.content && message.content.trim() !== "") {
                                            embed.addFields({
                                                name: "Message Content",
                                                value: codeBlock(cleanCodeBlockContent(message.content)),
                                                inline: false,
                                            });
                                        }
                                        channel.send({embeds: [embed]});
                                    }).catch(global.api.Logger.warning);
                                }
                            }).catch(global.api.Logger.warning);
                        }).catch(global.api.Logger.warning);
                    }
                });
            }).catch(global.api.Logger.warning);
        }
    }
};

module.exports = listener;