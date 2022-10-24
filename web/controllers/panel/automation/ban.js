const express = require("express");
const router = express.Router();
const api = require("../../../../api/");

router.get("/list", async (req, res) => {
    try {
        let data = {
            session: req.session,
            automations: await api.Automation.getBanAutomationsByCreator(req.session.identity.id),
        };

        res.render("pages/panel/automation/ban/list", data);
    } catch(err) {
        api.Logger.severe(err);
        res.send("An error occurred. Report this to an administrator");
    }
});

router.get("/create", async (req, res) => {
    let data = {
        session: req.session,
    };

    res.render("pages/panel/automation/ban/create", data);
});

router.post("/create", async (req, res) => {
    res.send("This is where I'd process that request, but I'm too lazy currently.")
});

module.exports = router;