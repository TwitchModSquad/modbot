const {EmbedBuilder, codeBlock, cleanCodeBlockContent, AuditLogEvent} = require("discord.js");
const {Discord} = require("../../api/index");

const getKickInfo = member => {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            // Fetch a couple audit logs than just one as new entries could've been added right after this event was emitted.
            const fetchedLogs = await member.guild.fetchAuditLogs({
                limit: 6,
                type: AuditLogEvent.MemberKick
            }).catch(global.api.Logger.warning);
            
            const auditEntry = fetchedLogs.entries.find(a =>
                // Small filter function to make use of the little discord provides to narrow down the correct audit entry.
                a.target.id === member.id &&
                // Ignore entries that are older than 5 seconds to reduce false positives.
                Date.now() - a.createdTimestamp < 25000
            );
        
            // If entry exists, grab the user that deleted the message and display username + tag, if none, display 'Unknown'. 
            resolve(auditEntry ? auditEntry : null);
        }, 750);
    });
}

const listener = {
    name: 'logUserKick',
    eventName: 'guildMemberRemove',
    eventType: 'on',
    listener (member) {
        Discord.getGuild(member.guild.id).then(async guild => {
            const kickInfo = await getKickInfo(member);
            let kickedBy = null;

            if (kickInfo?.executor?.id) {
                try {
                    kickedBy = await Discord.getUserById(kickInfo.executor.id, false, true);
                } catch(err) {
                    global.api.Logger.warning(err);
                }

                Discord.getUserById(member.id, false, true).then(user => {
                    guild.addUserKick(user, kickInfo?.reason ? kickInfo.reason : null, kickedBy).then(() => {}, global.api.Logger.warning);
                    guild.removeUser(user).then(() => {}, global.api.Logger.warning);
                }).catch(global.api.Logger.warning);
            }

            let author = member.user;

            let listeners = guild.listeners.filter(x => x.event === "userKick" || x.event === "userLeave");

            if (listeners.length > 0) {
                let embed = new EmbedBuilder()
                        .setTitle("Member Left the Guild")
                        .setDescription(`User ${member} ${kickInfo ? "was kicked from" : "has left"} the guild.`)
                        .setColor(0xb53131)
                        .setAuthor({name: author.username, iconURL: author.displayAvatarURL()});

                if (kickInfo?.reason) {
                    embed.addFields({
                        name: "Reason",
                        value: codeBlock(cleanCodeBlockContent(kickInfo.reason.toString())),
                        inline: true,
                    });
                }

                if (kickInfo?.executor) {
                    embed.addFields({
                        name: "Moderator",
                        value: kickInfo.executor.toString(),
                        inline: true,
                    });
                }

                listeners.forEach(listener => {
                    if ((kickInfo && listener.event === "userKick") || (!kickInfo && listener.event === "userLeave"))
                        listener.channel.send({embeds: [embed]})
                            .catch(api.Logger.warning);
                });
            }
        }, () => {});
    }
};

module.exports = listener;