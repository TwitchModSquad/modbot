import {Router} from "express";
import {WhereOptions} from "sequelize";
import {RawTwitchUser, TwitchChatActivity, twitchUsers} from "@modbot/utils";

const router: Router = Router();

router.get("/", async (req, res) => {
    const streamerId = req?.query?.streamer_id;
    const chatterId = req?.query?.chatter_id;

    let page = 1;
    let limit = 100;

    const whereOptions: WhereOptions<TwitchChatActivity> = {};

    if (streamerId && typeof streamerId === "string" && streamerId.length > 0) {
        whereOptions.streamerId = streamerId;
    } else if (chatterId && typeof chatterId === "string" && chatterId.length > 0) {
        whereOptions.chatterId = chatterId;
    }

    if (req?.query?.limit) {
        const limitNum = Number(req.query.limit);
        if (!isNaN(limitNum) && limitNum > 0 && limitNum <= 100) {
            limit = limitNum;
        }
    }

    if (req?.query?.page) {
        const pageNum = Number(req.query.page);
        if (!isNaN(pageNum) && pageNum > 0) {
            page = pageNum;
        }
    }

    const offset = (page - 1) * limit;
    const result = (await TwitchChatActivity.findAll({
        where: whereOptions,
        order: [
            ["count", "DESC"],
        ],
        limit,
        offset,
    })).map(x => x.raw());

    const users = new Map<string, RawTwitchUser>();
    for (const log of result) {
        if (!users.has(log.streamerId)) {
            users.set(log.streamerId, await twitchUsers.get(log.streamerId));
        }
        if (!users.has(log.chatterId)) {
            users.set(log.chatterId, await twitchUsers.get(log.chatterId));
        }
    }

    res.json({
        ok: true,
        data: {
            logs: result,
            users: Object.fromEntries(users),
        },
    });
});

export default router;
