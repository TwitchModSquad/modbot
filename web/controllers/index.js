const express = require("express");
const noAuthRouter = express.Router();
const authRouter = express.Router();

const signon = require("./signon/");
const panel = require("./panel/");

const join = require("./join");
const group = require("./group/");

const public = require("./public");

authRouter.use("/signon", signon);
authRouter.use("/panel", panel)

noAuthRouter.use("/join", join);
noAuthRouter.use("/g", group);
noAuthRouter.use("/group", group);

authRouter.get("/login", (req, res) => {
    res.redirect("/signon");
})

noAuthRouter.get("/ts", (req, res) => {
    res.redirect("https://r.3v.fi/discord-timestamps/");
});

noAuthRouter.use("/", public);

module.exports = {
    noAuth: noAuthRouter,
    auth: authRouter,
};