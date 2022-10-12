const {Discord} = require("../../api/index");
const DiscordUser = require("../../api/Discord/DiscordUser");

const listener = {
    name: 'logUserJoin',
    eventName: 'guildMemberAdd',
    eventType: 'on',
    async listener (member) {
        let guild;

        try {
            guild = await Discord.getGuild(member.guild.id);
        } catch (err) {}
        
        Discord.getUserById(member.id).then(user => {
            if (guild) guild.addUser(user).then(() => {}, global.api.Logger.warning);
        }, err => {
            let discordUser = new DiscordUser(
                member.id,
                null,
                member.user.username,
                member.user.discriminator,
                member.user.avatar
            );
            discordUser.post().then(user => {
                if (guild) guild.addUser(user).then(() => {}, global.api.Logger.warning)
            },
            global.api.Logger.warning);
        })
    }
};

module.exports = listener;