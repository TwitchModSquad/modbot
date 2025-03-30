import express from "express";
import cookieParser from "cookie-parser";

import {logger} from "@modbot/utils";

import auth from "./auth";

import discord from "./discord";
import identity from "./identity";
import twitch from "./twitch";

const PORT = process.env.API_PORT;

const app = express();

app.use(cookieParser());

app.use("/auth", auth);

app.use("/discord", discord);
app.use("/identity", identity);
app.use("/twitch", twitch);

app.listen(PORT, () => {
    logger.info(`Express listening on port ${PORT}`);
});
