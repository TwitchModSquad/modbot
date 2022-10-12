const express = require("express");
const router = express.Router();

const api = require("../../../api/");
const config = require("../../../config.json");

router.use((req, res, next) => {
    let isStreamer = false;

    if (req.session?.identity?.twitchAccounts) {
        req.session.identity.twitchAccounts.forEach(account => {
            if (account.follower_count >= config.follower_requirement || account.affiliation === "partner") {
                isStreamer = true;
            }
        });
    }

    if (isStreamer) {
        next();
    } else {
        res.redirect("/panel/no-permission");
    }
});

router.get("/", async (req, res) => {
    res.render("pages/panel/streamerfunctions", {session: req.session});
});

module.exports = router;