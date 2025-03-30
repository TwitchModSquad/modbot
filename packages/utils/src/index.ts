import dotenv from "dotenv";

dotenv.config({path: "../../.env"});

import logger from "./logger";

import {ServiceType} from "./enums";
import {checkRequired} from "./environment";
import {connect} from "./models";

export {default as logger} from "./logger";
export * from "./enums";
export * from "./models";
export * from "./types";
export {default as twitchApi} from "./twitch";
export * from "./twitch";
export {default as redis} from "./redis";
export * from "./redis";

export * from "./managers";

export const initialize = async (service: ServiceType) => {
    logger.info(`Initializing utils as '${service}' service`);
    checkRequired(service);
    await connect();
}
