import {Router} from "express";
import {events, ListenSetting, logger, RawTwitchUser, TwitchRole, twitchUsers} from "@modbot/utils";
import bodyParser from "body-parser";

const router = Router();

const parseListenSetting = (input: string): ListenSetting | null => {
    if (Object.values(ListenSetting).includes(input as ListenSetting)) {
        return input as ListenSetting;
    }
    return null;
}

router.patch("/", bodyParser.json(), async (req, res) => {
    let allowedUsers: RawTwitchUser[] = [...req.users.twitch];
    let allRoles: TwitchRole[] = [];

    // Retrieve allowed users by TwitchRoles
    for (const user of req.users.twitch) {
        const roles = await TwitchRole.findAll({
            where: {
                userId: user.id,
            },
        });

        allRoles = [
            ...allRoles,
            ...roles,
        ];

        for (const role of roles) {
            allowedUsers.push(await twitchUsers.get(role.streamerId));
        }
    }

    let settings = new Map<string, ListenSetting>();
    for (const [userId, setting] of Object.entries(req.body)) {
        let user = allowedUsers.find(x => x.id === userId);

        // Handle error if user ID is not in the allowed list
        if (!user) {
            user = await twitchUsers.get(userId);
            res.json({
                ok: false,
                error: `You aren't authorized to edit the user ${user?.display_name ?? userId}!`,
            });
            return;
        }

        // Handle error if parsed setting is invalid
        const parsedSetting: ListenSetting | null = parseListenSetting(String(setting));
        if (!parsedSetting) {
            res.json({
                ok: false,
                error: `Invalid listen setting for user ${user.display_name}: ${setting}`,
            });
        }

        settings.set(userId, parsedSetting);
    }

    for (const [userId, setting] of settings) {
        try {
            const user = allowedUsers.find(x => x.id === userId);

            if (user.listen_setting !== setting) {
                if (user.listen_setting === ListenSetting.NONE) {
                    await events.publish("twitch:join", user);
                } else if (setting === ListenSetting.NONE) {
                    await events.publish("twitch:part", user);
                }

                await twitchUsers.update(userId, {
                    listen_setting: setting,
                });
            }

            const role = allRoles.find(x => x.streamerId === userId);
            if (role && !role.confirmed) {
                role.confirmed = true;
                await role.save();
            }
        } catch(err) {
            logger.error("Failed to update Twitch user " + userId + ": " + err);
        }
    }

    res.json({
        ok: true,
        data: settings.size,
    });
});

export default router;
