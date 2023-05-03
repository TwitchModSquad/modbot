const express = require("express");
const router = express.Router();

const api = require("../../../../api/");

const config = require("../../../../config.json");

const lookup = require("./lookup");

function comma(x) {
    if (!x) return "0";
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

router.use("/lookup", lookup);

router.get("/:id", (req, res) => {
    api.Twitch.getUserById(req.params.id).then(async user => {
        let communities = await user.getActiveCommunities();
        let chatCount = 0;

        communities.forEach(community => {
            chatCount += community.chatCount;
        });
        
        res.render("pages/database/user/view", {
            twitch_uri: api.Authentication.Twitch.DATABASE_TWITCH_URL,
            domain: config.db_domain,
            user: req.user,
            view: user,
            info: {
                bans: await user.getBans(),
                timeouts: await user.getTimeouts(),
                usernames: await user.getNames(),
                roles: await user.getRoles(),
                communities: communities,
                chatCount: chatCount,
            },
            comma: comma,
        });
    }, () => {
        res.redirect(config.db_domain + "user/lookup?error=" + encodeURIComponent("Specified user ID does not exist"));
    });
});

module.exports = router;
