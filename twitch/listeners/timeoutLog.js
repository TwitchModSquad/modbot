const con = require("../../database");
const punishmentStore = require("../PunishmentStore");

const listener = {
    name: "timeoutLog",
    eventName: "timeout",
    listener: async (streamer, chatter, duration, timeto, userstate) => {
        con.query("insert into twitch__timeout (streamer_id, user_id, timeto, duration) values (?, ?, ?, ?);", [
            streamer.id,
            chatter.id,
            timeto,
            duration,
        ]);

        punishmentStore.addTimeout(streamer.id, chatter.id);
        
        con.query("insert into twitch__hourlystats (time, timeouts) values (DATE_FORMAT(NOW(), '%Y-%m-%d %H:00'), 1) on duplicate key update timeouts = timeouts + 1;", err => {
            if (err) api.Logger.warning(err);
        });
    }
};

module.exports = listener;