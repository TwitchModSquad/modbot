import {Router} from "express";
import {discordUsers} from "@modbot/utils";

const router: Router = Router();

router.get("/:id", async (req, res) => {
    let force = false;

    if (req.query.hasOwnProperty("force")) {
        force = true;
    }

    const user = await discordUsers.get(req.params.id, force);

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

router.get("/username/:username", async (req, res) => {
    const user = await discordUsers.getByName(req.params.username);
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
