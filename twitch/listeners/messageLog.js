const con = require("../../database");
const api = require("../../api/");

const listener = {
    name: "messageLog",
    eventName: "message",
    listener: async (streamer, chatter, tags, message, self) => {
        
    }
};

module.exports = listener;