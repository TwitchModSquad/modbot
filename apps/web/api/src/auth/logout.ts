import {Router} from "express";
import {sessions} from "@modbot/utils";
const router = Router();

router.get("/", async (req, res) => {
    if (req?.session?.id) {
        await sessions.delete(req.session.id);
        req.flushCache();
    }

    res.redirect(process.env.PUBLIC_WEB_URI);
});

export default router;
