const con = require("../../database");
const api = require("../../api");

const punishmentStore = require("../PunishmentStore");

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

            punishmentStore.addBan(streamer.id, chatter.id);

            con.query("insert into twitch__hourlystats (time, bans) values (DATE_FORMAT(NOW(), '%Y-%m-%d %H:00'), 1) on duplicate key update bans = bans + 1;", err => {
                if (err) api.Logger.warning(err);
            });
        } else {
            api.Logger.warning(`Not logging ban in #${streamer.login} due to exceeding BPM threshold (${BPM_LOG_MAXIMUM})`)
        }
    }
};

module.exports = listener;