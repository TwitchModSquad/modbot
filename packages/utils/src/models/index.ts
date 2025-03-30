import logger from "../logger";

import sequelize from "./database";

export * from "./discorduser.model";
export * from "./identity.model";
export * from "./twitchuser.model";

export const connect = async () => {
    logger.info(`Attempting to connect to MariaDB @ ${sequelize.config.host}`);
    await sequelize.authenticate();
    logger.info("Connection to MariaDB successful! Synchronizing...");
    await sequelize.sync({alter: process.env.NODE_ENV === "development"});
    logger.info("Synchronization complete!");
}
