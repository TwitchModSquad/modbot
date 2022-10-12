const {Router} = require("express");
const api = require("../../../api/index");
const con = require("../../../database");

const requireAuthenticated = require("./requireAuthenticated");

const router = Router();

router.use(requireAuthenticated);

router.get("/", (req, res) => {
    api.Twitch.Chat.getLogs(
        req.query.channel,
        req.query.user,
        req.query.time_start,
        req.query.time_end,
        req.query.limit ? Number(req.query.limit) : undefined,
        req.query.offset ? Number(req.query.offset) : undefined,
        req.query.include_fillers !== "false" && req.query.include_fillers !== "0"
    ).then(logs => {
        res.elapsedJson({success: true, data: logs});
    }, err => {
        res.json({success: false, error: err});
    });
});

router.get("/overview/:user", (req, res) => {
    api.Twitch.Chat.getOverview(req.params.user).then(overview => {
        res.elapsedJson({success: true, data: overview});
    }, err => {
        res.json({success: false, error: err});
    })
})

//TODO: Name this something better...
router.get("/select-menu", (req, res) => {
    if (req.query.user) {
        con.query("select streamer_id, chat_count from twitch__chat_chatters where chatter_id = ? order by chat_count desc;", [req.query.user], async (err, response) => {
            if (err) {
                global.api.Logger.warning(err);
                res.json({success: false, error: err});
                return;
            }

            let result = [];

            for (let i = 0; i < response.length; i++) {
                result = [
                    ...result,
                    {
                        streamer: await api.Twitch.getUserById(response[i].streamer_id),
                        count: response[i].chat_count,
                    }
                ]
            }

            res.json({success: true, data: result});
        });
    } else if (req.query["all-streamers"]) {
        con.query("select streamer_id, chat_count from twitch__chat_streamers order by chat_count desc;", async (err, response) => {
            if (err) {
                global.api.Logger.warning(err);
                res.json({success: false, error: err});
                return;
            }

            let result = [];

            for (let i = 0; i < response.length; i++) {
                result = [
                    ...result,
                    {
                        streamer: await api.Twitch.getUserById(response[i].streamer_id),
                        count: response[i].chat_count,
                    }
                ]
            }

            res.json({success: true, data: result});
        });
    } else if (req.query.channel) {
        con.query("select chatter_id, chat_count from twitch__chat_chatters where streamer_id = ? order by chat_count desc;", [req.query.channel], async (err, response) => {
            if (err) {
                global.api.Logger.warning(err);
                res.json({success: false, error: err});
                return;
            }

            let result = [];

            for (let i = 0; i < response.length; i++) {
                result = [
                    ...result,
                    {
                        user: await api.Twitch.getUserById(response[i].chatter_id),
                        count: response[i].chat_count,
                    }
                ]
            }

            res.elapsedJson({success: true, data: result});
        });
    } else {
        res.json({success: false, error: "Either a user, channel, or all-streamers query must be specified"});
    }
});

router.get("/:channel", (req, res) => {
    api.Twitch.Chat.getLogs(
        req.params.channel,
        req.query.user,
        req.query.time_start,
        req.query.time_end,
        req.query.limit ? Number(req.query.limit) : undefined,
        req.query.offset ? Number(req.query.offset) : undefined,
        req.query.include_fillers !== "false" && req.query.include_fillers !== "0"
    ).then(logs => {
        res.elapsedJson({success: true, data: logs});
    }, err => {
        res.json({success: false, error: err});
    });
});

router.get("/:channel/:user", (req, res) => {
    if (req.params.channel === "all") req.params.channel = null;
    api.Twitch.Chat.getLogs(
        req.params.channel,
        req.params.user,
        req.query.time_start,
        req.query.time_end,
        req.query.limit ? Number(req.query.limit) : undefined,
        req.query.offset ? Number(req.query.offset) : undefined,
        req.query.include_fillers !== "false" && req.query.include_fillers !== "0"
    ).then(logs => {
        res.elapsedJson({success: true, data: logs});
    }, err => {
        res.json({success: false, error: err});
    });
});
 
module.exports = router;