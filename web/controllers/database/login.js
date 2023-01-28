const express = require("express");
const router = express.Router();

const api = require("../../../api/");
const config = require("../../../config.json");
const con = require("../../../database");

const generateSession = async () => {
    let session = api.stringGenerator(32);

    const result = await con.pquery("select id from database__session where id = ?;", [session]);

    if (result.length > 0) {
        return await generateSession();
    } else {
        return session;
    }
}

router.get("/twitch", async (req, res) => {
    const { query } = req;
    const { code } = query;

    if (code) {
        const oauthData = await api.Authentication.Twitch.getToken(code);

        if (oauthData.hasOwnProperty("status") && oauthData.status === 400) {
            res.redirect(api.Authentication.Twitch.DATABASE_TWITCH_URL);
            return;
        }

        let user;
        try {
            user = await api.Authentication.Twitch.getUser(oauthData.access_token);
        } catch (err) {
            api.Logger.warning(err);
            try {
                res.send("Failed to get user");
            } catch(err) {
                api.Logger.warning(err);
            }
            return;
        }

        api.Twitch.getUserById(user.id, true, true).then(async twitchUser => {
            let session = await generateSession();
            con.query("insert into database__session (id, user_id) values (?, ?);", [session, user.id], err => {
                if (err) {
                    res.send("Failed to add session");
                } else {
                    res.cookie("db_session", session, {
                        expires: new Date(Date.now() + (3 * 60 * 60 * 1000)), // 3 hours
                        domain: config.main_domain,
                        secure: true,
                    });
                    res.redirect(config.db_domain);
                }
            });
        }, err => {
            api.Logger.warning(err);
        });
    } else {
        res.redirect(api.Authentication.Twitch.DATABASE_TWITCH_URL);
    }
});

module.exports = router;