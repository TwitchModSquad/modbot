import dotenv from "dotenv";

dotenv.config({path: "../../.env"});

import logger from "./logger";

import {ServiceType} from "./enums";
import {checkRequired} from "./environment";
import {connect} from "./models";

export {default as logger} from "./logger";
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

export const startTime = Date.now();

export const initialize = async (service: ServiceType) => {
    logger.info(`Initializing utils as '${service}' service`);
    checkRequired(service);
    await connect(service);
    await events.start(service);
    await loadClient();

    events.register("identify", (): IdentifyHandle => {
        return {
            type: service,
            servicePrefix: events.servicePrefix,
            startTime,
        };
    });
}
