const FullIdentity = require("../FullIdentity");
const TwitchUser = require("../Twitch/TwitchUser");

class Vote {

    /**
     * The identity of the user that submitted the vote
     * @type {FullIdentity}
     */
    identity;

    /**
     * The streamer the vote was for
     * @type {TwitchUser}
     */
    streamer;

    /**
     * The type of vote
     * @type {"small"|"big"}
     */
    type;

    /**
     * The time the vote was submitted
     * @type {Date}
     */
    submitted;

    /**
     * Constructor for a Vote
     * @param {FullIdentity} identity 
     * @param {TwitchUser} streamer 
     * @param {"small"|"big"} type
     * @param {Date} submitted 
     */
    constructor(identity, streamer, type, submitted) {
        this.identity = identity;
        this.streamer = streamer;
        this.type = type;
        this.submitted = submitted;
    }

}

module.exports = Vote;
