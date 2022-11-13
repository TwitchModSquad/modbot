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
    }
};

module.exports = listener;