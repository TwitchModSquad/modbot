import {sequelize} from "@modbot/utils";
import {Job} from "./types";

export default {
    name: "update-chat-activity",
    cron: "0 4 * * *",
    execute: async () => {
        await sequelize.query("TRUNCATE TABLE twitch__chat_activity;");
        await sequelize.query(
            `INSERT INTO twitch__chat_activity (streamerId, chatterId, lastMessageDate, count)
        SELECT
            streamerId,
            chatterId,
            MAX(createdAt) AS last_activity,
            COUNT(*) AS count
        FROM twitch__chats
        GROUP BY streamerId, chatterId;`);
    }
} as Job;