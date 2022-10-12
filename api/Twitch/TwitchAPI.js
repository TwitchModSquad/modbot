const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const config = require("../../config.json");

/**
 * Custom class for Helix calls
 */
class TwitchAPI {
    /**
     * Bans a user in the specified channel utilizing an access token
     * @param {number} broadcaster_id 
     * @param {number} moderator_id 
     * @param {string} access_token 
     * @param {number} user_id 
     * @param {string} reason 
     * @returns {Promise}
     */
    banUser(broadcaster_id, moderator_id, access_token, user_id, reason) {
        return new Promise(async (resolve, reject) => {
            const oauthResult = await fetch(`https://api.twitch.tv/helix/moderation/bans?broadcaster_id=${encodeURIComponent(broadcaster_id)}&moderator_id=${encodeURIComponent(moderator_id)}`, {
                method: 'POST',
                headers: {
                    Authorization: "Bearer " + access_token,
                    "Client-Id": config.twitch.client_id,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({data:{user_id: user_id, reason: reason}}),
            });
        
            oauthResult.json().then(resolve, reject);
        });
    }

    modUser(broadcaster_id, user_id, access_token) {
        return new Promise(async (resolve, reject) => {
            const oauthResult = await fetch(`https://api.twitch.tv/helix/moderation/moderators?broadcaster_id=${encodeURIComponent(broadcaster_id)}&user_id=${encodeURIComponent(user_id)}`, {
                method: 'POST',
                headers: {
                    Authorization: "Bearer " + access_token,
                    "Client-Id": config.twitch.client_id,
                },
            });
        
            if (oauthResult.status === 204) {
                resolve();
            } else {
                reject(oauthResult.status + " " + oauthResult.statusText);
            }
        });
    }
}

module.exports = TwitchAPI;