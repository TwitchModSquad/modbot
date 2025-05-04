import {Router} from "express";

import {
    authProvider, getTwitchClient,
    getTwitchURL, identities,
    Identity,
    IdentityRole,
    logger,
    RawTwitchUser,
    RoleType,
    sessions,
    TwitchRole,
    twitchTokens,
    TwitchUserBroadcasterType,
    twitchUsers,
    verifyState,
} from "@modbot/utils";
import discordTokenManager from "@modbot/utils/dist/managers/discord/DiscordTokenManager";

const updateRoles = async (user: RawTwitchUser, identityRole: IdentityRole): Promise<IdentityRole> => {
    const currentRoles = await TwitchRole.findAll({
        where: {
            userId: user.id,
        },
    });
    const moderatedChannels = await getTwitchClient().moderation.getModeratedChannels(user.id);
    for (const channel of moderatedChannels.data) {
        const streamer = await twitchUsers.get(channel.id, true);
        if (streamer) {
            const follower_count = await getTwitchClient().channels.getChannelFollowerCount(streamer.id);
            if (identityRole === IdentityRole.NON_MEMBER ||
                streamer.broadcaster_type === TwitchUserBroadcasterType.PARTNER ||
                follower_count >= 5000) {
                logger.info(`${user.display_name} meets membership requirements due to ${streamer.display_name}`);
                identityRole = IdentityRole.MEMBER;
            }
            await twitchUsers.update(streamer.id, {
                follower_count,
            });
            await TwitchRole.upsert({
                userId: user.id,
                streamerId: streamer.id,
                type: RoleType.MODERATOR,
            });
        } else {
            logger.error(`Could not retrieve streamer ${channel.id}!`);
        }
    }
    for (const role of currentRoles) {
        const foundRole = moderatedChannels.data.find(x => x.id === role.streamerId);
        if (!foundRole) {
            await role.destroy();
        }
    }
    return identityRole;
}

const router = Router();

const ROLE_UPDATE_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days

router.get("/", async (req, res) => {
    const { query, cookies } = req;
    const { code, state } = query;

    const successRedirect = () => {
        if (cookies?.v3_redirect && cookies.v3_redirect.startsWith(process.env.DASHBOARD_URI)) {
            res.redirect(cookies.v3_redirect);
        } else {
            res.redirect(process.env.DASHBOARD_URI);
        }
    }

    if (code && state && await verifyState(String(state))) {
        try {
            const userId = await authProvider.addUserForCode(String(code));
            let twitchUser = await twitchUsers.get(userId, true);

            const accessToken = await authProvider.getAccessTokenForUser(userId);
            await twitchTokens.set(userId, accessToken);

            logger.info(`Twitch user ${twitchUser.login} logged in`);

            let identityId: number = twitchUser.identity;

            let identity;

            if (!identityId) {
                identity = await Identity.create({});
                identityId = identity.id;
                twitchUser = await twitchUsers.update(twitchUser.id, {
                    identity: identityId,
                });
                logger.info(`Twitch user ${twitchUser.login} assigned new identity: ${twitchUser.identity}`);
            }

            if (!twitchUser.rolesLastUpdatedDate ||
                new Date(twitchUser.rolesLastUpdatedDate).getTime() < Date.now() + ROLE_UPDATE_INTERVAL) {

                if (!identity) {
                    identity = await identities.get(twitchUser.identity);
                }

                const newMembershipRole = await updateRoles(twitchUser, identity.role);
                if (newMembershipRole !== identity.role) {
                    await identities.update(identity.id, {
                        role: newMembershipRole,
                    });
                }
            }

            const session = await sessions.createSession(identityId);

            res.cookie("v3_session", session.id, {
                maxAge: sessions.expiresIn * 1000,
                domain: process.env.DOMAIN,
                path: "/",
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
            });

            const discordUsers = await identities.getDiscordUsers(identityId);
            if (discordUsers.length === 0) {
                res.redirect(discordTokenManager.getURI());
                return;
            }

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

