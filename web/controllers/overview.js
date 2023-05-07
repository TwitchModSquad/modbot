const express = require("express");
const router = express.Router();

const con = require("../../database");
const api = require("../../api/");

const ACTIVE_USERS_LIMIT = 10;
const {activeUsers, chatActivity} = require("../../twitch/listeners/overviewActiveUsers");

const startTime = Math.floor(Date.now() / 1000);

router.get("/", (req, res) => {
    res.render("pages/overview", {streamOverlay: false});
});

router.get("/stream", (req, res) => {
    res.render("pages/overview", {streamOverlay: true});
});

const leaderboard = {};
let activeUsersStripped = [];

let count = {
    bans: 0,
    timeouts: 0,
    streamers: 0,
    moderators: 0,
};

const slowUpdate = async () => {
    leaderboard.topBanned = (await con.pquery("SELECT user_id, count(user_id) as `count` FROM twitch__ban group by user_id order by `count` desc limit 1;"))[0];
    leaderboard.topTimedOut = (await con.pquery("SELECT user_id, count(user_id) as `count` FROM twitch__timeout group by user_id order by `count` desc limit 1;"))[0];
    leaderboard.topChatter = (await con.pquery("SELECT chatter_id as user_id, chat_count as `count` FROM twitch__chat_chatters ORDER BY `count` desc;"))[0];
    leaderboard.topStreamer = (await con.pquery("SELECT streamer_id as user_id, chat_count as `count` FROM twitch__chat_streamers ORDER BY `count` desc;"))[0];
    leaderboard.mostLive = (await con.pquery("SELECT twitch__user.id as user_id, count(live.identity_id) as `count` from live join twitch__user on twitch__user.identity_id = live.identity_id where start_time > date_sub(now(), interval 1 month) group by live.identity_id order by `count` desc limit 1;"))[0];

    leaderboard.topBanned.user = await api.Twitch.getUserById(leaderboard.topBanned.user_id);
    leaderboard.topTimedOut.user = await api.Twitch.getUserById(leaderboard.topTimedOut.user_id);
    leaderboard.topChatter.user = await api.Twitch.getUserById(leaderboard.topChatter.user_id);
    leaderboard.topStreamer.user = await api.Twitch.getUserById(leaderboard.topStreamer.user_id);
    leaderboard.mostLive.user = await api.Twitch.getUserById(leaderboard.mostLive.user_id);

    const bans = await con.pquery("select id from twitch__ban;");
    count.bans = bans.length;

    const timeouts = await con.pquery("select id from twitch__timeout;");
    count.timeouts = timeouts.length;

    const streamers = await con.pquery("select distinct identity__moderator.modfor_id from identity__moderator join twitch__user on twitch__user.identity_id = identity__moderator.modfor_id where active;");
    count.streamers = streamers.length;

    const moderators = await con.pquery("select distinct identity__moderator.identity_id from identity__moderator join twitch__user on twitch__user.identity_id = identity__moderator.identity_id where active;");
    count.moderators = moderators.length;
}

setInterval(slowUpdate, 120000);
setTimeout(slowUpdate, 5000);

const fastUpdate = async () => {
    let newActiveUsers = [];
    for (const id in activeUsers) {
        newActiveUsers.push({
            id: id,
            count: activeUsers[id].length,
        });
    }

    newActiveUsers.sort((a,b) => b.count - a.count);
    newActiveUsers = newActiveUsers.slice(0, ACTIVE_USERS_LIMIT);

    for (let i = 0; i < newActiveUsers.length; i++) {
        newActiveUsers[i].displayName = (await api.Twitch.getUserById(newActiveUsers[i].id)).display_name;
    }

    activeUsersStripped = newActiveUsers;
}

setInterval(fastUpdate, 5000);

const sendUpdate = async (ws, all = false) => {
    let data = {
        activeUsers: activeUsersStripped,
        leaderboard: leaderboard,
        uptime: Math.floor((Date.now()/1000) - startTime),
        count: count,
    };

    if (all) {
        data.chatActivity = chatActivity;
    }

    ws.send(JSON.stringify(data));
}

let websockets = [];

router.ws("/ws", (ws, req) => {
    ws.id = api.stringGenerator(8);

    websockets.push(ws);

    ws.on("message", message => {
        sendUpdate(ws, true);
    });

    ws.on("close", () => {
        websockets = websockets.filter(x => x.id !== ws.id);
    });
});

const broadcast = msg => {
    if (typeof(msg) === "object") msg = JSON.stringify(msg);

    websockets.forEach(ws => {
        ws.send(msg);
    });
}

setInterval(() => {
    websockets.forEach(ws => {
        sendUpdate(ws);
    });
}, 5000);

global.overviewBroadcast = broadcast;

module.exports = {router: router, websockets: websockets, broadcast: broadcast};