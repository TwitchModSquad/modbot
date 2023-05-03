const { TextChannel, Guild } = require("discord.js");

class DiscordListener {

    /**
     * Surrogate id for the listener
     * @type {number}
     */
    id;

    /**
     * Guild for this listener
     * @type {Guild}
     */
    guild;

    /**
     * Text channel for this listener
     * @type {TextChannel}
     */
    channel;

    /**
     * Event name for this listener
     * @type {string}
     */
    event;

    /**
     * Custom data for this listener
     * @type {string}
     */
    data;

    /**
     * 
     * @param {number} id
     * @param {Guild} guild 
     * @param {TextChannel} channel 
     * @param {string} event 
     * @param {string} data 
     */
    constructor(id, guild, channel, event, data) {
        this.id = id;
        this.guild = guild;
        this.channel = channel;
        this.event = event;
        this.data = data;
    }

}

module.exports = DiscordListener;