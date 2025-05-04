import {Router} from "express";
import {identities} from "@modbot/utils";

const router = Router();

router.get("/me", async (req, res) => {
    const {identity, users} = req;
    res.json({
        ok: true,
        data: {
            identity,
            users,
        },
    });
});

router.get("/:id", async (req, res) => {
    const id = Number(req.params.id);

    const error = function(message: string) {
        res.json({
            ok: false,
            error: message,
        });
    }

    if (isNaN(id)) {
        return error("ID must be a number!");
    }

    const identity = await identities.get(id);

    if (!identity) {
        return error("Identity not found!");
    }

    res.json({
        ok: true,
        data: identity,
    });
});

export default router;
