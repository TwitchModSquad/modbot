const api = require("../../api");
const con = require("../../database");

const config = require("../../config.json");

module.exports = {
    name: "multitwitch",
    description: "Generates a multitwitch link for the active group",
    async execute(streamer, chatter, tags, alias, args, message) {
        const handleError = err => {
            global.client.ban.say(streamer.display_name.toLowerCase(), chatter.display_name + ", an error occurred while processing this command!");
            api.Logger.severe(err);
        }

        con.query("select id from group__user join `group` on `group`.id = group__user.group_id where group__user.user_id = ? and `group`.active order by `group`.starttime asc;", [streamer.id], (err, res) => {
            if (!err) {
                if (res.length === 0) {
                    global.client.ban.say(streamer.display_name.toLowerCase(), streamer.display_name + " is not attached to an active group!")
                } else if (res.length === 1) {
                    api.getGroupById(res[0].id).then(group => {
                        global.client.ban.say(streamer.display_name.toLowerCase(), `View the stream on multitwitch at ${group.generateMultiLink("multitwitch.tv")}`);
                    }, handleError)
                } else {
                    global.client.ban.say(streamer.display_name.toLowerCase(), `${streamer.display_name} is attached to more than one group! Visit ${config.pub_domain.replace("https://", "").replace("http://", "")}g/u/${encodeURI(streamer.display_name.toLowerCase())} for more information!`)
                }
            } else {
                handleError(err);
            }
        });
    },
};
