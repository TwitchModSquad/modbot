const client = global.client.mbm;

const listener = {
    name: 'readyMessage',
    eventName: 'ready',
    eventType: 'once',
    listener () {
        global.api.initDiscord();
        global.api.Logger.info(`[MBM] Discord bot ready! Logged in as ${client.user.tag}!`);
        global.api.Logger.info(`[MBM] Bot has started with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`);
    }
};

module.exports = listener;