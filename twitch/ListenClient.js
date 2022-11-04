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
    };

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
            this.client.join(channel);
    }
    
    /**
     * Removes channel to channel list & parts from it if the client is initialized
     * @param {string} channel 
     */
    part(channel) {
        channel = channel.replace("#", "").toLowerCase();
        this.channels = this.channels.filter(x => x !== channel);
        if (this.client)
            this.client.part(channel);
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

        this.client.on("message", this.listenerWrappers.message);
    }

    /**
     * Creates the client, initializes it, and connects to TMI
     */
    connect() {
        this.client = new tmi.Client({
            options: { debug: true },
            connection: { reconnect: true },
            channels: this.channels,
            identity: {
                username: config.twitch.username,
                password: config.twitch.oauth,
            }
        });

        this.initialize();

        this.client.connect().catch(api.Logger.severe);
    }
}

module.exports = ListenClient;