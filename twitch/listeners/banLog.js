const con = require("../../database");
const api = require("../../api");

const BPM_LOG_MAXIMUM = 30;

const listener = {
    name: "banLog",
    eventName: "ban",
    listener: async (streamer, chatter, timebanned, userstate, bpm) => {
        if (bpm < BPM_LOG_MAXIMUM) {
            con.query("insert into twitch__ban (timebanned, streamer_id, user_id) values (?, ?, ?);", [
                timebanned,
                streamer.id,
                chatter.id,
            ], err => {
                if (err) api.Logger.severe(err);
            });
        } else {
            api.Logger.warning(`Not logging ban in #${streamer.login} due to exceeding BPM threshold (${BPM_LOG_MAXIMUM})`)
        }
    }
};

module.exports = listener;