import {ApiClient} from "@twurple/api";
import {AccessTokenWithUserId, RefreshingAuthProvider} from "@twurple/auth";
import crypto from "crypto";
import {twitchTokens} from "./managers";
import logger from "./logger";
import redis from "./redis";
import {TwitchRole} from "./models";

const BASE_TWITCH_URL = "https://id.twitch.tv/oauth2/authorize?response_type=code" +
    `&client_id=${encodeURIComponent(process.env.TWITCH_CLIENT_ID)}&redirect_uri=${encodeURIComponent(process.env.PUBLIC_API_URI + "auth/twitch")}&scope={scope}&state={state}`;

const scopes = [
    "user:read:email",
    "moderator:manage:banned_users",
    "moderator:manage:automod",
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
    redirectUri: process.env.PUBLIC_API_URI + "auth/twitch",
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

let apiClient: ApiClient;

export const loadClient = async () => {
    logger.info("Loading Twitch tokens...");
    let cursor = "0";
    let count = 0;

    let hasBotToken = false;

    do {
        const result = await redis.scan(cursor, "MATCH", "twitch:token:*", "COUNT", 100);
        cursor = result[0];
        const tokens = await twitchTokens.getMany(
            result[1].map(token => token.split(":")[2])
        );

        const twitchRoles = await TwitchRole.findAll();

        for (const token of tokens) {
            let intents = [
                `chat:${token.userId}`,
                `mod:${token.userId}`,
            ]

            if (token.userId === process.env.TWITCH_USER_ID) {
                intents = [
                    "chat",
                    ...intents,
                ]
                hasBotToken = true;
            }

            for (const role of twitchRoles.filter(x => x.userId === token.userId)) {
                intents.push(`mod:${role.streamerId}`);
            }

            await authProvider.addUserForToken(token, intents);
            logger.debug(`Added token for user ${token.userId} with intents: ${intents.join(", ")}`);
        }

        count += tokens.length;
    } while (cursor !== "0");

    if (!hasBotToken) {
        logger.error("Missing bot token! Authenticate with the bot account and restart the service!");
    }

    logger.info(`Loaded ${count} tokens`);

    logger.info(`Finished loading ${count} Twitch tokens`);

    apiClient = new ApiClient({
        authProvider,
    });
}

export const getTwitchClient = () => {
    return apiClient;
}
