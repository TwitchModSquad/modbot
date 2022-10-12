const express = require("express");
const noAuthRouter = express.Router();
const authRouter = express.Router();

const signon = require("./signon/");
const panel = require("./panel/");

authRouter.use("/signon", signon);
authRouter.use("/panel", panel)

noAuthRouter.get("/", (req, res) => {
    res.render("pages/index")
});

module.exports = {
    noAuth: noAuthRouter,
    auth: authRouter,
};