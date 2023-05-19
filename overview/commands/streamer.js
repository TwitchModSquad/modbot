const api = require("../../api/");

module.exports = {
    name: "streamer",
    description: "Gives more information on an inputted streamer",
    async execute(streamer, chatter, tags, args, message) {
        if (args.length > 0) {
            try {
                const stream = (await api.Twitch.getUserByName(args[0]))[0];
                if (stream.identity?.id && (stream.affiliation === "partner" || stream.follower_count >= 5000)) {
                    global.client.overview.say("twitchmodsquad", `View the streamer overview for ${stream.display_name} at https://twitch.tv/${stream.login}`);
                } else {
                    global.client.overview.say("twitchmodsquad", `User ${stream.display_name} is not a recognized TMS streamer!`);
                }
            } catch(err) {
                global.client.overview.say("twitchmodsquad", `Unable to find streamer ${args[0]}!`);
            }
        } else {
            global.client.overview.say("twitchmodsquad", `You must provide a streamer username!`);
        }
    },
};
