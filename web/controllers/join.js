const express = require("express");
const router = express.Router();

const con = require("../../database");
const config = require("../../config.json");
const api = require("../../api/");

router.get("/", (req, res) => {
    res.render("pages/join/expired");
});

router.get("/:invite", (req, res) => {
    let invite = req.params.invite;
    con.query("select initiated_by from invite where invite = ? and expiry >= now();", [invite], async (err, result) => {
        if (!err) {
            if (result.length > 0) {
                res.cookie("invite", invite, {
                    domain: config.main_domain,
                    maxAge: 10 * 60 * 60, // 10 hours
                    path: "/",
                    secure: true
                });
                res.render("pages/join/index", {url: api.Authentication.Twitch.TWITCH_URL, invitedBy: await api.getFullIdentity(result[0].initiated_by)});
            } else {
                res.render("pages/join/expired");
            }
        } else {
            api.Logger.warning(err);
            res.render("pages/join/expired");
        }
    });
});

module.exports = router;