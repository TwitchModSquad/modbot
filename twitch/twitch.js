// Load application config file
const config = require("../config.json");

// Load local API module
const api = require("../api/index");

const tmi = require('tmi.js');
const con = require("../database");

const discordClient = require("../discord/discord");
const Discord = require("discord.js");
const ListenClient = require("./ListenClient");

let disallowed_channels = ["ludwig", "tarzaned", "flexingseal", "miki", "dirtybird", "alttprandomizer"];

let listenClient = new ListenClient();

/**
 * Update the Discord bot's presence to reflect the current number of channels being listened to
 * @returns {void} 
*/
const updateActivity = () => {
    let channelCount = listenClient.channels.length;
    if (global?.client?.discord?.user)
        global.client.discord.user.setActivity(`${channelCount} channel${channelCount === 1 ? "" : "s"}`, {type: "WATCHING"})
}

setInterval(updateActivity, 30000);
setTimeout(updateActivity, 3000);

/**
 * Listens to the specified channel
 * @param {String} channel - The twitch channel to add to the bot's listening list
 */
const listenOnChannel = channel => {
    if (!disallowed_channels.includes(channel)) listenClient.join(channel);
}

/**
 * Parts from the specified channel
 * @param {String} channel - The twitch channel to remove from the bot's listening list
 */
const partFromChannel = channel => {
    listenClient.part(channel);
    global.api.Logger.info("Parting from channel " + channel);
}

// Fetch the current mod squad Discord Guild object
discordClient.guilds.fetch(config.modsquad_discord).then(guild => {
    modSquadGuild = guild;
    global.modSquadGuild = guild;
});

// Create a singular client object to execute bans
const banClient = new tmi.Client({
    options: { debug: false },
    connection: { reconnect: true },
    identity: {
        username: config.twitch.username,
        password: config.twitch.oauth
    },
});

banClient.connect();

con.query("select distinct lower(twitch__user.display_name) as name from identity__moderator join identity on modfor_id = identity.id join twitch__user on twitch__user.identity_id = identity.id where identity__moderator.active = true limit 5000;", (err, res) => {
    if (err) {global.api.Logger.severe(err);return;}
    
    for (let i = 0; i < res.length; i++) {
        listenOnChannel(res[i].name);
    }

    global.api.Logger.info("Startup completed!");
    
    listenClient.connect();
});

// Bind listenOnChannel and partFromChannel to the global scope
global.listenOnChannel = listenOnChannel;
global.partFromChannel = partFromChannel;

global.client.ban = banClient;

module.exports = {
    listenOnChannel: listenOnChannel,
    banClient: banClient,
    listenClient: listenClient,
};
