const api = require("../../api");
const con = require("../../database");

module.exports = {
    name: "stopgroup",
    description: "Stops any active groups for this streamer if the streamer is the host of the event",
    async execute(streamer, chatter, tags, alias, args, message) {
        const handleError = err => {
            global.client.ban.say(streamer.display_name.toLowerCase(), chatter.display_name + ", an error occurred while processing this command!");
            api.Logger.severe(err);
        }

        const handleExpectedError = err => {
            global.client.ban.say(streamer.display_name.toLowerCase(), chatter.display_name + ", " + err);
        }

        const badges = tags.badges || {};

        if (badges.broadcaster || badges.moderator) {
            if (chatter.identity?.id) {
                api.getFullIdentity(chatter.identity.id).then(identity => {
                    con.query("select group_id from tms.group__user as u join `group` as g on g.id = u.group_id where u.user_id = ? and g.active;", [streamer.id], async (err, res) => {
                        if (err) {
                            handleError(err);
                            return;
                        }
        
                        try {
                            let stopped = 0;

                            for (let i = 0; i < res.length; i++) {
                                const group = await api.Group.getGroupById(res[i].group_id);
                                if (group.host.id === streamer.id) {
                                    await group.stop(identity);
                                    stopped++;
                                }
                            }

                            if (stopped > 0) {
                                global.client.ban.say(streamer.display_name.toLowerCase(), `${chatter.display_name}, stopped ${stopped} group${stopped === 1 ? "" : "s"}!`);
                            } else
                                global.client.ban.say(streamer.display_name.toLowerCase(), `${chatter.display_name}, there were no events to stop!`);
                        } catch(err2) {
                            handleError(err2);
                        }
                    });
                }, err => {
                    api.Logger.severe(err);
                    handleExpectedError("you must be linked to TMS to use this function!");
                })
            } else {  
                handleExpectedError("you must be linked to TMS to use this function!");
            }
        } else {
            handleExpectedError("this is a moderator only command!");
        }
    },
};
