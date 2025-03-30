import {ApiClient} from "@twurple/api";
import {AccessTokenWithUserId, RefreshingAuthProvider} from "@twurple/auth";
import crypto from "crypto";
import Redis from "ioredis";
import {twitchTokens} from "./managers";
import logger from "./logger";

const BASE_TWITCH_URL = "https://id.twitch.tv/oauth2/authorize?response_type=code" +
    `&client_id=${encodeURIComponent(process.env.TWITCH_CLIENT_ID)}&redirect_uri=${encodeURIComponent(process.env.API_URI + "auth/twitch")}&scope={scope}&state={state}`;

const redis = new Redis(process.env.REDIS_URL);

const scopes = [
    "user:read:email",
    "moderator:manage:banned_users",
    "moderation:read",
    "user:read:moderated_channels",
    "chat:read",
];

export const getTwitchURL = async () => {
    const state = crypto.randomBytes(16).toString("hex");
    await redis.set(`state:${state}`, "1", "EX", 60 * 5);
    return BASE_TWITCH_URL
        .replace("{scope}", encodeURIComponent(scopes.join(" ")))
        .replace("{state}", encodeURIComponent(state));
}

export const verifyState = async (state: string): Promise<boolean> => {
    const value = await redis.get(`state:${state}`);
    if (value) {
        await redis.del(`state:${state}`);
        return true;
    }
    return false;
}

export const authProvider = new RefreshingAuthProvider({
    clientId: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET,
    redirectUri: process.env.API_URI + "auth/twitch",
});

authProvider.onRefresh((userId, token) => {
    const tokenWithId: AccessTokenWithUserId = {
        ...token, userId,
    };
    twitchTokens.set(userId, tokenWithId).then(
        () => logger.info(`Twitch user ${userId} token refreshed`),
        e => logger.error(e),
    );
});

const loadTokens = async () => {
    logger.info("Loading Twitch tokens...");
    let cursor = "0";
    let count = 0;

    do {
        const result = await redis.scan(cursor, "MATCH", "twitch:token:*", "COUNT", 100);
        cursor = result[0];
        const tokens = await twitchTokens.getMany(
            result[1].map(token => token.split(":")[2])
        );
        count += tokens.length;
        logger.info(`Loaded ${count} tokens`);
    } while (cursor !== "0");

    logger.info(`Finished loading ${count} Twitch tokens`);
}
loadTokens().catch(e => logger.error(e));

export default new ApiClient({
    authProvider,
});
