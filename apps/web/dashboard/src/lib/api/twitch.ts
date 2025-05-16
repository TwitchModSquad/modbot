import type {RawTwitchBan, RawTwitchChat, RawTwitchRole, RawTwitchTimeout, RawTwitchUser} from "@modbot/utils";
import {get, patch} from ".";

type CondensedUsers = {
    users: {
        [id: string]: RawTwitchUser,
    }
};

export type ChatHistoryResult = {
    twitchChats: RawTwitchChat[],
} & CondensedUsers;

export type PunishmentResult<T> = {
    punishments: T[],
} & CondensedUsers;

export type RoleResult = {
    roles: RawTwitchRole[],
} & CondensedUsers;

export async function getTwitchUser(id: string): Promise<RawTwitchUser> {
    return await get(`twitch/user/${id}`) as RawTwitchUser;
}

export async function getTwitchUsers(ids: string[]): Promise<{[id: string]: RawTwitchUser}> {
    return await get(`twitch/users?${ids.map(x => `user_id=${encodeURIComponent(x)}`).join("&")}`) as {
        [id: string]: RawTwitchUser,
    };
}

function parseStreamerChatterQuery(streamerIds: string[], chatterIds: string[], cursor: string|null, limit: number) {
    const streamerQuery = streamerIds
        .map(id => `streamer_id=${encodeURIComponent(id)}`)
        .join("&");
    const chatterQuery = chatterIds
        .map(id => `chatter_id=${encodeURIComponent(id)}`)
        .join("&");

    let query = streamerQuery;

    if (chatterQuery !== "") {
        query += `${query === "" ? "" : "&"}${chatterQuery}`;
    }

    if (cursor && cursor !== "") {
        query += `${query === "" ? "" : "&"}cursor=${encodeURIComponent(cursor)}`;
    }

    if (limit && limit !== 100) {
        query += `${query === "" ? "" : "&"}limit=${encodeURIComponent(limit)}`;
    }

    return query;
}

export async function getChatHistory(streamerIds: string[] = [], chatterIds: string[] = [], cursor: string = "", limit: number = 100): Promise<ChatHistoryResult> {
    const query = parseStreamerChatterQuery(streamerIds, chatterIds, cursor, limit);
    return await get(`twitch/chat-history${query === "" ? "" : "?" + query}`) as ChatHistoryResult;
}

async function getPunishments<T>(type: "ban"|"timeout", streamerIds: string[] = [], chatterIds: string[] = [], cursor: string = "", limit: number = 100): Promise<PunishmentResult<T>> {
    const query = parseStreamerChatterQuery(streamerIds, chatterIds, cursor, limit);
    return await get(`twitch/${type}${query === "" ? "" : "?" + query}`) as PunishmentResult<T>;
}

export async function getTwitchBans(streamerIds: string[] = [], chatterIds: string[] = [], cursor: string = "", limit: number = 100): Promise<PunishmentResult<RawTwitchBan>> {
    return await getPunishments("ban", streamerIds, chatterIds, cursor, limit);
}

export async function getTwitchTimeouts(streamerIds: string[] = [], chatterIds: string[] = [], cursor: string = "", limit: number = 100): Promise<PunishmentResult<RawTwitchTimeout>> {
    return await getPunishments("timeout", streamerIds, chatterIds, cursor, limit);
}

async function getRole(type: "streamers"|"moderators", userId: string): Promise<RoleResult> {
    return await get(`twitch/user/${userId}/${type}`) as RoleResult;
}

export async function getStreamers(userId: string): Promise<RoleResult> {
    return await getRole("streamers", userId);
}

// async function getModerators(userId: string): Promise<RoleResult> {
//     return await getRole("moderators", userId);
// }

export async function patchListenSettings(body: Map<string, string>): Promise<number> {
    return await patch("twitch/streamer-settings", Object.fromEntries(body)) as number;
}
