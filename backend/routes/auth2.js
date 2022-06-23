const {Router} = require("express");
const api = require("../../api/index");
const con = require("../../database");
const config = require("../../config.json");

const Session = require("../../api/Session");
const FullIdentity = require("../../api/FullIdentity");
 
const router = Router();

const SIGNON_URI = config.pub_domain + "signon/";

const redirect = (req, res) => {
    if (req.cookies && req.cookies?.hasOwnProperty("return_uri")) {
        res.redirect(req.cookies.return_uri);
    } else
        res.redirect(SIGNON_URI);
};

router.get("/",async (req, res) => {
    const { headers } = req;

    let session = undefined;

    if (headers.authorization) {
        try {
            session = await api.getSession(headers.authorization);
        } catch (err) {}
    }

    if (session) {
        res.json({success: true, data: session});
    } else {
        res.json({success: false, error: "Invalid session ID"});
    }
});

router.get("/invite/:invite", (req, res) => {
    if (req.params.invite) {
        res.cookie("invite", req.params.invite, {
            secure: true,
            maxAge: 360000
        });

        res.redirect(api.Authentication.Twitch.TWITCH_URL);
    } else {
        res.json({success: false, error: "Invite parameter not provided"});
    }
});

router.get("/redirect/discord", (req, res) => {
    res.redirect(api.Authentication.Discord.DISCORD_URL);
});

router.get("/redirect/twitch", (req, res) => {
    res.redirect(api.Authentication.Twitch.TWITCH_URL);
});

router.get("/redirect/twitch-streamer", (req, res) => {
    res.redirect(api.Authentication.Twitch.TWITCH_STREAMER_URL);
});

router.get("/twitch", async (req, res) => {
    const { query, cookies } = req;
    const { code } = query;

    if (code) {
        const oauthData = await api.Authentication.Twitch.getToken(code);

        if (oauthData.hasOwnProperty("status") && oauthData.status === 400) {
            res.redirect(api.Authentication.Twitch.TWITCH_URL);
        }

        let user;
        try {
            user = await api.Authentication.Twitch.getUser(oauthData.access_token);
        } catch (err) {
            console.error(err);
            try {
                res.json({success: false, error: err});
            } catch(err) {
                console.error(err);
            }
            return;
        }

        api.Twitch.getUserById(user.id, true, true).then(async twitchUser => {
            let session;

            if (cookies.session) {
                try {
                    session = await api.getSession(cookies.session);
                } catch (err) {}
            }

            // catch all, if a session isn't present, make one.
            if (session === undefined)
                session = new Session(api.stringGenerator(32), null, null);


            // attempt to load the identity
            if (twitchUser.identity?.id !== null) {
                try {
                    session.identity = await api.getFullIdentity(twitchUser.identity.id);
                } catch(err) {}
            }

            twitchUser.display_name = user.display_name;
            twitchUser.email = user.email;
            twitchUser.profile_image_url = user.profile_image_url;
            twitchUser.offline_image_url = user.offline_image_url;
            twitchUser.description = user.description;
            twitchUser.view_count = user.view_count;
            twitchUser.affiliation = user.broadcaster_type === "" ? null : user.broadcaster_type;

            // catch all, if an identity isn't present, make one.
            if (!session.identity) {
                session.identity = new FullIdentity(null, user.display_name, false, [twitchUser], []);
            } else if (!session.identity.twitchAccounts.find(x => x.id === twitchUser.id)) {
                session.identity.twitchAccounts = [
                    ...session.identity.twitchAccounts,
                    twitchUser,
                ];
            }

            // post that sh!t
            session = await session.post();

            con.query("update twitch__user set refresh_token = ?, scopes = ? where id = ?;", [oauthData.refresh_token, api.Authentication.Twitch.textifyScopes(oauthData.scope), user.id], err => {
                if (err) console.error(err);
            });

            res.cookie("session", session.id, {domain: config.main_domain, maxAge: new Date(Date.now() + 86400000), path: "/", secure: true});
            
            redirect(req, res);
        }, err => {
            console.error(err);
        });
    } else {
        res.redirect(api.Authentication.Twitch.TWITCH_URL);
    }
});
 
module.exports = router;