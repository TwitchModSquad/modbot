const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();

const api = require("../../../api/");
const con = require("../../../database");

router.get("/:id", (req, res) => {
    api.Group.getGroupById(req.params.id).then(group => {
        res.render("pages/group/view", {group: group});
    }).catch(err => {
        api.Logger.warning(err);
        res.send("Nope!");
    });
});

router.get("/u/:name", (req, res) => {
    api.Twitch.getUserByName(req.params.name, false).then(users => {
        let user = users[0];

        con.query("select id from group__user join `group` on `group`.id = group__user.group_id where group__user.user_id = ? and `group`.active order by `group`.starttime asc;", [user.id], async (err, result) => {
            if (!err) {
                if (result.length === 0) {
                    result.send("Nope!");
                } else if (result.length === 1) {
                    api.Group.getGroupById(result[0].id).then(group => {
                        res.render("pages/group/view", {group: group});
                    }, err => {
                        api.Logger.warning(err);
                        res.send("Nope!");
                    });
                } else {
                    let groups = [];
                    for (let i = 0; i < result.length; i++) {
                        groups = [
                            ...groups,
                            await api.Group.getGroupById(result[i].id),
                        ];
                    }
                    res.render("pages/group/multiple", {user: user, groups: groups});
                }
            } else {
                res.send(err);
            }
        });
    }, err => {
        res.send(err);
    })
});

router.get("/:token/settime", (req, res) => {
    let token = req.params.token;

    con.query("select id from `group` where token = ?;", [token], (err, result) => {
        if (err) {
            api.Logger.warning(err);
            res.send("Nope!");
        } else {
            if (result.length > 0) {
                api.Group.getGroupById(result[0].id).then(group => {
                    res.render("pages/group/settime", {group: group});
                }, err => {
                    api.Logger.warning(err);
                    res.send("Nope!");
                })
            } else {
                res.send("Nope!");
            }
        }
    });
});

router.use(bodyParser.urlencoded({extended: true}));

router.post("/:token/settime", (req, res) => {
    let token = req.params.token;
    let date = Number(req.body?.datetime);

    if (!date || isNaN(date)) {
        res.render("pages/group/settime", {group: group, error: "Unable to process datetime value: " + req.body?.datetime});
        return;
    }

    con.query("select id, token_identity from `group` where token = ?;", [token], (err, result) => {
        if (err) {
            api.Logger.warning(err);
            res.send("Nope!");
        } else {
            if (result.length > 0) {
                api.Group.getGroupById(result[0].id).then(async group => {
                    let identity = null;

                    if (result[0].token_identity) {
                        try {
                            identity = await api.getFullIdentity(result[0].token_identity);
                        } catch(err) {
                            api.Logger.warning(err);
                        }
                    }

                    const now = new Date();
                    date = new Date(date * 1000);
                    let diff = date.getTime() - now.getTime();
                    if (diff >= 0) {
                        group.setStartTime(date, identity).then(() => {
                            res.render("pages/group/settime-success", {group: group, time: date.toLocaleString()});
                        }, err => {
                            res.render("pages/group/settime", {group: group, error: "Unknown error occurred!"});
                            api.Logger.severe(err);
                        });
                    } else {
                        res.render("pages/group/settime", {group: group, error: "Unable to set start time in the past!"});
                    }
                }, err => {
                    api.Logger.warning(err);
                    res.send("Nope!");
                })
            } else {
                res.send("Nope!");
            }
        }
    });
});

module.exports = router;