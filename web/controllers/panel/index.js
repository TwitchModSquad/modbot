const express = require("express");
const router = express.Router();

const con = require("../../../database");

router.get("/", async (req, res) => {
    let data = {
        twitchAccounts: [],
        discordAccounts: [],
        streamers: [],
    }

    if (req.authCode >= 2) {
        try {
            data.streamers = await req.session.identity.getActiveModeratorChannels();
            data.streamers = data.streamers.map(x => x.modForIdentity);
        } catch (err) {
            console.error(err);
        }
        
        data.twitchAccounts = req.session.identity.twitchAccounts;
        data.discordAccounts = req.session.identity.discordAccounts;
    }

    res.render("pages/panel/index", data);
});

router.get("/chat-history", async (req, res) => {
    let data = {
        streamers: [],
        chatters: [],
    };

    try {
        data.streamers = await con.pquery("select twitch__chat_streamers.*, twitch__user.display_name from twitch__chat_streamers join twitch__user on twitch__user.id = twitch__chat_streamers.streamer_id order by chat_count desc;");
        data.chatters = await con.pquery("select chatter_id, sum(chat_count) as chat_count, twitch__user.display_name from twitch__chat_chatters join twitch__user on twitch__user.id = twitch__chat_chatters.chatter_id group by chatter_id order by chat_count desc;");
    } catch (err) {
        console.error(err);
    }

    res.render("pages/panel/chathistory", data);
});

module.exports = router;