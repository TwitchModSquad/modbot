class TwitchUsername {

    /**
     * Twitch ID that owns/used to own this username
     * @type {number}
     */
    id;

    /**
     * The username in question
     * @type {string}
     */
    name;

    /**
     * The time that this username was first seen
     * @type {Date}
     */
    firstSeen;

    /**
     * The time that this username was last seen, or null if it's the most recent username
     * @type {Date?}
     */
    lastSeen;

    /**
     * Constructor for a TwitchUsername
     * @param {number} id 
     * @param {string} name 
     * @param {Date} firstSeen 
     * @param {Date?} lastSeen 
     */
    constructor(id, name, firstSeen, lastSeen) {
        this.id = id;
        this.name = name;
        this.firstSeen = firstSeen;
        this.lastSeen = lastSeen;
    }

}

module.exports = TwitchUsername;