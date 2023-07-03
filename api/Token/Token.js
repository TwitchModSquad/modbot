const TwitchUser = require("../Twitch/TwitchUser");

class Token {

    /**
     * Surrogate ID for the token
     * @type {number}
     */
    id;
    
    /**
     * Owner of the token
     * @type {TwitchUser}
     */
    user;

    /**
     * The token
     * @type {string}
     */
    token;

    /**
     * Scopes of the token
     * @type {string[]}
     */
    scopes;

    /**
     * Constructor for a Token
     * @param {number} id
     * @param {TwitchUser} user 
     * @param {string} token 
     * @param {string[]} scopes 
     */
    constructor(id, user, token, scopes) {
        this.id = id;
        this.user = user;
        this.token = token;
        this.scopes = scopes;
    }

    /**
     * Retrieves the Access Token from the Refresh Token
     * @returns {Promise<string>}
     */
    getToken() {
        return global.api.Authentication.Twitch.getAccessToken(this.token);
    }

}

module.exports = Token;
