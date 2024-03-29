const express = require("express");
const router = express.Router();

const api = require("../../../api/");
const con = require("../../../database");

const config = require("../../../config.json");

const login = require("./login");
const user = require("./user/");
const apiRoute = require("./api/");

router.use("/", (req, _, next) => {
    req.user = null;

    if (!req.cookies?.db_session) {
        next();
        return;
    }

    con.query("select * from database__session where id = ?;", [req.cookies.db_session], async (err, res) => {
        if (!err) {
            if (res.length > 0) {
                try {
                    req.user = await api.Twitch.getUserById(res[0].user_id);
                } catch(err) {
                    api.Logger.warning(err);
                }
            } else {
                _.cookie("db_session", null, {
                    expires: new Date(Date.now() - 60),
                });
            }
        } else {
            api.Logger.warning(err);
        }
        next();
    });
});

router.get("/", (req, res) => {
    res.render("pages/database/index", {twitch_uri: api.Authentication.Twitch.getURL("channel:read:editors channel:read:vips moderation:read", api.Authentication.Twitch.DATABASE_REDIRECT), domain: config.db_domain, user: req.user});
});

router.use("/auth", login);
router.use("/user", user);
router.use("/api", apiRoute);

module.exports = router;