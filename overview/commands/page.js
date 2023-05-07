module.exports = {
    name: "page",
    description: "Changes the stream overview page",
    async execute(streamer, chatter, tags, args, message) {
        if (args.length > 0) {
            let page = Number(args[0]);

            if (!isNaN(page) && page < 10 && page > 0) {
                global.overviewBroadcast({
                    page: page,
                });
                global.client.overview.say("twitchmodsquad", "The page was changed to page " + page + "!");
            } else {
                global.client.overview.say("twitchmodsquad", "You must provide a valid page number!");
            }
        } else {
            global.client.overview.say("twitchmodsquad", "You must provide a valid page number!");
        }
    },
};
