const {EmbedBuilder, codeBlock, cleanCodeBlockContent, AuditLogEvent} = require("discord.js");
const {Discord} = require("../../api/index");
const config = require("../../config.json");

const getUnbanInfo = ban => {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            // Fetch a couple audit logs than just one as new entries could've been added right after this event was emitted.
            const fetchedLogs = await ban.guild.fetchAuditLogs({
                limit: 6,
                type: AuditLogEvent.MemberBanRemove
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
    name: 'logUserUnban',
    eventName: 'guildBanRemove',
    eventType: 'on',
    listener (ban) {
        Discord.getGuild(ban.guild.id).then(async guild => {
            const unbanInfo = await getUnbanInfo(ban);

            Discord.getUserById(ban.user.id, false, true).then(user => {
                guild.removeUserBan(user).then(() => {}, global.api.Logger.warning);
            }).catch(global.api.Logger.warning);

            let author = ban.user;

            let listeners = guild.listeners.filter(x => x.event === "userBan");

            if (listeners.length > 0) {

                const embed = new EmbedBuilder()
                    .setTitle("User Unbanned")
                    .setDescription(`User ${ban.user} was unbanned from the guild`)
                    .setColor(0x595959)
                    .setAuthor({name: author.username, iconURL: author.displayAvatarURL()});

                listeners.forEach(listener => {
                    listener.channel.send({embeds: [embed]})
                        .catch(api.Logger.warning);
                });

            }

            global.client.discord.channels.fetch(config.liveban_channel).then(banChannel => {
                const embed = new EmbedBuilder()
                        .setTitle("Discord User Unbanned!")
                        .setDescription(`User ${ban.user} was unbanned from the guild \`${ban.guild.name}\``)
                        .setURL(`https://tms.to/d/${ban.user.id}`)
                        .setColor(0xb53131)
                        .setAuthor({name: ban.guild.name, iconURL: ban.guild.iconURL()});

                if (unbanInfo?.reason)
                    embed.addFields({
                        name: "Reason",
                        value: codeBlock(cleanCodeBlockContent(unbanInfo.reason.toString())),
                        inline: true,
                    });

                if (unbanInfo?.executor)
                    embed.addFields({
                        name: "Moderator",
                        value: unbanInfo.executor.toString(),
                        inline: true,
                    });

                banChannel.send({embeds: [embed]});
            });
        }).catch(global.api.Logger.warning);
    }
};

module.exports = listener;