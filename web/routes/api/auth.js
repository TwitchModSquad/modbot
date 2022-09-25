const {Router} = require("express");
const api = require("../../../api/index");
const con = require("../../../database");
const config = require("../../../config.json");

const Session = require("../../../api/Session");
const FullIdentity = require("../../../api/FullIdentity");
const DiscordUser = require("../../../api/Discord/DiscordUser");
 
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
                session.identity = new FullIdentity(null, user.display_name, false, false, false, [twitchUser], []);
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

router.get("/discord", async (req, res) => {
    const { query, cookies } = req;
	const { code } = query;

    let session = undefined;

    if (cookies?.session) {
        try {
            session = await api.getSession(cookies.session);
        } catch (err) {}
    }
    
    if (session === undefined) {
        res.redirect(api.Authentication.Twitch.TWITCH_URL);
        return;
    }

    let invitee = null

    if (cookies?.invite) {
        try {
            const invite = await con.pquery("select initiated_by, expiry > now() as active from invite where invite = ?;", [cookies.invite]);
            if (invite.length > 0) {
                if (invite[0].active == 1) {
                    invitee = invite[0].initiated_by;
                } else {
                    res.json({success: false, error: "Invite has expired"});
                    return;
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

	if (code) {
		try {
			const oauthData = await api.Authentication.Discord.getToken(code);
            const user = await api.Authentication.Discord.getUser(oauthData.access_token, oauthData.token_type);

            if (user.hasOwnProperty("message") && user.message === "401: Unauthorized")  {
                res.redirect(api.Authentication.Discord.DISCORD_URL);
                return;
            }
            
            let dus = new DiscordUser(
                    user.id,
                    null,
                    user.username,
                    user.discriminator,
                    user.avatar
                );

            if (session.identity.discordAccounts.length === 0) {
                if (invitee === null) {
                    res.json({success: false, error: "Invalid invite"});
                    return;
                }

                con.query("insert into invite__uses (invited, invitee) values (?,?) on duplicate key update invitee = ?;", [session.identity.id, invitee, invitee]);
            }

            if (!session.identity.discordAccounts.find(x => x.id === dus.id)) {
                session.identity.discordAccounts = [...session.identity.discordAccounts, dus];
            }

            session = await session.post();

            let partnered = false;
            let affiliate = false;
            let partneredModerator = false;
            let affiliateModerator = false;

            for (let ri = 0; ri < session.identity.twitchAccounts.length; ri++) {
                let twitchAccount = session.identity.twitchAccounts[ri];

                let followers = await twitchAccount.refreshFollowers();

                if (twitchAccount.affiliation === "partner") {
                    partnered = true;
                } else if (twitchAccount.affiliation === "affiliate" && followers >= config.follower_requirement) {
                    affiliate = true;
                }

                let streamers = await twitchAccount.refreshStreamers();

                for (let si = 0; si < streamers.length; si++) {
                    let streamer = streamers[si];

                    followers = await streamer.refreshFollowers();
                    
                    if (streamer.affiliation === "partner") {
                        partneredModerator = true;
                    } else if (streamer.affiliation === "affiliate" && followers >= config.follower_requirement) {
                        affiliateModerator = true;
                    }
                }
            }

            let resolvedRoles = [];

            if (partnered) {
                resolvedRoles = [
                    ...resolvedRoles,
                    config.partnered.streamer
                ];
            }
            if (affiliate) {
                resolvedRoles = [
                    ...resolvedRoles,
                    config.affiliate.streamer
                ];
            }
            if (partneredModerator) {
                resolvedRoles = [
                    ...resolvedRoles,
                    config.partnered.moderator
                ];
            }
            if (affiliateModerator) {
                resolvedRoles = [
                    ...resolvedRoles,
                    config.affiliate.moderator
                ];
            }

            if (resolvedRoles.length > 0) {
                session.identity.authenticated = true;
                await session.identity.post();

                global.client.discord.guilds.fetch(config.modsquad_discord).then(guild => {
                    guild.members.add(dus.id, {accessToken: oauthData.access_token, roles: resolvedRoles}).then(member => {
                        redirect(req, res);
                    }).catch((err) => {
                        console.error(err);
                        res.json({success: false, error: "Could not add user to Discord"});
                    });
                }).catch((err) => {
                    console.error(err);
                    res.json({success: false, error: "Could not obtain guild"});
                });
            } else {
                res.status(401)
                res.json({success: false, error: "Did not meet join criteria. If you believe this is in error, send this page to @Twijn#8888 on Discord.", session: session});
            }
		} catch (error) {
			// NOTE: An unauthorized token will not throw an error;
			// it will return a 401 Unauthorized response in the try block above
			console.error(error);
            res.json({success: false, error: "An error occurred"});
		}
	} else {
        res.redirect(api.Authentication.Discord.DISCORD_URL);
    }
});
 
module.exports = router;
