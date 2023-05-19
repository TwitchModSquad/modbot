const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const config = require("../../config.json");

const con = require("../../database");

class TwitchAuthentication {

    TWITCH_URL = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${config.twitch.client_id}&redirect_uri={redirectURI}&scope={scope}`;
    TWITCH_REDIRECT = config.api_domain + "auth/twitch";
    DATABASE_REDIRECT = config.db_domain + "auth/twitch";
    CONNECT_REDIRECT = config.api_domain + "connect";

    /**
     * Returns the OAuth2 URI given the scopes & redirect URI
     * @param {string} scope 
     * @param {string} redirectURI 
     * @returns {string}
     */
    getURL(scope, redirectURI = this.TWITCH_REDIRECT) {
        return this.TWITCH_URL
            .replace("{scope}", encodeURIComponent(scope))
            .replace("{redirectURI}", encodeURIComponent(redirectURI));
    }
    
    /**
     * Given an oauth code from the redirected Twitch request, requests a refresh token and client token from Twitch
     * @param {string} code 
     * @param {string} redirectURI
     * @returns {Promise<{access_token: string, expires_in: number, refresh_token: string, scope: object, token_type: string}>}
     */
    async getToken(code, redirectURI = this.TWITCH_REDIRECT) {
        const oauthResult = await fetch("https://id.twitch.tv/oauth2/token", {
            method: 'POST',
            body: new URLSearchParams({
                client_id: config.twitch.client_id,
                client_secret: config.twitch.client_secret,
                code: code,
                grant_type: "authorization_code",
                redirect_uri: redirectURI,
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
     * @returns {Promise<string>}
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

    /**
     * Gets a role via path, access token, and broadcaster ID
     * @param {string} path 
     * @param {string} accessToken 
     * @param {number} broadcasterId 
     * @returns {Promise<TwitchUser>}
     */
    getRole(path, accessToken, broadcasterId) {
        return new Promise(async (resolve, reject) => {
            let result = [];
            const get = async cursor => {
                return await fetch("https://api.twitch.tv/helix/"+path+"?first=100&broadcaster_id=" + encodeURIComponent(broadcasterId) + (cursor !== null ? "&after=" + cursor : ""), {
                    method: 'GET',
                    headers: {
                        ["Client-ID"]: config.twitch.client_id,
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
            }

            try {
                let cursor = null;
                while(true) {
                    let json = await (await get(cursor)).json();

                    for (let i = 0; i < json.data.length; i++) {
                        result = [
                            ...result,
                            await global.api.Twitch.getUserById(json.data[i].user_id, false, true)
                        ]
                    }

                    if (json.pagination?.cursor) {
                        cursor = json.pagination.cursor;
                    } else break;
                }
                resolve(result);
            } catch(err) {
                reject(err);
                return;
            }
        });
    }

    /**
     * Returns a list of VIPs for a user access token
     * @param {string} accessToken 
     * @param {number} broadcasterId
     * @returns {Promise<TwitchUser[]>}
     */
    getVIPs(accessToken, broadcasterId) {
        return this.getRole("channels/vips", accessToken, broadcasterId)
    }

    /**
     * Returns a list of moderators for a user access token
     * @param {string} accessToken 
     * @param {number} broadcasterId
     * @returns {Promise<TwitchUser[]>}
     */
    getMods(accessToken, broadcasterId) {
        return this.getRole("moderation/moderators", accessToken, broadcasterId)
    }

    /**
     * Returns a list of editors for a user access token
     * @param {string} accessToken 
     * @param {number} broadcasterId
     * @returns {Promise<TwitchUser[]>}
     */
    getEditors(accessToken, broadcasterId) {
        return this.getRole("channels/editors", accessToken, broadcasterId)
    }

    /**
     * Gets bans via access token and broadcaster ID
     * @param {string} accessToken 
     * @param {number} broadcasterId 
     * @returns {Promise<TwitchUser>}
     */
    getBans(accessToken, broadcasterId) {
        return new Promise(async (resolve, reject) => {
            let result = [];
            const get = async cursor => {
                return await fetch("https://api.twitch.tv/helix/moderation/banned?first=100&broadcaster_id=" + encodeURIComponent(broadcasterId) + (cursor !== null ? "&after=" + cursor : ""), {
                    method: 'GET',
                    headers: {
                        ["Client-ID"]: config.twitch.client_id,
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
            }

            try {
                let cursor = null;
                while(true) {
                    let json = await (await get(cursor)).json();

                    for (let i = 0; i < json.data.length; i++) {
                        result = [
                            ...result,
                            await global.api.Twitch.getUserById(json.data[i].user_id, false, true)
                        ]
                    }

                    if (json.pagination?.cursor) {
                        cursor = json.pagination.cursor;
                    } else break;
                }
                resolve(result);
            } catch(err) {
                reject(err);
                return;
            }
        });
    }

}

module.exports = TwitchAuthentication;