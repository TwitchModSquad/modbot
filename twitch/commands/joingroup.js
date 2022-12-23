const api = require("../../api");

module.exports = {
    name: "joingroup",
    description: "Joins a group given a group ID",
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
            if (args.length > 0) {
                api.getGroupById(args[0]).then(async group => {
                    let identity = null;

                    if (chatter.identity?.id) {
                        try {
                            identity = await api.getFullIdentity(chatter.identity.id);
                        } catch (err) {}
                    }

                    group.addParticipant(streamer, identity).then(async () => {
                        global.client.ban.say(streamer.display_name.toLowerCase(), `${chatter.display_name}, success! ${await group.generateGroupString(streamer)}`)
                    }, handleError);
                }, err => {
                    handleExpectedError("could not find group with ID '" + args[0] + "'");
                });
            } else {
                handleExpectedError("not enough arguments. Expected group ID");
            }
        } else {
            handleExpectedError("this is a moderator only command!");
        }
    },
};
