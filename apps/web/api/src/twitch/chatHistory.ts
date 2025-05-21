import {RawTwitchUser, TwitchChat, twitchUsers} from "@modbot/utils";
import {Router} from "express";
import {Op, WhereOptions} from "sequelize";

const router: Router = Router();

router.get("/", async (req, res) => {
    let where: WhereOptions<TwitchChat> = {};

    const chatterId = req?.query?.chatter_id;
    const streamerId = req?.query?.streamer_id;

    const cursor = req?.query?.cursor;

    let limit = 100;

    if (chatterId) {
        if (typeof chatterId === "string") {
            where.chatterId = chatterId;
        } else if (Array.isArray(chatterId) && chatterId.every(x => typeof x === "string")) {
            where.chatterId = {
                [Op.in]: chatterId,
            }
        }
    }

    if (streamerId) {
        if (typeof streamerId === "string") {
            where.streamerId = streamerId;
        } else if (Array.isArray(streamerId) && streamerId.every(x => typeof x === "string")) {
            where.streamerId = {
                [Op.in]: streamerId,
            }
        }
    }

    if (typeof cursor === "string") {
        const cursorDate = new Date(cursor);
        if (!isNaN(cursorDate.getTime())) {
            where.createdAt = {
                [Op.lt]: cursorDate,
            }
        }
    }

    if (req?.query?.limit) {
        let newLimit = Number(req.query.limit);
        if (!isNaN(newLimit) && newLimit > 0 && newLimit <= 100) {
            limit = newLimit;
        }
    }

    const twitchChats = await TwitchChat.findAll({
        where,
        order: [
            ["createdAt", "DESC"]
        ],
        limit,
    });

    const users = new Map<string, RawTwitchUser>();
    for (const twitchChat of twitchChats) {
        const streamerId = twitchChat.getDataValue("streamerId");
        const chatterId = twitchChat.getDataValue("chatterId");

        if (!users.has(streamerId)) {
            users.set(streamerId, await twitchUsers.get(streamerId));
        }
        if (!users.has(chatterId)) {
            users.set(chatterId, await twitchUsers.get(chatterId));
        }
    }

    res.json({
        ok: true,
        data: {
            twitchChats: twitchChats.map(x => x.raw()),
            users: Object.fromEntries(users),
        },
    });
});

export default router;
