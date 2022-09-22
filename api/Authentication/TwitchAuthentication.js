const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const config = require("../../config.json");

const NORMAL_SCOPES = "user:read:email moderator:manage:banned_users";
const STREAMER_SCOPES = "user:read:email moderator:manage:banned_users moderation:read";

class TwitchAuthentication {

    TWITCH_URL = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${config.twitch.client_id}&redirect_uri=${encodeURIComponent(config.api_domain + "auth2/twitch")}&scope=${encodeURIComponent(NORMAL_SCOPES)}`;
    TWITCH_STREAMER_URL = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${config.twitch.client_id}&redirect_uri=${encodeURIComponent(config.api_domain + "auth2/twitch")}&scope=${encodeURIComponent(STREAMER_SCOPES)}`;
    TWITCH_REDIRECT = config.api_domain + "auth2/twitch";
    
    /**
     * Given an oauth code from the redirected Twitch request, requests a refresh token and client token from Twitch
     * @param {string} code 
     * @returns {Promise<{access_token: string, expires_in: number, refresh_token: string, scope: object, token_type: string}>}
     */
    async getToken(code) {
        const oauthResult = await fetch("https://id.twitch.tv/oauth2/token", {
            method: 'POST',
            body: new URLSearchParams({
                client_id: config.twitch.client_id,
                client_secret: config.twitch.client_secret,
                code: code,
                grant_type: "authorization_code",
                redirect_uri: this.TWITCH_REDIRECT,
            }),
        });

        return await oauthResult.json();
    }

    /**
     * Given an access token, retrieve the user ID under that token.
     * @returns {Promise<{id: string, login: string, display_name: string, type: string, broadcaster_type: string, description: string, profile_image_url: string, offline_image_url: string, view_count: number, email: string, created_at: string>}
     */
    async getUser(accessToken) {
        const userResult = await fetch('https://api.twitch.tv/helix/users', {
            method: 'GET',
            headers: {
                ["Client-ID"]: config.twitch.client_id,
                Authorization: `Bearer ${accessToken}`,
            },
        });

        let json;
        try {
            json = await userResult.json()
        } catch (err) {
            throw new Error(err);
        }

        if (json.data?.length === 1) {
            return json.data[0];
        } else {
            throw new Error(json.data?.length + " results were returned, expected 1");
        }
    }

    /**
     * Parses scopes to a string for storing in the database
     * @param {object} scopes 
     * @returns {string}
     */
    textifyScopes(scopes) {
        let result = "";
        scopes.forEach(scope => {
            if (result !== "") {
                result += "\n";
            }
            result += scope;
        })
    }

    /**
     * Parses scopes to an object from a string in the database
     * @param {string} scopes 
     * @returns {object}
     */
    objectifyScopes(scopes) {
        return scopes.split("\n");
    }

}

module.exports = TwitchAuthentication;