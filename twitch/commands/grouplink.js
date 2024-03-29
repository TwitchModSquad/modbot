const api = require("../../api");
const con = require("../../database");

const config = require("../../config.json");

module.exports = {
    name: "grouplink",
    description: "Sends a link to view group information on the TMS website",
    async execute(streamer, chatter, tags, alias, args, message) {
        const handleError = err => {
            global.client.ban.say(streamer.login, chatter.display_name + ", an error occurred while processing this command!");
            api.Logger.severe(err);
        }

        con.query("select id from group__user join `group` on `group`.id = group__user.group_id where group__user.user_id = ? and `group`.active order by `group`.starttime asc;", [streamer.id], (err, res) => {
            if (!err) {
                if (res.length === 0) {
                    global.client.ban.say(streamer.login, streamer.display_name + " is not attached to an active group!")
                } else {
                    global.client.ban.say(streamer.login, `Visit ${config.pub_domain.replace("https://", "").replace("http://", "")}g/u/${encodeURI(streamer.login)} to view the active group!`)
                }
            } else {
                handleError(err);
            }
        });
    },
};
