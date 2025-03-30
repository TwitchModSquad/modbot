import {Router} from "express";
import {twitchUsers} from "@modbot/utils";

const router = Router();

router.get("/:id", async (req, res) => {
    const user = await twitchUsers.get(req.params.id);
    if (user) {
        res.json({
            ok: true,
            data: user,
        });
    } else {
        res.json({
            ok: false,
            error: "User not found!",
        });
    }
});

router.get("/login/:login", async (req, res) => {
    const user = await twitchUsers.getByName(req.params.login);
    if (user) {
        res.json({
            ok: true,
            data: user,
        });
    } else {
        res.json({
            ok: false,
            error: "User not found!",
        });
    }
});

export default router;
