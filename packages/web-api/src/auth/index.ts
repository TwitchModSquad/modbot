import {Router} from "express";
import discord from "./discord";
import twitch from "./twitch";

const router = Router();

router.use("/discord", discord)
router.use("/twitch", twitch);

export default router;
