let {lastBan} = require("../../web/controllers/overview");

const listener = {
    name: "overviewLastBan",
    eventName: "ban",
    listener: async (streamer, chatter, timebanned, userstate, bpm) => {
        lastBan = timebanned;
    }
};

module.exports = listener;