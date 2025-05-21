import {Router} from "express";
import {RawTwitchUser, RoleType, TwitchRole, twitchUsers} from "@modbot/utils";

const router: Router = Router();

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

router.get("/:id/moderators", async (req, res) => {
    const roles = await TwitchRole.findAll({
        where: {
            type: RoleType.MODERATOR,
            streamerId: req.params.id,
        },
    });

    const users = new Map<string, RawTwitchUser>();
    users.set(req.params.id, await twitchUsers.get(req.params.id));
    for (const role of roles) {
        const user = await twitchUsers.get(role.userId);
        if (user) {
            users.set(user.id, user);
        }
    }

    res.json({
        ok: true,
        data: {
            roles: roles.map(x => x.raw()),
            users: Object.fromEntries(users),
        },
    });
});

router.get("/:id/streamers", async (req, res) => {
    const roles = await TwitchRole.findAll({
        where: {
            type: RoleType.MODERATOR,
            userId: req.params.id,
        },
    });

    const users = new Map<string, RawTwitchUser>();
    users.set(req.params.id, await twitchUsers.get(req.params.id));
    for (const role of roles) {
        const user = await twitchUsers.get(role.streamerId);
        if (user) {
            users.set(user.id, user);
        }
    }

    res.json({
        ok: true,
        data: {
            roles: roles.map(x => x.raw()),
            users: Object.fromEntries(users),
        },
    });
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
