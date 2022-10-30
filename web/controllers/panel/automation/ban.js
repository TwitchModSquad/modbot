const express = require("express");
const bodyParser = require("body-parser");

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
        targets: [],
    };

    streamers = await req.session.identity.getActiveModeratorChannels();

    for (let i = 0; i < streamers.length; i++) {
        data.targets = [
            ...data.targets,
            ...streamers[i].modForIdentity.twitchAccounts,
        ]
    }

    res.render("pages/panel/automation/ban/create", data);
});

router.get("/edit/:id", async (req, res) => {
    let automation;
    try {
        automation = await api.Automation.getBanAutomation(req.params.id);
    } catch (err) {
        api.Logger.severe(err);
        res.send("error!");
    }

    if (automation.creator.id !== req.session.identity.id) {
        res.redirect("/panel/no-permission");
        return;
    }

    let data = {
        session: req.session,
        targets: [],
        automation: automation,
        selectedTargets: automation.targets.map(x => x.id+""),
        rules: {
            streamers: automation.rules.filter(x => x.type === "streamer"),
            moderators: automation.rules.filter(x => x.type === "moderator"),
            reason: automation.rules.filter(x => x.type === "reason").map(x => x.value),
            chatlog: automation.rules.filter(x => x.type === "chatlog").map(x => x.value),
        },
    };

    streamers = await req.session.identity.getActiveModeratorChannels();

    for (let i = 0; i < streamers.length; i++) {
        data.targets = [
            ...data.targets,
            ...streamers[i].modForIdentity.twitchAccounts,
        ]
    }

    let streamerRules = [];
    for (let i = 0; i < data.rules.streamers.length; i++) {
        try {
            streamerRules = [
                ...streamerRules,
                await data.rules.streamers[i].getUser(),
            ]
        } catch (err) {
            api.Logger.warning(err);
        }
    }
    data.rules.streamers = streamerRules;

    let moderatorRules = [];
    for (let i = 0; i < data.rules.moderators.length; i++) {
        try {
            moderatorRules = [
                ...moderatorRules,
                await data.rules.moderators[i].getUser(),
            ]
        } catch (err) {
            api.Logger.warning(err);
        }
    }
    data.rules.moderators = moderatorRules;
    
    res.render("pages/panel/automation/ban/edit", data);
});

router.use(bodyParser.urlencoded({extended: true}));

router.post("/create", async (req, res) => {
    let body = req.body;
    let ok = true;
    let missingParameters = [];
    let error = "";

    if (!body) {
        ok = false;
        missingParameters = ["automation-name", "targets", "rules"];
    }
    if (!body.hasOwnProperty("automation-name")) {
        ok = false;
        missingParameters = [...missingParameters, "automation-name"];
    }
    if (!body.hasOwnProperty("targets")) {
        ok = false;
        missingParameters = [...missingParameters, "targets"];
    }
    if (!(body.hasOwnProperty("rule-streamer") || body.hasOwnProperty("rule-moderator") || body.hasOwnProperty("rule-reason") || body.hasOwnProperty("rule-chatlog"))) {
        ok = false;
        missingParameters = [...missingParameters, "rules"];
    }

    const createError = async error => {
        let selectedTargets = body.hasOwnProperty("targets") ? body.targets : [];
        if (typeof(selectedTargets) === "string") selectedTargets = [selectedTargets];
        
        let data = {
            session: req.session,
            targets: [],
            error: error,
            automationName: (body["automation-name"] ? body["automation-name"] : ""),
            selectedTargets: selectedTargets,
            rules: {
                streamers: body.hasOwnProperty("rule-streamer") ? body["rule-streamer"] : [],
                moderators: body.hasOwnProperty("rule-moderator") ? body["rule-moderator"] : [],
                reason: body.hasOwnProperty("rule-reason") ? body["rule-reason"] : [],
                chatlog: body.hasOwnProperty("rule-chatlog") ? body["rule-chatlog"] : [],
            },
        };
    
        streamers = await req.session.identity.getActiveModeratorChannels();
    
        for (let i = 0; i < streamers.length; i++) {
            data.targets = [
                ...data.targets,
                ...streamers[i].modForIdentity.twitchAccounts,
            ]
        }
    
        let streamerRules = [];
        for (let i = 0; i < data.rules.streamers.length; i++) {
            try {
                streamerRules = [
                    ...streamerRules,
                    await api.Twitch.getUserById(data.rules.streamers[i]),
                ]
            } catch (err) {
                api.Logger.warning(err);
            }
        }
        data.rules.streamers = streamerRules;
    
        let moderatorRules = [];
        for (let i = 0; i < data.rules.moderators.length; i++) {
            try {
                moderatorRules = [
                    ...moderatorRules,
                    await api.Twitch.getUserById(data.rules.moderators[i]),
                ]
            } catch (err) {
                api.Logger.warning(err);
            }
        }
        data.rules.moderators = moderatorRules;
    
        res.render("pages/panel/automation/ban/createError", data);
    }

    if (ok) {
        let automationName = body["automation-name"];
        let targets = body.targets;
        let rules = {
            streamers: body.hasOwnProperty("rule-streamer") ? body["rule-streamer"] : [],
            moderators: body.hasOwnProperty("rule-moderator") ? body["rule-moderator"] : [],
            reason: body.hasOwnProperty("rule-reason") ? body["rule-reason"] : [],
            chatlog: body.hasOwnProperty("rule-chatlog") ? body["rule-chatlog"] : [],
        };

        if (typeof(targets) === "string") targets = [targets];

        api.Automation.createBanAutomation(req.session.identity, automationName).then(async automation => {
            let errors = [];

            const addError = err => {
                api.Logger.warning(err);
                errors = [
                    ...errors,
                    err,
                ]
            }

            for (let i = 0; i < targets.length; i++) {
                try {
                    await automation.addTarget(await api.Twitch.getUserById(targets[i]));
                } catch (err) {
                    addError(err);
                }
            }

            for (let i = 0; i < rules.streamers.length; i++) {
                try {
                    await automation.addRuleStreamer(await api.Twitch.getUserById(rules.streamers[i]));
                } catch (err) {
                    addError(err);
                }
            }

            for (let i = 0; i < rules.moderators.length; i++) {
                try {
                    await automation.addRuleModerator(await api.Twitch.getUserById(rules.moderators[i]));
                } catch (err) {
                    addError(err);
                }
            }

            for (let i = 0; i < rules.reason.length; i++) {
                try {
                    await automation.addRuleReason(rules.reason[i]);
                } catch (err) {
                    addError(err);
                }
            }

            for (let i = 0; i < rules.chatlog.length; i++) {
                try {
                    await automation.addRuleChatLog(rules.chatlog[i]);
                } catch (err) {
                    addError(err);
                }
            }

            res.redirect("/panel/automation/ban/edit/" + automation.id);
        }, err => {
            createError(err);
        });
    } else {
        if (missingParameters.length > 0) {
            error = `Missing parameter${missingParameters.length === 1 ? "" : "s"}: ${missingParameters.join(", ")}`;
        }
        createError(error);
    }
});

module.exports = router;