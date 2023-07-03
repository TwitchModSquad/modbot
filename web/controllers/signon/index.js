const express = require("express");
const router = express.Router();

const api = require("../../../api/");
const config = require("../../../config.json");

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
        res.cookie("return_uri", "/signon/verify", {
            domain: config.main_domain,
            path: "/",
            secure: true,
        });
        const streamers = await req.session.identity.getAllStreamers();
        let tokens = [];
        req.session.identity.twitchAccounts.forEach(account => {
            tokens = [
                ...tokens,
                ...api.Token.getTokensByScope(account, "chat:edit"),
            ]
        });
        res.render("pages/signon/verify", {
            identity: req.session.identity,
            streamers: streamers,
            hasToken: tokens.length > 0,
            tokenLink: api.Authentication.Twitch.getURL("chat:edit chat:read"),
        });
    } else {
        res.redirect("/signon/");
    }
});

module.exports = router;