const express = require("express");
const router = express.Router();

const chatHistory = require("./chathistory");
const search = require("./search");
const user = require("./user");
const entry = require("./entry");
const streamerFunctions = require("./streamerfunctions");

const moderator = require("./moderator/");
const management = require("./management/");

router.use(require("../requireAuthenticated"));

const panelHome = async (req, res) => {
    let data = {
        twitchAccounts: [],
        discordAccounts: [],
        streamers: [],
        noPermission: req.noPermission,
        session: req.session,
    }

    if (req.authCode >= 2) {
        try {
            data.streamers = await req.session.identity.getActiveModeratorChannels();
            data.streamers = data.streamers.map(x => x.modForIdentity);
        } catch (err) {
            global.api.Logger.warning(err);
        }
        
        data.twitchAccounts = req.session.identity.twitchAccounts;
        data.discordAccounts = req.session.identity.discordAccounts;
    }

    res.render("pages/panel/index", data);
}

router.get("/", panelHome);
router.get("/no-permission", (req, res) => {
    req.noPermission = true;
    panelHome(req, res);
})

router.use("/chat-history", chatHistory);
router.use("/search", search);
router.use("/moderator", moderator);
router.use("/user", user);
router.use("/entry", entry);
router.use("/streamer-functions", streamerFunctions);
router.use("/management", management);

module.exports = router;