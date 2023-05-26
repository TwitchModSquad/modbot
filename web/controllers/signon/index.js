const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    let data = {
        twitchAccounts: [],
        discordAccounts: [],
    }

    if (req.authCode >= 2) {
        data.identity = req.session.identity;
        data.twitchAccounts = req.session.identity.twitchAccounts;
        data.discordAccounts = req.session.identity.discordAccounts;
    }

    res.render("pages/signon/index", data);
});

router.get("/verify", async (req, res) => {
    if (req.authCode >= 2) {
        const streamers = await req.session.identity.getAllStreamers();
        res.render("pages/signon/verify", {identity: req.session.identity, streamers: streamers});
    } else {
        res.redirect("/signon/");
    }
});

module.exports = router;