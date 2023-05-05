const TwitchUser = require("./TwitchUser");

class TwitchRole {

    /**
     * The user which has the role
     * @type {TwitchUser}
     */
    user;

    /**
     * The user in which the role is had
     * @type {TwitchUser}
     */
    streamer;

    /**
     * The role type in question
     * @type {"editor"|"moderator"|"vip"}
     */
    role;

    /**
     * The date in which this record was first retrieved
     * @type {Date}
     */
    firstKnown;

    /**
     * The date in which this record was last retrieved
     * @type {Date}
     */
    updated;

    /**
     * The date in which the role was seen as missing
     * If null, this role should be active.
     * @type {Date?}
     */
    lastKnown;

    /**
     * The source in which this record was retrieved
     * @type {"twitch"|"3v.fi"|"legacy"}
     */
    source;

    /**
     * Visibility of this role
     * @type {"public"|"auth"|"private"}
     */
    visibility;

    constructor(user, streamer, role, firstKnown, updated, lastKnown, source, visibility) {
        this.user = user;
        this.streamer = streamer;
        this.role = role;
        this.firstKnown = firstKnown;
        this.updated = updated;
        this.lastKnown = lastKnown;
        this.source = source;
        this.visibility = visibility;
    }

}

module.exports = TwitchRole;