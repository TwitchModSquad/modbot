const express = require("express");
const noAuthRouter = express.Router();
const authRouter = express.Router();

const signon = require("./signon/");
const panel = require("./panel/");

const api = require("../../api/");

authRouter.use("/signon", signon);
authRouter.use("/panel", panel)

authRouter.use("/login", (req, res) => {
    res.redirect("/signon");
})

noAuthRouter.get("/", (req, res) => {
    res.render("pages/index")
});

const userRedirect = (req, res) => {
    res.redirect("/panel/user/" + req.params.user);
}

noAuthRouter.get("/t/:user", userRedirect);
noAuthRouter.get("/d/:user", userRedirect);
noAuthRouter.get("/i/:user", (req, res) => {
    api.getFullIdentity(req.params.user).then(identity => {
        if (identity.twitchAccounts.length > 0) {
            res.redirect("/panel/user/" + identity.twitchAccounts[0].id);
        } else if (identity.discordAccounts.length > 0) {
            res.redirect("/panel/user/" + identity.discordAccounts[0].id);
        } else {
            res.send("Invalid identity ID");
        }
    }, err => {
        api.Logger.warning(err);
        res.send("Invalid identity ID");
    });
});

module.exports = {
    noAuth: noAuthRouter,
    auth: authRouter,
};