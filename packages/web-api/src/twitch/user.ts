import {Router} from "express";
import {twitchUsers} from "@modbot/utils";

const router = Router();

router.get("/:id", async (req, res) => {
    let force = false;

    if (req.query.hasOwnProperty("force")) {
        force = true;
    }

    const user = await twitchUsers.get(req.params.id, force);
    if (user) {
        res.json({
            ok: true,
            data: user,
        });
    } else {
        res.status(404).json({
            ok: false,
            error: "User not found!",
        });
    }
});

router.get("/login/:login", async (req, res) => {
    let force = false;

    if (req.query.hasOwnProperty("force")) {
        force = true;
    }

    const user = await twitchUsers.getByName(req.params.login, force);
    if (user) {
        res.json({
            ok: true,
            data: user,
        });
    } else {
        res.status(404).json({
            ok: false,
            error: "User not found!",
        });
    }
});

export default router;
