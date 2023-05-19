const {Router} = require("express");
const api = require("../../../api/index");
const config = require("../../../config.json");

const {connectingUsers} = require("../../../discord/listeners/modalSubmit/connectManager");
 
const router = Router();

const SIGNON_URI = config.pub_domain + "signon/";

router.get("/", async (req, res) => {
    const { query } = req;
    const { code } = query;

    if (code) {
        const oauthData = await api.Authentication.Twitch.getToken(code, api.Authentication.Twitch.CONNECT_REDIRECT);

        if (oauthData.hasOwnProperty("status") && oauthData.status === 400) {
            res.redirect(api.Authentication.Twitch.getURL("user:read:email moderator:manage:banned_users", api.Authentication.Twitch.CONNECT_REDIRECT));
            return;
        }

        let user;
        try {
            user = await api.Authentication.Twitch.getUser(oauthData.access_token);
        } catch (err) {
            global.api.Logger.warning(err);
            try {
                res.json({success: false, error: err});
            } catch(err) {
                global.api.Logger.warning(err);
            }
            return;
        }

        api.Twitch.getUserById(user.id, true, true).then(async twitchUser => {
            const user = connectingUsers.find(x => x.identity.id === twitchUser.identity?.id);
            if (user) {
                user.twitchAuth = true;
                res.redirect(api.Authentication.Discord.getURL("guilds.join identify", api.Authentication.Discord.CONNECT_REDIRECT));
            } else {
                res.send("Unable to find a connection process with your account: " + twitchUser.display_name);
            }
        }, err => {
            global.api.Logger.warning(err);
        });
    } else {
        res.redirect(api.Authentication.Twitch.getURL("user:read:email moderator:manage:banned_users", api.Authentication.Twitch.CONNECT_REDIRECT));
    }
});

router.get("/discord", async (req, res) => {
    const { query } = req;
	const { code } = query;

	if (code) {
		try {
			const oauthData = await api.Authentication.Discord.getToken(code, api.Authentication.Discord.CONNECT_REDIRECT);
            const user = await api.Authentication.Discord.getUser(oauthData.access_token, oauthData.token_type);

            if (user.hasOwnProperty("message") && user.message === "401: Unauthorized")  {
                res.redirect(api.Authentication.Discord.getURL("guilds.join identify", api.Authentication.Discord.CONNECT_REDIRECT));
                return;
            }
            
            const discordUser = await api.Discord.getUserById(user.id, false, true);
            
            const connectUser = connectingUsers.find(x => x.identity.id === discordUser.identity?.id);
            if (connectUser && connectUser.twitchAuth) {
                await connectUser.connect();
                res.redirect(SIGNON_URI);
            } else {
                res.send("Unable to find a connection process with your account: " + discordUser.name);
            }
		} catch (error) {
			// NOTE: An unauthorized token will not throw an error;
			// it will return a 401 Unauthorized response in the try block above
			global.api.Logger.warning(error);
            res.json({success: false, error: "An error occurred"});
		}
	} else {
        res.redirect(api.Authentication.Discord.getURL("guilds.join identify", api.Authentication.Discord.CONNECT_REDIRECT));
    }
});
 
module.exports = router;
