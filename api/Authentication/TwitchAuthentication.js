const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const config = require("../../config.json");

const con = require("../../database");

const NORMAL_SCOPES = "user:read:email moderator:manage:banned_users";
const STREAMER_SCOPES = "user:read:email moderator:manage:banned_users moderation:read";
const ADD_MODERATOR_SCOPES = "user:read:email channel:manage:moderators";

class TwitchAuthentication {

    TWITCH_URL = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${config.twitch.client_id}&redirect_uri=${encodeURIComponent(config.api_domain + "auth/twitch")}&scope=${encodeURIComponent(NORMAL_SCOPES)}`;
    TWITCH_STREAMER_URL = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${config.twitch.client_id}&redirect_uri=${encodeURIComponent(config.api_domain + "auth/twitch")}&scope=${encodeURIComponent(STREAMER_SCOPES)}`;
    TWITCH_ADDMOD_URL = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${config.twitch.client_id}&redirect_uri=${encodeURIComponent(config.api_domain + "auth/twitch")}&scope=${encodeURIComponent(ADD_MODERATOR_SCOPES)}`;
    TWITCH_REDIRECT = config.api_domain + "auth/twitch";
    
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
        return result;
    }

    /**
     * Parses scopes to an object from a string in the database
     * @param {string} scopes 
     * @returns {object}
     */
    objectifyScopes(scopes) {
        return scopes.split("\n");
    }

    /**
     * Utilizes a refresh token to obtain an access token for a user.
     * @param {string} refresh_token 
     * @returns 
     */
    getAccessToken(refresh_token) {
        return new Promise(async (resolve, reject) => {
            const oauthResult = await fetch("https://id.twitch.tv/oauth2/token", {
                method: 'POST',
                body: new URLSearchParams({
                    client_id: config.twitch.client_id,
                    client_secret: config.twitch.client_secret,
                    refresh_token: refresh_token,
                    grant_type: "refresh_token",
                }),
            });
        
            oauthResult.json().then(oauthData => {
                if (oauthData?.access_token) {
                    resolve(oauthData.access_token);
                } else {
                    global.api.Logger.severe(oauthData);

                    if (oauthData?.message === "Invalid refresh token") {
                        con.query("update twitch__user set refresh_token = null, scopes = null where refresh_token = ?;", [refresh_token], err => {
                            if (err) global.api.Logger.warning(err);
                        });
                    }

                    reject("Unable to request access token, reason: " + oauthData?.message);
                }
            }, reject);
        });
    }

}

module.exports = TwitchAuthentication;