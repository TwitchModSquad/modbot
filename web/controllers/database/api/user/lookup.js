const express = require("express");
const router = express.Router();

const con = require("../../../../../database");
const api = require("../../../../../api/");

router.get("/", (req, res) => {
    if (!req.query.hasOwnProperty("query")) {
        res.json({ok: false, error: "Missing parameter 'query'"});
        return;
    }

    if (req.query.query.length < 2) {
        res.json({ok: false, error: "Query must be at least 2 characters long"});
        return;
    }
    
    let query = req.query.query;

    con.query("select id from twitch__username where display_name like ? order by last_seen asc, first_seen asc limit 10;",
    [
        "%"+query.replace("%","").replace("_","")+"%"
    ],
    async (err, result) => {
        if (err) {
            res.json({ok: false, error: "SQL Error occurred. Report this to https://github.com/TwitchModSquad/modbot"});
            api.Logger.severe(err);
            return;
        }

        let users = [];
        for (let i = 0; i < result.length; i++) {
            try {
                let user = await api.Twitch.getUserById(result[i].id);
                delete user.identity;

                users = [
                    ...users,
                    user,
                ]
            } catch(err) {
                api.Logger.severe(err);
            }
        }
        res.json({ok: true, users: users});
    });
});

module.exports = router;
