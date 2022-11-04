function parseIntIfPossible(str) {
    try {
        return parseInt(str);
    } catch(e) {
        
    }
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

    addBan(streamer, chatter) {
        streamer = parse
        if (!this.banStore.hasOwnProperty(streamer)) this.banStore[streamer] = {};

        this.banStore[streamer] = [
            ...this.banStore[streamer],
            chatter,
        ]
    }
}

module.exports = PunishmentStore;