const express = require("express");
const router = express.Router();

const api = require("../../../api/");
const con = require("../../../database");

const TwitchUser = require("../../../api/Twitch/TwitchUser");
const DiscordUser = require("../../../api/Discord/DiscordUser");

function comma(x) {
    if (!x) return "";
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

router.get("/twitch/:id", async (req, res) => {
    
});

router.get("/discord/:id", async (req, res) => {
    
});

router.get("/identity/:id", async (req, res) => {
    
});

router.get("/:user", async (req, res) => {
    let query = req.params.user;

    let users = [];

    const twitchUsers = await con.pquery("select id from twitch__user where id = ? or display_name = ?;", [query, query]);
    const discordUsers = await con.pquery("select id from discord__user where id = ? or name = ?;", [query, query]);

    let i;
    for (i = 0;i < twitchUsers.length; i++) {
        let user = twitchUsers[i];
        users = [
            ...users,
            await api.Twitch.getUserById(user.id),
        ]
    }
    
    for (i = 0;i < discordUsers.length; i++) {
        let user = discordUsers[i];
        users = [
            ...users,
            await api.Discord.getUserById(user.id),
        ]
    }

    if (users.length === 1) {
        let user = users[0];

        if (user instanceof TwitchUser) {
            let bans = await user.getBans();
            let timeouts = await user.getTimeouts();
            let identity = null;
            if (user.identity?.id) {
                identity = await api.getFullIdentity(user.identity.id);
            }
            let activeCommunities = null;
            try {
                activeCommunities = await user.getActiveCommunities();
            } catch(err) {
                api.Logger.warning(err);
            }
            let entries = [];
            try {
                let entrySet = await con.pquery("select distinct archive_id from archive__users where value = ? and user and type = 'twitch';", [user.id]);
                for (let i = 0;i < entrySet.length;i++) {
                    entries = [
                        ...entries,
                        await api.Archive.getEntryById(entrySet[i].archive_id),
                    ]
                }
            } catch(err) {
                api.Logger.warning(err);
            }
            res.render("pages/panel/user/twitch", {user: user, bans: bans, timeouts: timeouts, identity: identity, activeCommunities: activeCommunities, entries: entries, comma: comma, session: req.session});
        } else if (user instanceof DiscordUser) {
            let identity = null;
            if (user.identity?.id) {
                identity = await api.getFullIdentity(user.identity.id);
            }
            let entries = [];
            try {
                let entrySet = await con.pquery("select distinct archive_id from archive__users where value = ? and user and type = 'discord';", [user.id]);
                for (let i = 0;i < entrySet.length;i++) {
                    entries = [
                        ...entries,
                        await api.Archive.getEntryById(entrySet[i].archive_id),
                    ]
                }
            } catch(err) {
                api.Logger.warning(err);
            }
            let guilds = [];
            try {
                guilds = await user.getGuilds();
            } catch(err) {
                api.Logger.warning(err);
            }
            res.render("pages/panel/user/discord", {user: user, identity: identity, entries: entries, guilds: guilds, comma: comma, session: req.session});
        } else {
            api.Logger.warning("Invalid user found in /panel/user/" + query)
            res.send("no"); // TODO: Make error message better
        }
    } else {
        res.render("pages/panel/user/multiple", {users: users, query: query, comma: comma, session: req.session});
    }
});

module.exports = router;