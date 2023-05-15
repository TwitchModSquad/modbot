const con = require("../../database");

const EXPIRE_CHAT = 60000;
const CHAT_ACTIVITY_MAXIMUM = 500;

let chatCache = 0;

const listener = {
    name: "overviewActiveUsers",
    eventName: "message",
    activeUsers: {},
    chatActivity: [],
    listener: async (streamer, chatter, tags, message, self) => {
        if (!listener.activeUsers.hasOwnProperty(chatter.id))
            listener.activeUsers[String(chatter.id)] = [];

        listener.activeUsers[String(chatter.id)].push(Date.now());

        chatCache++;
    }
};

setInterval(() => {
    const now = Date.now();
    for (const id in listener.activeUsers) {
        listener.activeUsers[id] = listener.activeUsers[id].filter(x => x + EXPIRE_CHAT >= now);

        if (listener.activeUsers[id].length === 0) {
            delete listener.activeUsers[id];
        }
    }

    con.query("insert into twitch__hourlystats (time, messages) values (DATE_FORMAT(NOW(), '%Y-%m-%d %H:00'), ?) on duplicate key update messages = messages + ?;", [
        chatCache,
        chatCache,
    ], err => {
        if (err) api.Logger.warning(err);
    });

    const activity = {
        date: now,
        count: chatCache,
    };

    listener.chatActivity.push(activity);

    global.overviewBroadcast({
        chatActivityUpdate: activity,
    });

    if (listener.chatActivity.length > CHAT_ACTIVITY_MAXIMUM)
        listener.chatActivity.shift();

    chatCache = 0;
}, 5000);

module.exports = listener;