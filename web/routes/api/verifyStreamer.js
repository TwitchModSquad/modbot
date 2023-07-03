const {Router} = require("express");
const api = require("../../../api/index");

const requireAuthenticated = require("./requireAuthenticated");

const router = Router();

router.use(requireAuthenticated);

router.get("/:streamer", (req, res) => {
    let message = "Hello from TMS!";
    if (req.query.hasOwnProperty("message")) {
        message = req.query.message;
    }
    api.Twitch.getUserByName(req.params.streamer, true).then(async users => {
        if (users.length === 0) {
            res.json({success: false, errors: ["No users found!"]});
            return;
        }
        const streamer = users[0];
        let errors = [];
        let isMod = false;
        for (let i = 0; i < req.session.identity.twitchAccounts.length; i++) {
            const twitchUser = req.session.identity.twitchAccounts[i];
            try {
                isMod = await api.Token.checkModeratorStatus(twitchUser, streamer, message);
            } catch(err) {
                api.Logger.warning(err);
                errors.push(err);
            }
            if (isMod) break;
        }
        res.json({
            success: errors.length === 0,
            errors: errors,
            data: {
                isMod: isMod,
                streamer: streamer,
                moderator: req.session.identity,
            },
        });
    }, err => {
        api.Logger.warning(err);
        res.json({success: false, errors: [err]});
    });
});
 
module.exports = router;