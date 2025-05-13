import {Router} from "express";
import {RawTwitchUser, twitchUsers} from "@modbot/utils";

const router = Router();

router.get("/", async (req, res) => {
    let userIds = (Array.isArray(req.query.user_id)
        ? req.query.user_id
        : [req.query.user_id]).filter(x => typeof x === "string");

    const result = new Map<string, RawTwitchUser>();
    for (const id of userIds) {
        const user = await twitchUsers.get(id);
        if (user) {
            result.set(user.id, user);
        } else {
            res.status(404).json({
                ok: false,
                error: `User with ID ${id} was not found!`,
            });
            return;
        }
    }

    res.json({
        ok: true,
        data: Object.fromEntries(result),
    });
});

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
