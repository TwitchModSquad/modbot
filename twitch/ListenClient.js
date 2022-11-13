const tmi = require('tmi.js');
const fs = require('fs');
const api = require('../api/');

const config = require("../config.json");

const grabFiles = path => fs.readdirSync(path).filter(file => file.endsWith('.js'));

const twitchListeners = grabFiles('./twitch/listeners');

class ListenClient {

    /**
     * Represents the TMI client
     * @type {tmi.Client}
     */
    client;

    /**
     * Channels that the client is currently listening to
     * @type {string[]}
     */
    channels = [];

    /**
     * Holds listeners for TMI events
     */
    listeners = {
        message: [],
        timeout: [],
        ban: [],
    };

    /**
     * Stores a key-object pair of the number of bans in a minute in each channel
     */
    bannedPerMinute = {};

    /**
     * Wraps listener parameters to be more TMS friendly than TMI functions
     */
    listenerWrappers = {
        message: async (channel, tags, message, self) => {
            try {
                if (tags.hasOwnProperty("message-type") && tags["message-type"] === "whisper") return;
    
                let streamer = (await api.Twitch.getUserByName(channel.replace("#", ""), true))[0];
                let chatter = (await api.Twitch.getUserByName(tags.username, true))[0];
        
                this.listeners.message.forEach(func => {
                    try {
                        func(streamer, chatter, tags, message, self);
                    } catch (e) {
                        global.api.Logger.warning(e);
                    }
                });
            } catch (e) {
                global.api.Logger.warning(e);
            }
        },
        timeout: async (channel, username, reason, duration, userstate) => {
            try {
                let streamer = (await api.Twitch.getUserByName(channel.replace("#", ""), true))[0];
                let chatter = await api.Twitch.getUserById(userstate["target-user-id"], false, true);
        
                this.listeners.timeout.forEach(func => {
                    try {
                        func(streamer, chatter, duration, userstate["tmi-sent-ts"], userstate);
                    } catch (e) {
                        global.api.Logger.warning(e);
                    }
                });
            } catch (e) {
                global.api.Logger.warning(e);
            }
        },
        ban: async (channel, username, reason, userstate) => {
            try {
                let streamer = (await api.Twitch.getUserByName(channel.replace("#", ""), true))[0];
                let chatter = await api.Twitch.getUserById(userstate["target-user-id"], false, true);

                if (!this.bannedPerMinute.hasOwnProperty(streamer.id)) this.bannedPerMinute[streamer.id] = [];
                this.bannedPerMinute[streamer.id] = [
                    ...this.bannedPerMinute[streamer.id],
                    Date.now(),
                ]
        
                this.listeners.ban.forEach(func => {
                    try {
                        func(streamer, chatter, userstate["tmi-sent-ts"], userstate, this.bannedPerMinute[streamer.id].length);
                    } catch (e) {
                        global.api.Logger.warning(e);
                    }
                });
            } catch (e) {
                global.api.Logger.warning(e);
            }
        },
    }

    /**
     * Adds channel to channel list & joins it if the client is initialized
     * @param {string} channel 
     */
    join(channel) {
        channel = channel.replace("#", "").toLowerCase();
        this.channels = [
            ...this.channels,
            channel,
        ]
        if (this.client)
            this.client.join(channel).catch(api.Logger.warning);
    }
    
    /**
     * Removes channel to channel list & parts from it if the client is initialized
     * @param {string} channel 
     */
    part(channel) {
        channel = channel.replace("#", "").toLowerCase();
        this.channels = this.channels.filter(x => x !== channel);
        if (this.client)
            this.client.part(channel).catch(api.Logger.warning);
    }

    /**
     * Internal function to initialize the listeners to this client
     */
    initialize() {
        for (const file of twitchListeners) {
            const listener = require(`./listeners/${file}`);

            if (this.listenerWrappers.hasOwnProperty(listener.eventName)) {
                if (!this.listeners.hasOwnProperty(listener.eventName)) this.listeners[listener.eventName] = [];

                this.listeners[listener.eventName] = [
                    ...this.listeners[listener.eventName],
                    listener.listener,
                ]
            } else {
                this.client.on(listener.eventName, listener.listener);
            }
        }

        setInterval(() => {
            for (const [streamer, timestampList] of Object.entries(this.bannedPerMinute)) {
                let now = Date.now();
                this.bannedPerMinute[streamer] = timestampList.filter(ts => now - ts < 60000);
            }
        }, 1000);

        this.client.on("message", this.listenerWrappers.message);
        this.client.on("timeout", this.listenerWrappers.timeout);
        this.client.on("ban", this.listenerWrappers.ban);
    }

    /**
     * Creates the client, initializes it, and connects to TMI
     */
    connect() {
        this.client = new tmi.Client({
            options: {
                debug: true,
                // joinInterval: 5000,
                skipMembership: true,
            },
            connection: { reconnect: true },
            channels: this.channels,
            identity: {
                username: config.twitch.username,
                password: config.twitch.oauth,
            },
        });

        this.initialize();

        this.client.connect().catch(api.Logger.severe);
    }
}

module.exports = ListenClient;