import dotenv from "dotenv";
import path from "path";


dotenv.config({path: path.resolve(__dirname, "../../../.env")});

import logger from "./logger";

import {ServiceType} from "./enums";
import {checkRequired} from "./environment";
import {connect} from "./models";

export {default as logger} from "./logger";
export * from "./classes";
export * from "./enums";
export * from "./interfaces";
export * from "./models";
export * from "./types";
export * from "./twitch";
export {default as redis} from "./redis";
export * from "./redis";
export * from "./managers";
export * from "./utils";

import {events, IdentifyHandle} from "./managers";
import {loadClient} from "./twitch";
import statsManager from "./managers/StatsManager";
import {UptimeHeartbeat} from "./classes/UptimeHeartbeat";

export const startTime = Date.now();

export const initialize = async (service: ServiceType, heartbeatEnv: string = null) => {
    logger.info(`Initializing utils as '${service}' service`);

    // Check required environment variables
    checkRequired(service);

    // Sequelize connect
    await connect();

    // Start the event manager
    await events.start(service);

    // Load the Twitch client
    await loadClient();

    // Register stats manager utilities
    statsManager.register(service);

    // Register the identify event for this service
    events.register("identify", (): IdentifyHandle => {
        return {
            type: service,
            servicePrefix: events.servicePrefix,
            startTime,
        };
    });

    // Start uptime heartbeat if env exists
    if (heartbeatEnv) {
        const heartbeatUrl = process.env[heartbeatEnv];
        if (!heartbeatUrl || heartbeatUrl.trim() === "" || heartbeatUrl.trim() === "undefined") {
            logger.warn(`No heartbeat URL found for service '${service}'`);
        } else {
            try {
                new URL(heartbeatUrl); // Validate URL format
                logger.warn(service);
                new UptimeHeartbeat(heartbeatUrl, 55_000);
            } catch (e) {
                logger.error(`Invalid heartbeat URL "${heartbeatUrl}" for service "${service}": ${e.message}`);
            }
        }
    }
}
