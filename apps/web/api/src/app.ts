import express from "express";
import cookieParser from "cookie-parser";

import {
    discordUsers,
    events,
    IdentifyHandle,
    identities,
    IdentityRole,
    logger,
    sessions,
    twitchUsers
} from "@modbot/utils";

import auth from "./auth";

import discord from "./discord";
import identity from "./identity";
import twitch from "./twitch";
import statsManager from "@modbot/utils/dist/managers/StatsManager";

const PORT = process.env.API_PORT;

const app = express();

app.use(cookieParser());

export interface CachedSession {
    twitchUserIds: string[];
    discordUserIds: string[];
}

const cachedSessions = new Map<string, CachedSession>();

app.use(async (req, res, next) => {
    const sessionId = req?.cookies?.v3_session;

    req.flushCache = function() {
        if (!sessionId) return;
        cachedSessions.delete(sessionId);
    }

    if (sessionId) {
        const session = await sessions.get(sessionId);

        if (session && session.identityId) {
            req.session = session;
            if (cachedSessions.has(sessionId)) {
                const cachedSession = cachedSessions.get(sessionId);
                req.identity = await identities.get(session.identityId);
                req.users = {twitch: [], discord: []};
                for (const userId of cachedSession.twitchUserIds) {
                    req.users.twitch.push(await twitchUsers.get(userId));
                }
                for (const userId of cachedSession.discordUserIds) {
                    req.users.discord.push(await discordUsers.get(userId));
                }
            } else {
                const identity = await identities.get(session.identityId);
                req.identity = identity;
                const {twitchUsers, discordUsers} = await identities.getUsers(identity.id);
                cachedSessions.set(session.id, {
                    twitchUserIds: twitchUsers.map(x => x.id),
                    discordUserIds: discordUsers.map(x => x.id),
                });
                req.users = {
                    discord: discordUsers,
                    twitch: twitchUsers,
                };
            }
        }
    }

    next();
});

app.use("/auth", auth);

let services: IdentifyHandle[] = [];

app.get("/", (req, res) => {
    res.json({
        ok: true,
        services,
        stats: statsManager.getPublicStats(),
    });
});

app.use((req, res, next) => {
    if (!req.identity) {
        res.status(401).json({ok: false, error: "Unauthorized"});
        return;
    }

    if (req.identity.role === IdentityRole.NON_MEMBER) {
        res.status(403).json({ok: false, error: "Forbidden"});
        return;
    }

    next();
});

app.use("/discord", discord);
app.use("/identity", identity);
app.use("/twitch", twitch);

const updateServices = async () => {
    services = await events.requestAll("identify", events.servicePrefix);
}

setInterval(updateServices, 60000);
setTimeout(updateServices, 1000);

app.listen(PORT, () => {
    logger.info(`Express listening on port ${PORT}`);
});
