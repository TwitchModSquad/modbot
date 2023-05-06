const express = require("express");
const router = express.Router();

const con = require("../../database");
const api = require("../../api/");

const ACTIVE_USERS_LIMIT = 10;
const {activeUsers, chatActivity} = require("../../twitch/listeners/overviewActiveUsers");

const startTime = Math.floor(Date.now() / 1000);

router.get("/", (req, res) => {
    res.render("pages/overview");
});

const leaderboard = {};
let activeUsersStripped = [];

const updateLeaderboard = async () => {
    leaderboard.topBanned = (await con.pquery("SELECT user_id, count(user_id) as `count` FROM twitch__ban group by user_id order by `count` desc limit 1;"))[0];
    leaderboard.topTimedOut = (await con.pquery("SELECT user_id, count(user_id) as `count` FROM twitch__timeout group by user_id order by `count` desc limit 1;"))[0];
    leaderboard.topChatter = (await con.pquery("SELECT chatter_id as user_id, chat_count as `count` FROM twitch__chat_chatters ORDER BY `count` desc;"))[0];
    leaderboard.topStreamer = (await con.pquery("SELECT streamer_id as user_id, chat_count as `count` FROM twitch__chat_streamers ORDER BY `count` desc;"))[0];

    leaderboard.topBanned.user = await api.Twitch.getUserById(leaderboard.topBanned.user_id);
    leaderboard.topTimedOut.user = await api.Twitch.getUserById(leaderboard.topTimedOut.user_id);
    leaderboard.topChatter.user = await api.Twitch.getUserById(leaderboard.topChatter.user_id);
    leaderboard.topStreamer.user = await api.Twitch.getUserById(leaderboard.topStreamer.user_id);

    for (const id in activeUsers) {
        activeUsersStripped.push({
            id: id,
            count: activeUsers[id].length,
        });
    }

    activeUsersStripped.sort((a,b) => b.count - a.count);
    activeUsersStripped = activeUsersStripped.slice(0, ACTIVE_USERS_LIMIT);

    for (let i = 0; i < activeUsersStripped.length; i++) {
        activeUsersStripped[i].displayName = (await api.Twitch.getUserById(activeUsersStripped[i].id)).display_name;
    }
}

setInterval(updateLeaderboard, 30000);
setTimeout(updateLeaderboard, 5000);

const sendUpdate = async (ws, all = false) => {
    let data = {
        activeUsers: activeUsersStripped,
        leaderboard: leaderboard,
        uptime: Math.floor((Date.now()/1000) - startTime),
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

setInterval(() => {
    websockets.forEach(ws => {
        sendUpdate(ws);
    });
}, 1000);

module.exports = router;