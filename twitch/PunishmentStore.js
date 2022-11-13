const {Logger} = require("../api/");
const con = require("../database");

function parseIntIfPossible(str) {
    try {
        return parseInt(str);
    } catch(e) {}
    return str;
}

class PunishmentStore {
    /**
     * Stores ban information
     */
    banStore = {};

    /**
     * Stores timeout information
     */
    timeoutStore = {};

    /**
     * Constructor for a PunishmentStore object
     */
    constructor() {
        con.query("select streamer_id, user_id from twitch__ban where active;", (err, res) => {
            if (err) {
                Logger.severe("Error retrieving ban store:");
                Logger.severe(err);
            } else {
                res.forEach(row => {
                    this.addBan(row.streamer_id, row.user_id);
                });

                Logger.info(`Loaded ${res.length} ban${res.length === 1 ? "" : "s"}`);
            }
        });

        con.query("select streamer_id, user_id from twitch__timeout where active;", (err, res) => {
            if (err) {
                Logger.severe("Error retrieving timeout store:");
                Logger.severe(err);
            } else {
                res.forEach(row => {
                    this.addTimeout(row.streamer_id, row.user_id);
                });

                Logger.info(`Loaded ${res.length} timeout${res.length === 1 ? "" : "s"}`);
            }
        });
    }

    /**
     * Adds a record to the ban log
     * @param {string|integer} streamer 
     * @param {string|integer} chatter 
     */
    addBan(streamer, chatter) {
        streamer = parseIntIfPossible(streamer);
        chatter = parseIntIfPossible(chatter);
        if (!this.banStore.hasOwnProperty(streamer)) this.banStore[streamer] = [];

        this.banStore[streamer] = [
            ...this.banStore[streamer],
            chatter,
        ]
    }

    /**
     * Checks if a record is in the ban log
     * @param {string|integer} streamer 
     * @param {string|integer} chatter 
     * @returns {boolean}
     */
    isBanned(streamer, chatter) {
        streamer = parseIntIfPossible(streamer);
        chatter = parseIntIfPossible(chatter);
        return this.banStore.hasOwnProperty(streamer) && this.banStore[streamer].includes(chatter);
    }

    /**
     * Removes a record from the ban log
     * @param {string|integer} streamer 
     * @param {string|integer} chatter 
     */
    removeBan(streamer, chatter) {
        streamer = parseIntIfPossible(streamer);
        chatter = parseIntIfPossible(chatter);
        if (this.banStore.hasOwnProperty(streamer))
            this.banStore[streamer] = this.banStore[streamer].filter(x => x !== chatter);
    }

    /**
     * Adds a record to the timeout log
     * @param {string|integer} streamer 
     * @param {string|integer} chatter 
     */
    addTimeout(streamer, chatter) {
        streamer = parseIntIfPossible(streamer);
        chatter = parseIntIfPossible(chatter);
        if (!this.timeoutStore.hasOwnProperty(streamer)) this.timeoutStore[streamer] = [];

        this.timeoutStore[streamer] = [
            ...this.timeoutStore[streamer],
            chatter,
        ]
    }

    /**
     * Checks if a record is in the timeout log
     * @param {string|integer} streamer 
     * @param {string|integer} chatter 
     * @returns {boolean}
     */
    isTimedOut(streamer, chatter) {
        streamer = parseIntIfPossible(streamer);
        chatter = parseIntIfPossible(chatter);
        return this.timeoutStore.hasOwnProperty(streamer) && this.timeoutStore[streamer].includes(chatter);
    }

    /**
     * Removes a record from the timeout log
     * @param {string|integer} streamer 
     * @param {string|integer} chatter 
     */
    removeTimeout(streamer, chatter) {
        streamer = parseIntIfPossible(streamer);
        chatter = parseIntIfPossible(chatter);
        if (this.timeoutStore.hasOwnProperty(streamer))
            this.timeoutStore[streamer] = this.timeoutStore[streamer].filter(x => x !== chatter);
    }
}

module.exports = new PunishmentStore();