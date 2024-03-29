const api = require("../../api");
const con = require("../../database");

const config = require("../../config.json");

module.exports = {
    name: "group",
    description: "Displays current group information in the streamer's channel",
    async execute(streamer, chatter, tags, alias, args, message) {
        const handleError = err => {
            global.client.ban.say(streamer.login, chatter.display_name + ", an error occurred while processing this command!");
            api.Logger.severe(err);
        }

        con.query("select id from group__user join `group` on `group`.id = group__user.group_id where group__user.user_id = ? and `group`.active order by `group`.starttime asc;", [streamer.id], (err, res) => {
            if (!err) {
                if (res.length === 0) {
                    global.client.ban.say(streamer.login, streamer.display_name + " is not attached to an active group!")
                } else if (res.length === 1) {
                    api.Group.getGroupById(res[0].id).then(async group => {
                        global.client.ban.say(streamer.login, await group.generateGroupString(streamer));
                    }, handleError)
                } else {
                    global.client.ban.say(streamer.login, `${streamer.display_name} is attached to more than one group! Visit ${config.pub_domain.replace("https://", "").replace("http://", "")}g/u/${encodeURI(streamer.login)} for more information!`)
                }
            } else {
                handleError(err);
            }
        });
    },
};
