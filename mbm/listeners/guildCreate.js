const {Discord} = require("../../api/index");
const registerCommand = require("../commands/register");
const {EmbedBuilder} = require("discord.js");

const listener = {
    name: 'guildCreate',
    eventName: 'guildCreate',
    eventType: 'on',
    listener (guild) {
        guild.members.fetch().then(members => global.api.Logger.info(`Fetched members for ${guild.name}: ${members.size} members`), global.api.Logger.warning);

        guild.channels.fetch().then(channels => {
            channels.forEach(channel => {
                if (channel.type === "GUILD_TEXT") {
                    channel.messages.fetch().then(messages => global.api.Logger.info(`Fetched ${messages.size} messages from ${channel.name}`)); // By default will just fetch 50 messages.
                }
            });
        }, global.api.Logger.warning);

        Discord.getGuild(guild.id).then(dGuild => {
            guild.members.forEach(member => {
                Discord.getUserById(member, false, true).then(dUser => {
                    dGuild.addUser(dUser);
                });
            });

            dGuild.addCommands(guild);
        }).catch(err => {
            const msg = {embeds: [
                new EmbedBuilder()
                    .setTitle("Configure MBM for your server")
                    .setDescription("Hello, <@" + guild.ownerId + "> .\n\nPlease finish setting up MBM on your server using the following commands.\n\n`/register` - Register your Discord guild. The command should include the discord user that the guild represents and the twitch username of that user.")
                    .setColor(0x9403fc)
                    .setFooter({text: "Enter the above commands in any text channel in your guild.", iconURL: "https://tms.to/assets/images/logos/logo.webp"})
            ]};
            guild.members.fetch(guild.ownerId).then(owner => {
                owner.send(msg).then(() => {}, err => {
                    // TODO: Add backup plan.
                });
            });

            guild.commands.create(registerCommand.data).catch(global.api.Logger.warning);
        });
    }
};

module.exports = listener;