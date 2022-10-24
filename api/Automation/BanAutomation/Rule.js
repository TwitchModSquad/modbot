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
     * Returns the Twitch user of this rule, if the type is "streamer" or "moderator"
     * @return {Promise<TwitchUser>}
     */
    getUser() {
        return new Promise((resolve, reject) => {
            if (type === "streamer" || type === "moderator") {
                global.api.Twitch.getUserById(this.value).then(resolve, reject);
            } else {
                reject("Rule type must be 'streamer' or 'moderator'");
            }
        });
    }

    /**
     * 
     * @param {"streamer"|"moderator"|"reason"|"chatlog"} type 
     * @param {string} value 
     */
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }

}

module.exports = Rule;