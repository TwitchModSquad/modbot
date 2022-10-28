const TwitchUser = require("../../Twitch/TwitchUser");

class Rule {
    
    /**
     * Type of this rule
     * @type {"streamer"|"moderator"|"reason"|"chatlog"}
     */
    type;

    /**
     * Value of this rule
     * @type {string}
     */
    value;

    /**
     * The user represented by this rule, if available
     * @type {TwitchUser?}
     */
    user;

    /**
     * Returns the Twitch user of this rule, if the type is "streamer" or "moderator"
     * @return {Promise<TwitchUser>}
     */
    getUser() {
        return new Promise((resolve, reject) => {
            if (type === "streamer" || type === "moderator") {
                global.api.Twitch.getUserById(this.value).then(user => {
                    this.user = user;
                    resolve(user);
                }, reject);
            } else {
                reject("Rule type must be 'streamer' or 'moderator'");
            }
        });
    }

    /**
     * 
     * @param {"streamer"|"moderator"|"reason"|"chatlog"} type 
     * @param {string} value 
     * @param {TwitchUser?} user 
     */
    constructor(type, value, user = null) {
        this.type = type;
        this.value = value;
        this.user = user;
    }

}

module.exports = Rule;