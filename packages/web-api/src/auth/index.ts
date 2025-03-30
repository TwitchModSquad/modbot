import {Router} from "express";
import twitch from "./twitch";

const router = Router();

router.use("/twitch", twitch);

export default router;
