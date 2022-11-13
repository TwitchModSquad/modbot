const con = require("../database");
const api = require("../api/");

const REFRESH_INTERVAL = 60; // seconds

class RefreshTokens {
    /**
     * Stores streamer refresh tokens
     */
    refreshTokens = {};

    /**
     * Constructor for RefreshTokens
     */
    constructor() {
        this.resetRefreshTokens();
        setInterval(this.resetRefreshTokens, REFRESH_INTERVAL * 1000);
    }
    
    resetRefreshTokens() {
        let newTable = {};
    
        con.query("select id, refresh_token from twitch__user where scopes like '%moderation:read%';", (err, res) => {
            if (!err) {
                res.forEach(row => {
                    newTable[row.id] = row.refresh_token;
                });
                this.refreshTokens = newTable;
            } else api.Logger.warning(err);
        });
    }

    /**
     * Retreives a refresh token for a streamer ID
     * @param {number} streamerId 
     * @return {string} Refresh token
     */
    getStreamerToken(streamerId) {
        return this.refreshTokens.hasOwnProperty(streamerId)
            ? this.refreshTokens[streamerId]
            : null;
    }

    /**
     * Checks if a streamer ID has a refresh token
     * @param {number} streamerId 
     * @return {boolean}
     */
    hasStreamerToken(streamerId) {
        return this.refreshTokens.hasOwnProperty(streamerId);
    }

}

module.exports = new RefreshTokens();