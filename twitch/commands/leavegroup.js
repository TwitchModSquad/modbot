const api = require("../../api");
const con = require("../../database");

module.exports = {
    name: "leavegroup",
    description: "Leaves all active groups for this user",
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
                            let left = 0;

                            for (let i = 0; i < res.length; i++) {
                                const group = await api.getGroupById(res[i].group_id);
                                if (group.host.id !== streamer.id) {
                                    await group.removeParticipants([streamer], identity);
                                    left++;
                                } else
                                    global.client.ban.say(streamer.display_name.toLowerCase(), `${chatter.display_name}, can't leave group ${group.id}, ${streamer.display_name} is the host! Try to stop the group instead`);
                            }

                            if (left > 0)
                                global.client.ban.say(streamer.display_name.toLowerCase(), `${chatter.display_name}, left ${left} group${left === 1 ? "" : "s"}!`);
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
