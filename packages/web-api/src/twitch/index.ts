import {Router} from "express";

import user from "./user";

const router = Router();

router.use("/users?", user);

export default router;
