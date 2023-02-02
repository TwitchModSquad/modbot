const express = require("express");
const router = express.Router();

const api = require("../../../../api/");
const con = require("../../../../database");

const config = require("../../../../config.json");

router.get("/", (req, res) => {
    res.render("pages/database/user/lookup", {twitch_uri: api.Authentication.Twitch.DATABASE_TWITCH_URL, domain: config.db_domain, user: req.user, error: req.query?.error});
});

router.get("/:query", (req, res) => {
    res.render("pages/database/user/lookup", {twitch_uri: api.Authentication.Twitch.DATABASE_TWITCH_URL, domain: config.db_domain, user: req.user, query: req.params.query, error: req.query?.error});
});

let forceCooldown = [];

router.get("/:query/force", (req, res) => {
    let query = req.params.query;

    if (req.user !== null) {
        if (forceCooldown.includes(req.user.id)) {
            res.redirect(config.db_domain + "user/lookup/" + encodeURIComponent(query) + "?error=" + encodeURIComponent("Rate limited. Please wait a few seconds before forcing user searches."));
            return;
        }

        forceCooldown.push(req.user.id);
        setTimeout(() => {
            forceCooldown = forceCooldown.filter(x => x !== req.user.id);
        }, 5000);

        api.Twitch.getUserByName(query, true).then(users => {
            if (users.length > 0) {
                res.redirect(config.db_domain + "user/" + users[0].id);
            } else {
                res.redirect(config.db_domain + "user/lookup/" + encodeURIComponent(query) + "?error=" + encodeURIComponent("User " + query + " was not found!"));
            }
        }, () => {
            res.redirect(config.db_domain + "user/lookup/" + encodeURIComponent(query) + "?error=" + encodeURIComponent("User " + query + " was not found!"));
        });
    } else {
        res.redirect(config.db_domain + "user/lookup/" + encodeURIComponent(query) + "?error=" + encodeURIComponent("You must be logged in to do that!"));
    }
});

module.exports = router;