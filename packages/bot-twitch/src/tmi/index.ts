import ListenClient, {ListenClientType} from "../classes/ListenClient";
import {events, logger, RawTwitchUser, TwitchRole, twitchTokens, TwitchUser} from "@modbot/utils";

export let listenClients = new Map<string, ListenClient>();

export const defaultClient = new ListenClient(process.env.TWITCH_USER_ID, [], ListenClientType.LIMITED);
listenClients.set("tms", defaultClient);

export const moddedClient = new ListenClient(process.env.TWITCH_USER_ID, [], ListenClientType.MODERATOR);
listenClients.set("mod", moddedClient);

export const joinChannel = async (channel: RawTwitchUser, roles: TwitchRole[] = null, connect: boolean = false) => {
    if (!roles) {
        roles = await TwitchRole.findAll({
            where: {
                streamerId: channel.id,
            }
        });
    }

    const streamerToken = await twitchTokens.get(channel.id);

    if (streamerToken) {
        let listenClient = listenClients.get(channel.id);
        if (listenClient) {
            await listenClient.join(channel.login);
        } else {
            listenClient = new ListenClient(channel.id, [channel.login]);
            listenClients.set(channel.id, listenClient);
        }
        if (connect) await listenClient.connect();
        return listenClient;
    }

    const moderatorRoles = roles.filter(x => x.streamerId === channel.id);

    if (moderatorRoles.find(x => x.userId === process.env.TWITCH_USER_ID)) {
        await moddedClient.join(channel.login);
        return moddedClient;
    }

    for (const role of moderatorRoles) {
        let listenClient = listenClients.get(role.userId);
        if (listenClient) {
            await listenClient.join(channel.login);
            if (connect) await listenClient.connect();
            return listenClient;
        }
    }

    if (moderatorRoles.length > 0) {
        let listenClient = new ListenClient(moderatorRoles[0].userId, [channel.login]);
        if (connect) await listenClient.connect();
        return listenClient;
    }

    await defaultClient.join(channel.login);
    return defaultClient;
}

export const partChannel = (channel: RawTwitchUser) => {
    for (const [,client] of listenClients) {
        client.part(channel.login);
    }
}

events.register("twitch:join", async (channel: RawTwitchUser) => {
    logger.info(`Joining twitch channel ${channel.display_name}`);
    await joinChannel(channel);
});

events.register("twitch:part", (channel: RawTwitchUser) => {
    logger.info(`Parting twitch channel ${channel.display_name}`);
    partChannel(channel);
});

export default async (members: TwitchUser[]) => {
    const twitchRoles = await TwitchRole.findAll();

    for (const member of members) {
        const listenClient = await joinChannel(member, twitchRoles);
        logger.debug(`${member.login} attached to ${listenClient.type}:${listenClient.intent}`);
    }

    setTimeout(async () => {
        for (const [, client] of listenClients) {
            await client.connect();
        }
    }, 1000);
}
