const con = require("../../database");
const api = require("../../api/");

const listener = {
    name: "messageLog",
    eventName: "message",
    listener: async (streamer, chatter, tags, message, self) => {
        let emotes = tags["emotes-raw"];
        if (emotes?.length > 512)
            emotes = null;

        con.query("insert into twitch__chat (id, streamer_id, user_id, message, emotes, badges, color, timesent) values (?, ?, ?, ?, ?, ?, ?, ?);", [
            tags.id,
            streamer.id,
            chatter.id,
            message,
            emotes,
            tags["badges-raw"],
            tags["color"],
            tags["tmi-sent-ts"],
        ], err => {
            if (err) api.Logger.warning(err);
        });

        con.query("insert into twitch__hourlystats (time, messages) values (DATE_FORMAT(NOW(), '%Y-%m-%d %H:00'), 1) on duplicate key update messages = messages + 1;", err => {
            if (err) api.Logger.warning(err);
        });
    }
};

module.exports = listener;