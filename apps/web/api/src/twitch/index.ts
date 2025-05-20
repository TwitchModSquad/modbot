import {Router} from "express";

import activity from "./activity";
import bans from "./bans";
import chatHistory from "./chatHistory";
import streamerSettings from "./streamerSettings";
import timeouts from "./timeouts";
import user from "./user";

const router = Router();

router.use("/activity", activity);
router.use("/bans?", bans);
router.use("/chat-history", chatHistory);
router.use("/streamer-settings?", streamerSettings);
router.use("/timeouts?", timeouts);
router.use("/users?", user);

export default router;
