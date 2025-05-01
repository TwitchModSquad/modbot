import {RedisObjectManager, RawDiscordUser} from "../../";
import {discordUsers} from "../index";

const REDIRECT_URI = process.env.API_URI + "auth/discord";

export interface DiscordToken {
    access_token: string;
    token_type: string;
    expires_at: number;
    refresh_token: string;
    scope: string;
}

class DiscordTokenManager extends RedisObjectManager<DiscordToken> {

    constructor() {
        super("discord:token");
    }

    getURI(): string {
        const scope = ["identify", "guilds", "guilds.join"].join(" ");
        return `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}`;
    }

    async exchangeCode(code: string): Promise<{token: DiscordToken, user: RawDiscordUser}|null> {
        const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_SECRET_ID,
                grant_type: "authorization_code",
                code, redirect_uri: REDIRECT_URI,
            }),
        });

        const tokenData = await tokenRes.json();

        if (!tokenData || !tokenData.access_token) {
            return null;
        }

        const token: DiscordToken = {
            access_token: tokenData.access_token,
            token_type: tokenData.token_type,
            expires_at: Date.now() + tokenData.expires_in,
            refresh_token: tokenData.refresh_token,
            scope: tokenData.scope,
        };

        const userRes = await fetch("https://discord.com/api/users/@me", {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            }
        });
        const userData = await userRes.json();

        if (!userData || !userData.id) {
            return null;
        }

        const user = await discordUsers.get(userData.id, true);

        await this.set(userData.id, token);

        return {
            token,
            user,
        };
    }

}

export default new DiscordTokenManager();
