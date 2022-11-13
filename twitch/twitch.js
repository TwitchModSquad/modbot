// Load application config file
const config = require("../config.json");

// Load local API module
const api = require("../api/index");

const tmi = require('tmi.js');
const con = require("../database");

const discordClient = require("../discord/discord");
const Discord = require("discord.js");
const ListenClient = require("./ListenClient");

let modSquadGuild = null;

let disallowed_channels = ["ludwig", "tarzaned", "flexingseal", "miki", "dirtybird", "alttprandomizer"];

let bannedPerMinute = {};

let listenClient = new ListenClient();

// I think reason may be deprecated here, so it may always be null. I'll have to check on that.
/**
 * Add a ban event to the database
 * @param {String} channel - The twitch channel where the user was banned
 * @param {String} userid - The twitch user id to add to the ban list
 * @param {String} username - The twitch username of the offending user
 * @param {String} reason - The reason for the ban
 * @param {Number} timebanned - The timestamp of the ban event as a unix timestamp
 * @returns {void}
 */
const addBan = async (channel, userid, username, reason, timebanned) => {
    let channelStripped = channel.replace("#", "");

    let streamer = (await api.Twitch.getUserByName(channelStripped, true))[0];
    let streamer_id = streamer.id;

    let speaker = (await api.Twitch.getUserByName(username, true))[0];

    /* 
     If the BPM rate of the channel of interest is healthy (under the BPM cap) and the liveban text channel is 
     found, the bot will send a message detailing the twitch ban information to the liveban text channel.
    */
    if (bannedPerMinute[channel].length <= 5) {
        if (config.hasOwnProperty("liveban_channel")) {
            let dchnl = modSquadGuild.channels.cache.find(dchnl => dchnl.id == config.liveban_channel);

            if (dchnl.isText()) {
                
            }
        }
    } else {
        global.api.Logger.info(`Not notifying of ban in ${channel} due to exceeding BPM threshold (${bannedPerMinute[channel]}>5)`);
    }
}

/**
 * A parent function used to easily call event functions when twitch events are triggered
 * @method message - The twitch message event handler
 * @method messageDeleted - The twitch messageDeleted event handler
 * @method ban - The twitch ban event handler
 * @method timeout - The twitch timeout event handler
 */
const handle = {
    message: async (channel, tags, message, self) => {
        
    },
    messageDeleted: (channel, username, deletedMessage, userstate) => {
        
    },
    ban: (channel, username, reason, userstate) => {
        addBan(channel, userstate["target-user-id"], username, reason, userstate["tmi-sent-ts"]);
    },
    timeout: (channel, username, reason, duration, userstate) => {
        
    },
};

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
