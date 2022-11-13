const con = require("../../database");
const {Logger} = require("../../api");

const listener = {
    name: "updateIndexes",
    eventName: "message",
    listener: async (streamer, chatter, tags, message, self) => {
        con.query("insert into twitch__chat_streamers (streamer_id, chat_count) values (?, 1) on duplicate key update chat_count = chat_count + 1;", [streamer.id], err => {
            if (err) Logger.warning(err);
        });

        con.query("insert into twitch__chat_chatters (streamer_id, chatter_id, chat_count, last_active) values (?, ?, 1, ?) on duplicate key update chat_count = chat_count + 1, last_active = ?;", [streamer.id, chatter.id, tags["tmi-sent-ts"], tags["tmi-sent-ts"]], err => {
            if (err) Logger.warning(err);
        });
    }
};

module.exports = listener;