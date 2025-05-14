import {Router} from "express";
import {DiscordUser, identities, TwitchUser} from "@modbot/utils";

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

    const twitchUsers = await TwitchUser.findAll({
        where: {
            identity: identity.id,
        },
    });

    const discordUsers = await DiscordUser.findAll({
        where: {
            identity: identity.id,
        },
    });

    res.json({
        ok: true,
        data: {
            identity,
            users: {
                twitch: twitchUsers.map(x => x.raw()),
                discord: discordUsers.map(x => x.raw()),
            },
        },
    });
});

export default router;
