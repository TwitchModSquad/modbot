import logger from "../logger";

import sequelize from "./database";
import {TwitchUser} from "./twitchuser.model";
import {TwitchChat} from "./twitchchat.model";
import {TwitchRole} from "./twitchrole.model";
import {TwitchBan} from "./twitchban.model";
import {TwitchTimeout} from "./twitchtimeout.model";
import {TwitchChatActivity} from "./twitchchatactivity.model";

export {default as sequelize} from "./database";
export * from "./discordchannel.model";
export * from "./discorduser.model";
export * from "./identity.model";
export * from "./twitchuser.model";
export * from "./twitchban.model";
export * from "./twitchtimeout.model";
export * from "./twitchchat.model";
export * from "./twitchrole.model";
export * from "./twitchchatactivity.model";
export * from "./twitchlive.model";

export const connect = async () => {
    logger.info(`Attempting to connect to MariaDB @ ${sequelize.config.host}`);
    await sequelize.authenticate();
    logger.info("Connection to MariaDB successful! Synchronizing...");

    // Twitch chat references
    TwitchUser.hasMany(TwitchChat, { foreignKey: "streamerId" });
    TwitchChat.belongsTo(TwitchUser, {
        foreignKey: "streamerId",
        as: "streamer",
    });

    TwitchUser.hasMany(TwitchChat, { foreignKey: "chatterId" });
    TwitchChat.belongsTo(TwitchUser, {
        foreignKey: "chatterId",
        as: "chatter",
    });

    // Twitch chat activity references
    TwitchUser.hasMany(TwitchChatActivity, { foreignKey: "streamerId" });
    TwitchChatActivity.belongsTo(TwitchUser, {
        foreignKey: "streamerId",
        as: "streamer",
    });

    TwitchUser.hasMany(TwitchChatActivity, { foreignKey: "chatterId" });
    TwitchChatActivity.belongsTo(TwitchUser, {
        foreignKey: "chatterId",
        as: "chatter",
    });

    // Twitch ban references
    TwitchUser.hasMany(TwitchBan, { foreignKey: "streamerId" });
    TwitchBan.belongsTo(TwitchUser, {
        foreignKey: "streamerId",
        as: "streamer",
    });

    TwitchUser.hasMany(TwitchBan, { foreignKey: "chatterId" });
    TwitchBan.belongsTo(TwitchUser, {
        foreignKey: "chatterId",
        as: "chatter",
    });

    TwitchUser.hasMany(TwitchBan, { foreignKey: "moderatorId" });
    TwitchBan.belongsTo(TwitchUser, {
        foreignKey: "moderatorId",
        as: "moderator",
    });

    // Twitch timeout references
    TwitchUser.hasMany(TwitchTimeout, { foreignKey: "streamerId" });
    TwitchTimeout.belongsTo(TwitchUser, {
        foreignKey: "streamerId",
        as: "streamer",
    });

    TwitchUser.hasMany(TwitchTimeout, { foreignKey: "chatterId" });
    TwitchTimeout.belongsTo(TwitchUser, {
        foreignKey: "chatterId",
        as: "chatter",
    });

    TwitchUser.hasMany(TwitchTimeout, { foreignKey: "moderatorId" });
    TwitchTimeout.belongsTo(TwitchUser, {
        foreignKey: "moderatorId",
        as: "moderator",
    });

    // Twitch role references
    TwitchUser.hasMany(TwitchRole, {
        foreignKey: "userId",
        as: "roles",
    });

    TwitchUser.hasMany(TwitchRole, {
        foreignKey: "streamerId",
        as: "ownedRoles",
    });

    TwitchRole.belongsTo(TwitchUser, {
        foreignKey: "userId",
        as: "user",
    });

    TwitchRole.belongsTo(TwitchUser, {
        foreignKey: "streamerId",
        as: "streamer",
    });

    logger.info("Synchronization complete!");

}
