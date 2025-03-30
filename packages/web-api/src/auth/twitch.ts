import {Router} from "express";

import {
    twitchUsers,
    authProvider,
    twitchTokens,
    logger,
    getTwitchURL,
    verifyState,
    sessions,
    Identity, TwitchUser
} from "@modbot/utils";

const router = Router();

router.get("/", async (req, res) => {
    const { query, cookies } = req;
    const { code, state } = query;

    const successRedirect = () => {

    }

    if (code && state && await verifyState(String(state))) {
        try {
            const userId = await authProvider.addUserForCode(String(code));
            let twitchUser = await twitchUsers.get(userId, true);

            const accessToken = await authProvider.getAccessTokenForUser(userId);
            await twitchTokens.set(userId, accessToken);

            logger.info(`Twitch user ${twitchUser.login} logged in`);

            let identityId: number = twitchUser.identity;

            if (!identityId) {
                const identity = await Identity.create({}); // TODO: Maybe add some better creation stuffs?
                identityId = identity.id;
                await TwitchUser.update({
                    identity: identityId
                }, {
                    where: {
                        id: userId,
                    },
                });
                twitchUser = await twitchUsers.updateFromDB(twitchUser.id);
            }

            const session = await sessions.createSession(identityId);

            res.cookie("v3_session", session.id, {
                maxAge: sessions.expiresIn,
                domain: process.env.DOMAIN,
                path: "/",
                httpOnly: true,
                sameSite: "strict",
                secure: process.env.NODE_ENV === "production",
            });

            successRedirect();

            return;
        } catch(err) {
            logger.error("Error while logging in:");
            logger.error(err);
        }
    }
    res.redirect(await getTwitchURL());
});

export default router;

