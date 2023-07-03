const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
    const allStreamers = (await req.session.identity.getAllStreamers());
    const streamers = allStreamers.filter(x => !req.session.identity.twitchAccounts.find(y => y.id === x.streamer.id));
    const users = allStreamers.filter(x => req.session.identity.twitchAccounts.find(y => y.id === x.streamer.id));
    
    res.render("pages/panel/management/bot", {session: req.session, streamers: streamers, users: users});
});

module.exports = router;