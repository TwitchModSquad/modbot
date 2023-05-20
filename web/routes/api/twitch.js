const {Router} = require("express");
const api = require("../../../api/index");

const requireAuthenticated = require("./requireAuthenticated");

const router = Router();

router.use(requireAuthenticated);

router.get("/", (req, res) => {
    res.json({success: true, data: req.session.identity});
});
 
router.get('/:twitchId', (req, res) => {
    api.Twitch.getUserById(req.params.twitchId).then(twitchUser => {
        delete twitchUser.email;
        res.json({success: true, data: twitchUser});
    }).catch(err => {
        if (err === "User not found!") {
            res.json({success: true, data: null});
        } else {
            res.json({success: false, error: err});
        }
    });
});

router.get('/:twitchId/punishments', (req, res) => {
    const sendError = err => res.json({success: false, error: err});

    api.Twitch.getUserById(req.params.twitchId).then(twitchUser => {
        twitchUser.getBans().then(bans => {
            twitchUser.getTimeouts().then(timeouts => {
                bans.forEach(ban => {
                    delete ban.channel.email;
                    delete ban.user.email;
                });
                timeouts.forEach(timeout => {
                    delete timeout.channel.email;
                    delete timeout.user.email;
                });
                res.json({
                    success: true,
                    data: {
                        timeouts: timeouts,
                        bans: bans,
                    }
                });
            }, sendError);
        }, sendError);
    }, sendError);
});
 
module.exports = router;