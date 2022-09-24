const {Router} = require("express");
const api = require("./api/");

const noAuthRouter = Router();
const authRouter = Router();

noAuthRouter.use("/api", api.noAuth);

authRouter.use("/api", api.auth);
 
module.exports = {
    auth: authRouter,
    noAuth: noAuthRouter,
};