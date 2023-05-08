let {lastBan} = require("../../web/controllers/overview");

const listener = {
    name: "overviewLastBan",
    eventName: "ban",
    listener: async (streamer, chatter, timebanned, userstate, bpm) => {
        lastBan = timebanned;
        console.log(lastBan);
    }
};

module.exports = listener;