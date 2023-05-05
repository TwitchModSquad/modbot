const EXPIRE_CHAT = 60000;

const listener = {
    name: "messageLog",
    eventName: "message",
    activeUsers: {},
    listener: async (streamer, chatter, tags, message, self) => {
        if (!listener.activeUsers.hasOwnProperty(chatter.id))
            listener.activeUsers[chatter.id] = [];

        listener.activeUsers[chatter.id].push(Date.now());
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
}, 5000);

module.exports = listener;