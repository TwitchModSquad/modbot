const { EmbedBuilder, codeBlock, cleanCodeBlockContent } = require("discord.js");
const {Discord} = require("../../api/index");
const con = require("../../database");

const listener = {
    name: 'logMessageEdit',
    eventName: 'messageUpdate',
    eventType: 'on',
    listener (oldMessage, newMessage) {
        if (oldMessage.guildId && oldMessage.content !== newMessage.content) {
            Discord.getGuild(oldMessage.guildId).then(guild => {
                Discord.getUserById(oldMessage.author.id, false, true).then(user => {
                    con.query("insert into discord__edit (guild_id, channel_id, message_id, user_id, old_message, new_message) values (?, ?, ?, ?, ?, ?);", [
                        guild.id,
                        oldMessage.channel.id,
                        oldMessage.id,
                        user.id,
                        oldMessage.content,
                        newMessage.content
                    ], err => {
                        if (err) {
                            global.api.Logger.warning(err);
                        }
                    });
                }).catch(err => {
                    global.api.Logger.warning(err);
                });

                let listeners = guild.listeners.filter(x => x.event === "messageEdit");

                if (listeners.length > 0) {

                    const embed = new EmbedBuilder()
                        .setTitle("Message Edited")
                        .addFields(
                            {
                                name: "Channel",
                                value: oldMessage.channel.toString(),
                                inline: true,
                            },
                            {
                                name: "Author",
                                value: oldMessage.author.toString(),
                                inline: true,
                            },
                            {
                                name: "Old Message",
                                value: codeBlock(cleanCodeBlockContent(oldMessage.content)),
                                inline: false,
                            },
                            {
                                name: "New Message",
                                value: codeBlock(cleanCodeBlockContent(newMessage.content)),
                                inline: false,
                            }
                        )
                        .setColor(0x4c80d4)
                        .setAuthor({name: oldMessage.author.username, iconURL: oldMessage.author.displayAvatarURL()});

                    listeners.forEach(listener => {
                        listener.channel.send({embeds: [embed]})
                            .catch(api.Logger.warning);
                    });

                }
            }).catch(err => {
                global.api.Logger.warning(err);
            });
        }
    }
};

module.exports = listener;