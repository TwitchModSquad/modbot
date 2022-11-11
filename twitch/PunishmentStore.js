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
     * Adds a record to the ban log
     * @param {string|integer} streamer 
     * @param {string|integer} chatter 
     */
    addBan(streamer, chatter) {
        streamer = parseIntIfPossible(streamer);
        chatter = parseIntIfPossible(chatter);
        if (!this.banStore.hasOwnProperty(streamer)) this.banStore[streamer] = {};

        this.banStore[streamer] = [
            ...this.banStore[streamer],
            chatter,
        ]
    }

    addTimeout(streamer, chatter) {
        streamer = parseIntIfPossible(streamer);
        chatter = parseIntIfPossible(chatter);
        if (!this.timeoutStore.hasOwnProperty(streamer)) this.timeoutStore[streamer] = {};

        this.timeoutStore[streamer] = [
            ...this.timeoutStore[streamer],
            chatter,
        ]
    }
}

module.exports = new PunishmentStore();