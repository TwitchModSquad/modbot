const { EmbedBuilder, codeBlock, AuditLogEvent } = require("discord.js");
const {Discord} = require("../../api/index");
const con = require("../../database");

const getExecutor = member => {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            // Fetch a couple audit logs than just one as new entries could've been added right after this event was emitted.
            const fetchedLogs = await member.guild.fetchAuditLogs({
                limit: 6,
                type: AuditLogEvent.MemberUpdate
            }).catch(global.api.Logger.warning);
            
            const auditEntry = fetchedLogs.entries.find(a =>
                // Small filter function to make use of the little discord provides to narrow down the correct audit entry.
                a.target.id === member.id &&
                // Ignore entries that are older than 5 seconds to reduce false positives.
                Date.now() - a.createdTimestamp < 5000
            );
        
            // If entry exists, grab the user that deleted the message and display username + tag, if none, display 'Unknown'. 
            resolve(auditEntry?.executor ? auditEntry.executor : null);
        }, 1500);
    });
}

const listener = {
    name: 'logMemberUpdate',
    eventName: 'guildMemberUpdate',
    eventType: 'on',
    listener (oldMember, newMember) {
        Discord.getGuild(oldMember.guild.id).then(async guild => {
            const executor = await getExecutor(oldMember);
            if (oldMember.nickname !== newMember.nickname) {
                /**TODO
                const embed = new EmbedBuilder()
                    .setTitle("Nickname Changed")
                    .addFields({
                        name: "User",
                        value: newMember.toString(),
                        inline: true,
                    })
                    .setColor(0x4c80d4)
                    .setAuthor({name: newMember.user.username, iconURL: newMember.avatarURL()});

                if (executor && executor.id !== newMember.id)
                    embed.addFields({
                        name: "Moderator",
                        value: executor.toString(),
                        inline: true,
                    });
                
                embed.addFields({
                    name: "Old Nickname",
                    value: codeBlock(oldMember.nickname ? oldMember.nickname.replace(/\\`/g, "`").replace(/`/g, "\\`") : "[unset]"),
                    inline: false,
                }, {
                    name: "New Nickname",
                    value: codeBlock(newMember.nickname ? newMember.nickname.replace(/\\`/g, "`").replace(/`/g, "\\`") : "[unset]"),
                    inline: false,
                });
                channel.send({embeds: [embed]});**/
            }
        }).catch(global.api.Logger.warning);
    }
};

module.exports = listener;