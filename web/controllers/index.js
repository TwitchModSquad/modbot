const express = require("express");
const noAuthRouter = express.Router();
const authRouter = express.Router();

const signon = require("./signon/");
const panel = require("./panel/");

authRouter.use("/signon", signon);
authRouter.use("/panel", panel)

module.exports = {
    noAuth: noAuthRouter,
    auth: authRouter,
};