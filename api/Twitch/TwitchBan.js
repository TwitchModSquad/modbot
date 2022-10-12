const TwitchPunishment = require("./TwitchPunishment");
const TwitchUser = require("./TwitchUser");

class TwitchBan extends TwitchPunishment {
    /**
     * Constructor for a TwitchBan
     * 
     * @param {number} id 
     * @param {TwitchUser} channel 
     * @param {TwitchUser} user 
     * @param {number} time 
     * @param {boolean} active 
     * @param {string} discord_message
     */
    constructor(id, channel, user, time, active, discord_message) {
        super(id, channel, user, time, active, discord_message);
    }
}

module.exports = TwitchBan;