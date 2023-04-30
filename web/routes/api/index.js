const {Router} = require("express");

const archive = require("./archive");
const auth = require("./auth");
const chat = require("./chat");
const connect = require("./connect");
const contactUs = require("./contact-us");
const discord = require("./discord");
const file = require("./file");
const identity = require("./identity");
const search = require("./search");
const shortlink = require("./shortlink");
const status = require("./status");
const streamers = require("./streamers");
const twitch = require("./twitch");

const noAuthRouter = Router();
const authRouter = Router();

noAuthRouter.use("/contact-us", contactUs);
noAuthRouter.use("/auth", auth);
noAuthRouter.use("/connect", connect);

authRouter.use("/archive", archive);
authRouter.use("/chat", chat);
authRouter.use("/discord", discord);
authRouter.use("/file", file);
authRouter.use("/identity", identity);
authRouter.use("/search", search);
authRouter.use("/shortlink", shortlink);
authRouter.use("/status", status);
authRouter.use("/streamers", streamers);
authRouter.use("/twitch", twitch);
 
module.exports = {
    auth: authRouter,
    noAuth: noAuthRouter,
};