const express = require("express");
const router = express.Router();

const con = require("../../database");
const api = require("../../api/");

let landingValues = {
    moderators: 0,
    streamers: 0,
    bans: 0,
    timeouts: 0,
    messages: 0,
};

let participatingStreamers = [];
let featuredStreamers = [];
let streamers = [];
let streamersByFollowCount = [];

const updateValues = () => {
    con.query("select distinct identity_id from identity__moderator;", (err, res) => {
        if (err) {
            api.Logger.severe(err);
            return;
        }

        landingValues.moderators = res.length;
    });
    
    con.query("select distinct modfor_id from identity__moderator where active;", (err, res) => {
        if (err) {
            api.Logger.severe(err);
            return;
        }

        landingValues.streamers = res.length;
    });
    
    con.query("select id from twitch__ban;", (err, res) => {
        if (err) {
            api.Logger.severe(err);
            return;
        }

        landingValues.bans = res.length;
    });
    
    con.query("select id from twitch__timeout;", (err, res) => {
        if (err) {
            api.Logger.severe(err);
            return;
        }

        landingValues.timeouts = res.length;
    });
    
    con.query("select sum(chat_count) as total_chat from twitch__chat_streamers;", (err, res) => {
        if (err) {
            api.Logger.severe(err);
            return;
        }

        landingValues.messages = res[0].total_chat;
    });
}

const updateParticipatingStreamers = () => {
    con.query("select id from twitch__user where show_on_homepage order by rand() limit 5;", async (err, res) => {
        if (err) {
            api.Logger.severe(err);
        } else {
            let result = [];

            for (let i = 0; i < res.length; i++) {
                result = [
                    ...result,
                    await api.Twitch.getUserById(res[i].id),
                ]
            }
            
            participatingStreamers = result.sort((a, b) => b.follower_count - a.follower_count);

            if (participatingStreamers.length === 5) {
                participatingStreamers = [
                    participatingStreamers[3],
                    participatingStreamers[1],
                    participatingStreamers[0],
                    participatingStreamers[2],
                    participatingStreamers[4],
                ]
            }
        }
    });
}

const updateFeaturedStreamers = () => {
    con.query("select id from twitch__user where featured order by rand() limit 5;", async (err, res) => {
        if (err) {
            api.Logger.severe(err);
        } else {
            let result = [];

            for (let i = 0; i < res.length; i++) {
                result = [
                    ...result,
                    await api.Twitch.getUserById(res[i].id),
                ]
            }
            
            featuredStreamers = result.sort((a, b) => b.follower_count - a.follower_count);

            if (featuredStreamers.length === 5) {
                featuredStreamers = [
                    featuredStreamers[3],
                    featuredStreamers[1],
                    featuredStreamers[0],
                    featuredStreamers[2],
                    featuredStreamers[4],
                ]
            }
        }
    });
}

const updateStreamers = () => {con.query("select id from twitch__user where show_on_homepage order by display_name asc;", async (err, res) => {
    if (err) {
        api.Logger.severe(err);
    } else {
        let result = [];

        for (let i = 0; i < res.length; i++) {
            result = [
                ...result,
                await api.Twitch.getUserById(res[i].id),
            ]
        }
        
        streamers = result;
        streamersByFollowCount = [...streamers].sort((a, b) => b.follower_count - a.follower_count);
    }
});
}

setInterval(updateValues, 1800000);
setInterval(updateParticipatingStreamers, 180000);
updateParticipatingStreamers();
updateFeaturedStreamers();
updateStreamers();
updateValues();

const comma = x => {
    if (!x) return "0";
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const formatNumber = num => {
    if (num > 1000000) {
        return comma((num/1000000).toFixed(1)) + "M";
    } else if (num > 10000) {
        return comma((num/1000).toFixed(1)) + "K";
    }
    return comma(num);
}

router.get("/", (req, res) => {
    let landingMessages = [
        `supporting ${formatNumber(landingValues.moderators)} moderator${landingValues.moderators === 1 ? "" : "s"}`,
        `protecting ${formatNumber(landingValues.streamers)} streamer${landingValues.streamers === 1 ? "" : "s"}`,
        `sharing ${formatNumber(landingValues.bans)} ban${landingValues.bans === 1 ? "" : "s"}`,
        `sharing ${formatNumber(landingValues.timeouts)} timeout${landingValues.timeouts === 1 ? "" : "s"}`,
        `storing ${formatNumber(landingValues.messages)} chat message${landingValues.messages === 1 ? "" : "s"}`,
    ];

    res.render("pages/index", {landingMessages: landingMessages, participatingStreamers: participatingStreamers, featuredStreamers: featuredStreamers, formatNumber: formatNumber})
});

const displayStreamers = (res, streamerDisplay, sortByFollower = false) => {
    res.render("pages/streamers", {streamers: streamerDisplay, sortByFollower: sortByFollower, formatNumber: formatNumber})
}

router.get("/streamers", (req, res) => {
    displayStreamers(res, streamers);
});

router.get("/streamers/az", (req, res) => {
    displayStreamers(res, streamers);
});

router.get("/streamers/followers", (req, res) => {
    displayStreamers(res, streamersByFollowCount, true);
});

router.get("/hosting", (req, res) => {
    res.render("pages/hosting")
});

router.get("/contact-us", (req, res) => {
    res.render("pages/contact-us")
});

module.exports = router;