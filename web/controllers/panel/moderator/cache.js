const express = require("express");
const router = express.Router();

const api = require("../../../../api/");

router.use("/", (req, res) => {
    let data = {
        session: req.session,
        discord: {
            user: Object.keys(api.Discord.userCache.objectStore).length,
            guild: Object.keys(api.Discord.guildCache.objectStore).length,
        },
        group: Object.keys(api.Group.groupCache.objectStore).length,
        sessions: Object.keys(api.Session.cache.objectStore).length,
        twitch: {
            user: Object.keys(api.Twitch.userCache.objectStore).length,
            streamercommands: Object.keys(api.Twitch.streamerCommands.objectStore).length,
        },
    };

    res.render("pages/panel/moderator/cache", data);
});

module.exports = router;