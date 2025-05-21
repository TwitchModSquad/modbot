import {Router} from "express";

import discord from "./discord";
import logout from "./logout";
import twitch from "./twitch";

const router: Router = Router();

router.use("/discord", discord)
router.use("/logout", logout);
router.use("/twitch", twitch);

export default router;
