const con = require("../../database");
const {Logger} = require("../../api");
const punishmentStore = require("../PunishmentStore");

const listener = {
    name: "updatePunishmentStoreBan",
    eventName: "message",
    listener: async (streamer, chatter, tags, message, self) => {
        if (punishmentStore.isBanned(streamer.id, chatter.id)) {
            con.query("update twitch__ban set active = false where streamer_id = ? and user_id = ?;", [streamer.id, chatter.id], err => {
                if (err) {
                    Logger.warning(err);
                } else {
                    punishmentStore.removeBan(streamer.id, chatter.id);
                }
            });
        }
    }
};

module.exports = listener;