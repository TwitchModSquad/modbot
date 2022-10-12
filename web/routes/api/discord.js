const {Router} = require("express");
const api = require("../../../api/index");

const requireAuthenticated = require("./requireAuthenticated");

const router = Router();

router.use(requireAuthenticated);

router.get("/", (req, res) => {
    res.json({success: true, data: req.session.identity});
});
 
router.get('/:discordId', (req, res) => {
    api.Discord.getUserById(req.params.discordId, false, true).then(discordUser => {
        res.json({success: true, data: discordUser});
    }).catch(err => {
        if (err === "User not found!") {
            res.json({success: true, data: null});
        } else {
            res.json({success: false, error: err});
        }
    });
});

router.get('/:discordId/punishments', (req, res) => {
    res.json({success: true, data:{timeouts: [], bans: []}})
});
 
module.exports = router;