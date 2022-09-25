const express = require("express");
const router = express.Router();

const chatHistory = require("./chathistory");

router.get("/", async (req, res) => {
    let data = {
        twitchAccounts: [],
        discordAccounts: [],
        streamers: [],
    }

    if (req.authCode >= 2) {
        try {
            data.streamers = await req.session.identity.getActiveModeratorChannels();
            data.streamers = data.streamers.map(x => x.modForIdentity);
        } catch (err) {
            console.error(err);
        }
        
        data.twitchAccounts = req.session.identity.twitchAccounts;
        data.discordAccounts = req.session.identity.discordAccounts;
    }

    res.render("pages/panel/index", data);
});

router.use("/chat-history", chatHistory);

module.exports = router;