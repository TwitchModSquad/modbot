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
    const { query, cookies } = req;
    const { code } = query;

    if (code) {
        const oauthData = await api.Authentication.Twitch.getToken(code, api.Authentication.Twitch.DATABASE_REDIRECT);

        if (oauthData.hasOwnProperty("status") && oauthData.status === 400) {
            res.redirect(api.Authentication.Twitch.getURL("channel:read:editors channel:read:vips moderation:read", api.Authentication.Twitch.DATABASE_REDIRECT));
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
            con.query("select * from twitch__token where user_id = ? and scopes = ?;", [user.id, oauthData.scope.join("-")], (err, res) => {
                if (!err) {
                    if (res.length === 0) {
                        con.query("insert into twitch__token (user_id, token, scopes) values (?, ?, ?);", [user.id, oauthData.refresh_token, oauthData.scope.join("-")], err => {
                            if (err) {
                                api.Logger.severe(err);
                            }
                        });
                    }
                } else {
                    api.Logger.severe(err);
                }
            });

            try {
                await twitchUser.refreshStreamerRoles(oauthData.access_token);
            } catch(err) {
                api.Logger.severe(err);
            }

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

                    if (cookies && cookies.db_return_to) {
                        res.redirect(cookies.db_return_to);
                    } else {
                        res.redirect(config.db_domain);
                    }
                }
            });
        }, err => {
            api.Logger.warning(err);
        });
    } else {
        res.redirect(api.Authentication.Twitch.getURL("channel:read:editors channel:read:vips moderation:read", api.Authentication.Twitch.DATABASE_REDIRECT));
    }
});

module.exports = router;