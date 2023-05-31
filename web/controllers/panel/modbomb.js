const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");

const api = require("../../../api/");

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

router.get("/", async (req, res) => {
    const event = api.ModBomb.current;
    if (event) {
        const month = MONTHS[event.endTime.getMonth()];
        if (!event.hasUserSubmitted(req.session.identity)) {
            res.render("pages/panel/modbomb/index", {session: req.session, event: event, month: month});
        } else {
            res.render("pages/panel/modbomb/alreadySubmitted", {session: req.session, event: event, month: month});
        }
    } else {
        res.render("pages/panel/modbomb/noCurrent", {session: req.session});
    }
});

router.use(bodyParser.urlencoded({extended: true}));

router.post("/", async (req, res) => {
    const error = err => {
        res.render("pages/panel/modbomb/error", {session: req.session, error: err});
    }
    let votes = [];
    for (const param in req.body) {
        const id = param.replace("vote-", "");
        try {
            const user = await api.Twitch.getUserById(id);
            const count = Number(req.body[param]);
            if (isNaN(count)) {
                error(`Invalid count ${req.body[param]} for user ID ${id}`);
                return;
            }
            votes.push({
                user: user,
                votes: count
            });
        } catch(err) {
            if (err === "User not found!") {
                error(`User with ID ${id} could not be resolved!`);
            } else {
                api.Logger.warning(err);
                error("An unexpected error occurred! Please try again!");
                return;
            }
            return;
        }
    }
    api.ModBomb.current.vote(req.session.identity, votes).then(vote => {
        res.render("pages/panel/modbomb/success", {session: req.session});
    }, err => {
        api.Logger.warning(err);
        error("An unexpected error occurred! Please try again!");
    });
});

module.exports = router;