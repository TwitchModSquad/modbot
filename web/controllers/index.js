const express = require("express");
const noAuthRouter = express.Router();
const authRouter = express.Router();

const signon = require("./signon/");
const panel = require("./panel/");

const join = require("./join");

authRouter.use("/signon", signon);
authRouter.use("/panel", panel)

noAuthRouter.use("/join", join);

authRouter.get("/login", (req, res) => {
    res.redirect("/signon");
})

noAuthRouter.get("/", (req, res) => {
    res.render("pages/index")
});

module.exports = {
    noAuth: noAuthRouter,
    auth: authRouter,
};