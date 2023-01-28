const express = require("express");
const router = express.Router();

const api = require("../../../../api/");
const con = require("../../../../database");

const config = require("../../../../config.json");

router.get("/", (req, res) => {
    res.render("pages/database/user/lookup", {twitch_uri: api.Authentication.Twitch.DATABASE_TWITCH_URL, domain: config.db_domain, user: req.user});
});

module.exports = router;