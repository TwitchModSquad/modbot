import dotenv from "dotenv";

dotenv.config({path: "../../.env"});

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

import {events, IdentifyHandle} from "./managers";
import {loadClient} from "./twitch";
import statsManager from "./managers/StatsManager";

export const startTime = Date.now();

export const initialize = async (service: ServiceType) => {
    logger.info(`Initializing utils as '${service}' service`);

    // Check required environment variables
    checkRequired(service);

    // Sequelize connect
    await connect(service);

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
}
