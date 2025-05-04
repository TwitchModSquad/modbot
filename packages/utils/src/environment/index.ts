import {ServiceType} from "../enums";

import logger from "../logger";

const globalEnvVars: string[] = [
    "NODE_ENV", "LOG_LEVEL",
    "DB_HOST", "DB_PORT", "DB_USER", "DB_PASS", "DB_NAME", "REDIS_URL",
    "TWITCH_CLIENT_ID", "TWITCH_CLIENT_SECRET",
    "DISCORD_MODBOT_TOKEN", "DISCORD_CLIENT_ID", "DISCORD_SECRET_ID",
    "WEB_URI", "API_URI", "DASHBOARD_URI", "DOMAIN",
];

const requiredEnvVars: Record<ServiceType, string[]> = {
    [ServiceType.API]: [
        ...globalEnvVars,
        "API_PORT",
    ],
    [ServiceType.DISCORD]: [
        ...globalEnvVars,
        "DISCORD_GUILD_ID",
    ],
    [ServiceType.TWITCH]: [
        ...globalEnvVars,
    ],
    [ServiceType.FRONT_END]: [
        ...globalEnvVars,
    ],
};

export const checkRequired = (service: ServiceType): void => {
    logger.info("Checking environment variables...");
    const missingVars: string[] = [];
    const requiredVars = requiredEnvVars[service];

    requiredVars.forEach(varName => {
        if (!process.env[varName]) {
            missingVars.push(varName);
        }
    });

    if (missingVars.length > 0) {
        throw new Error(`Missing environment variables for ${service}: ${missingVars.join(', ')}`);
    }
}