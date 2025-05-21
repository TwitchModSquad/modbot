import { Router } from "express";
import {DiscordUser, TwitchUser} from "@modbot/utils";
import {Op} from "sequelize";

const router: Router = Router();

router.get("/", async (req, res) => {
    let query = req.query.query;

    if (!query) {
        res.json({
            ok: false,
            error: "Query must be provided!",
        });
        return;
    }

    query = String(query).replace("%", "");

    if (query.length < 3) {
        res.json({
            ok: false,
            error: "Query must be at least 3 characters!",
        });
    }

    const twitchUsers = (await TwitchUser.findAll({
        where: {
            login: {
                [Op.like]: `${query}%`,
            }
        },
        order: [
            ["follower_count", "DESC"],
        ],
        limit: 10,
    })).map(x => x.raw());

    const discordUsers = (await DiscordUser.findAll({
        where: {
            username: {
                [Op.like]: `${query}%`,
            }
        },
        limit: 10,
    })).map(x => x.raw());

    res.json({
        ok: true,
        data: {
            twitchUsers,
            discordUsers,
        },
    });
});

export default router;
