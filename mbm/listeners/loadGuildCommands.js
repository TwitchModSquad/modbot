const {Discord} = require("../../api/index");
const client = global.client.mbm;
const registerCommand = require("../commands/register");

const config = require("../../config.json");

const addCommand = (guild, commandData) => {
    return new Promise(async (resolve, reject) => {
        const commands = guild.commands.cache;
        let command = commands.find(x => commandData.name === x.name);

        if (config.force_command_push && command) {
            try {
                await guild.commands.delete(command.id);
            } catch(err) {
                reject(err);
                return;
            }
        }
    
        if (!command) {
            try {
                command = await guild.commands.create(commandData);
            } catch (err) {
                reject(err);
                return;
            }
        }

        resolve();
    });
}

const listener = {
    name: 'loadGuildCommands',
    eventName: 'ready',
    eventType: 'once',
    async listener () {
        await client.guilds.fetch();
        setTimeout(async () => {
            client.guilds.cache.forEach(async guild => {
                const members = await guild.members.fetch();
                global.api.Logger.info(`Fetched members for ${guild.name}: ${members.size} members`)
    
                guild.channels.fetch().then(channels => {
                    channels.forEach(channel => {
                        try {
                            if (channel.type === "GUILD_TEXT") {
                                channel.messages.fetch().then(() => {}, () => {}); // By default will just fetch 50 messages.
                            }
                        } catch(err) {
                            global.api.Logger.warning(err);
                        }
                    });
                }, global.api.Logger.warning);
    
                await guild.commands.fetch();
                guild.commands.cache.forEach(x => {
                    guild.commands.delete(x).catch(console.error);
                })
    
                Discord.getGuild(guild.id).then(dGuild => {
                    guild.members.cache.forEach(member => {
                        Discord.getUserById(member.id, false, true).then(dUser => {
                            dGuild.addUser(dUser).then(() => {}, global.api.Logger.warning);
                        }, global.api.Logger.warning);
                    });
                    dGuild.addCommands(guild);
                }).catch(async err => {
                    addCommand(guild, registerCommand.data).then(() => {}, global.api.Logger.warning);
                });
            });
        }, 10000);
    }
};

module.exports = listener;