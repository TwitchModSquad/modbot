const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    let data = {
        twitchAccounts: [],
        discordAccounts: [],
    }

    if (req.authCode >= 2) {

        data.twitchAccounts = req.session.identity.twitchAccounts;
        data.discordAccounts = req.session.identity.discordAccounts;
    }

    res.render("pages/signon/index", data);
});

module.exports = router;