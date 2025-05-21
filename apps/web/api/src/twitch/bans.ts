import {punishmentRoute} from "./punishmentRoute";
import {TwitchBan} from "@modbot/utils";
import {Router} from "express";

const router: Router = punishmentRoute(TwitchBan);

export default router;
