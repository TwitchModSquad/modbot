const express = require("express");
const router = express.Router();

const con = require("../../database");
const api = require("../../api/");
const config = require("../../config.json");

const ACTIVE_USERS_LIMIT = 10;
const {activeUsers, chatActivity} = require("../../twitch/listeners/overviewActiveUsers");

const startTime = Math.floor(Date.now() / 1000);

function comma(x) {
    if (!x) return "0";
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatNumber(num) {
    if (num >= 1000000) {
        return "<span title=\"" + comma(num) + "\">" + Math.floor(num/1000000) + "M</span>";
    } else if (num >= 1000) {
        return "<span title=\"" + comma(num) + "\">" + Math.floor(num/1000) + "K</span>";
    } else {
        return comma(num);
    }
}

function formatTime(num) {
    let hours = 0;
    let minutes = 0;

    if (num >= 3600) {
        hours = Math.floor(num / 3600);
        num -= hours * 3600;
    }
    if (num >= 60) {
        minutes = Math.floor(num / 60);
        num -= minutes * 60;
    }
    
    if (hours < 10)
        hours = "0" + hours;
    if (minutes < 10)
        minutes = "0" + minutes;
    if (num < 10)
        num = "0" + num;

    return hours + ":" + minutes + ":" + num;
}

router.get("/", (req, res) => {
    res.render("pages/overview", {streamOverlay: false});
});

router.get("/stream", (req, res) => {
    res.render("pages/overview", {streamOverlay: true});
});

const streamerCache = {};
router.get("/:streamer", (req, res) => {
    api.Twitch.getUserByName(req.params.streamer).then(async streamers => {
        const streamer = streamers[0];
        if (streamer.identity?.id && (streamer.follower_count >= 5000 || streamer.affiliation === "partner")) {
            if (!streamerCache.hasOwnProperty(streamer.id) || Date.now() - streamerCache[streamer.id].time >= 10 * 60 * 60 * 1000) {
                const streams = await con.pquery("select round((end_time - start_time)/1000) as streamlength from live where identity_id = ? order by streamlength desc;", [
                    streamer.identity.id
                ]);
                streamerCache[streamer.id] = {
                    time: Date.now(),
                    liveActivity: await con.pquery("SELECT live__activity.time, live__activity.viewers, live__activity.game_name FROM tms.live__activity join live on live_id = live.id where live.identity_id = ? and `time` > date_sub(now(), interval 7 day) order by `time` asc;", [
                        streamer.identity.id,
                    ]),
                    highestChatters: await con.pquery("select chatter_id, chat_count from twitch__chat_chatters where streamer_id = ? order by chat_count desc limit 10;", [
                        streamer.id,
                    ]),
                    leaderboard: {
                        mostTimedOut: (await con.pquery("select user_id, count(user_id) as `count` from twitch__timeout where streamer_id = ? group by user_id order by `count` desc limit 1;", [
                            streamer.id
                        ]))[0],
                        totalStreams: streams.length,
                        longestStream: streams.length > 0 ? formatTime(streams[0].streamlength) : null,
                    }
                }
                for (let i = 0; i < streamerCache[streamer.id].highestChatters.length; i++) {
                    streamerCache[streamer.id].highestChatters[i].chatter = await api.Twitch.getUserById(streamerCache[streamer.id].highestChatters[i].chatter_id);
                }
                if (streamerCache[streamer.id].leaderboard.mostTimedOut) streamerCache[streamer.id].leaderboard.mostTimedOut.user = await api.Twitch.getUserById(streamerCache[streamer.id].leaderboard.mostTimedOut.user_id);
            }
            res.render("pages/overviewStreamer", {streamer: streamer, comma: comma, formatNumber: formatNumber, liveActivity: streamerCache[streamer.id].liveActivity, highestChatters: streamerCache[streamer.id].highestChatters, leaderboard: streamerCache[streamer.id].leaderboard});
        } else {
            res.send("This stream is currently not being monitored by TMS!");
        }
    }, err => {
        res.send("Unknown user");
    })
});

const leaderboard = {};
let activeUsersStripped = [];
let hourlyActivity = [];
let lastBan = null;
let totalTimeoutTime = 0;

let lastFollowerId = null;
let recentFollowers = [];

let hostedStreamer = null;

let liveChart = [];

let websockets = [];

const broadcast = msg => {
    if (typeof(msg) === "object") msg = JSON.stringify(msg);

    websockets.forEach(ws => {
        ws.send(msg);
    });
}

const sendUpdate = async (ws, all = false) => {
    let data = {
        activeUsers: activeUsersStripped,
        leaderboard: leaderboard,
        uptime: Math.floor((Date.now()/1000) - startTime),
        hourlyActivity: hourlyActivity,
        activeStreams: global.activeStreams,
        count: count,
    };

    if (all) {
        data.chatActivity = chatActivity;
        data.recentFollowers = recentFollowers;
        data.liveChart = liveChart;
    }

    if (lastBan)
        data.lastBan = Math.floor((Date.now() - lastBan)/1000);
    if (totalTimeoutTime)
        data.totalTimeoutTime = totalTimeoutTime;
    if (hostedStreamer)
        data.hostedStreamer = hostedStreamer;

    ws.send(JSON.stringify(data));
}

con.query("select timebanned from twitch__ban order by id desc limit 1;", (err, res) => {
    if (!err) {
        if (res.length > 0) {
            lastBan = res[0].timebanned;
        }
    } else {
        api.Logger.severe(err);
    }
});

let count = {
    bans: 0,
    timeouts: 0,
    streamers: 0,
    moderators: 0,
};

const changeHostedStreamer = () => {
    if (global.activeStreams.length > 0) {
        let newHosted = global.activeStreams[Math.floor(Math.random()*global.activeStreams.length)].identity.twitchAccounts[0];
        if (newHosted.id !== hostedStreamer?.id) {
            hostedStreamer = newHosted;
            api.Logger.info("New hosted streamer: " + hostedStreamer.display_name)
        } else changeHostedStreamer();
    } else {
        hostedStreamer = null;
        setTimeout(changeHostedStreamer, 5000);
    }
}

setInterval(changeHostedStreamer, 15 * 60 * 60 * 1000); // 15 minutes
setTimeout(changeHostedStreamer, 17.5 * 1000); // 17.5 seconds

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

    const timeoutTime = await con.pquery("select sum(duration) as `sum` from twitch__timeout;");
    totalTimeoutTime = timeoutTime[0].sum;

    hourlyActivity = await con.pquery("select unix_timestamp(`time`)*1000 as `date`, bans, timeouts, messages from twitch__hourlystats order by `time` desc limit 48;");

    let newLiveChart = [];
    const liveActivity = await con.pquery("select u.id as user_id, a.time, a.viewers from live__activity as a join live as l on l.id = a.live_id join identity as i on i.id = l.identity_id join twitch__user as u on u.identity_id = i.id where `time` >= date_sub(now(), interval 1 day);");
    for (let i = 0; i < liveActivity.length; i++) {
        try {
            let chart = newLiveChart.find(x => x.date === new Date(liveActivity[i].time).getTime()/1000);
            if (!chart) {
                chart = {date: (new Date(liveActivity[i].time).getTime() / 1000), data: []}
                newLiveChart.push(chart);
            }

            chart.data.push({
                user: await api.Twitch.getUserById(liveActivity[i].user_id), // we do not user identities here because identities are not cached
                viewers: liveActivity[i].viewers,
            });
        } catch (err) {
            api.Logger.warning(err);
        }
    }
    liveChart = newLiveChart;

    websockets.forEach(ws => {
        sendUpdate(ws, true);
    });
}

setInterval(slowUpdate, 240000);
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

    const followers = await api.Twitch.Direct.helix.users.getFollows({followedUser: config.twitch.id});
    
    if (followers.data.length > 0 && lastFollowerId !== followers.data[0].userId) {
        let resolvedFollowers = [];
        for (let i = 0; i < Math.min(followers.data.length, 9); i++) {
            try {
                resolvedFollowers.push(await api.Twitch.getUserById(followers.data[i].userId, false, true));
            } catch(err) {
                api.Logger.warning("Could not get user " + followers.data[i].userId);
            }
        }
        recentFollowers = resolvedFollowers;
        let broadcastObj = {
            recentFollowers: recentFollowers,
        };

        if (lastFollowerId) broadcastObj.newFollow = resolvedFollowers[0];

        broadcast(broadcastObj);
        lastFollowerId = followers.data[0].userId;
    }
}

setInterval(fastUpdate, 5000);

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
}, 5000);

global.overviewBroadcast = broadcast;

module.exports = {router: router, websockets: websockets, broadcast: broadcast, lastBan: lastBan};