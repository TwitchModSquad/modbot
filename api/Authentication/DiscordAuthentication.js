const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const config = require("../../config.json");

const SCOPES = "guilds.join identify";

class DiscordAuthentication {

    DISCORD_URL = `https://discord.com/api/oauth2/authorize?client_id=${config.discord_auth.client_id}&redirect_uri=${encodeURIComponent(config.api_domain + "auth/discord")}&response_type=code&scope=${encodeURIComponent(SCOPES)}`;
    DISCORD_REDIRECT = config.api_domain + "auth/discord";
    
    CONNECT_DISCORD_URL = `https://discord.com/api/oauth2/authorize?client_id=${config.discord_auth.client_id}&redirect_uri=${encodeURIComponent(config.api_domain + "connect/discord")}&response_type=code&scope=${encodeURIComponent(SCOPES)}`;
    CONNECT_REDIRECT = config.api_domain + "connect/discord";

    async getToken(code, connect = false) {
        const oauthResult = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams({
                client_id: config.discord_auth.client_id,
                client_secret: config.discord_auth.secret_id,
                code,
                grant_type: 'authorization_code',
                redirect_uri: connect ? this.CONNECT_REDIRECT : this.DISCORD_REDIRECT,
                scope: 'identify',
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        return await oauthResult.json();
    }
    
    async getUser(accessToken, tokenType) {
        const userResult = await fetch('https://discord.com/api/users/@me', {
            method: 'GET',
            headers: {
                authorization: `${tokenType} ${accessToken}`,
            },
        });
        return await userResult.json();
    }

}

module.exports = DiscordAuthentication;