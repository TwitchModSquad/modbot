import type {RawTwitchChat, RawTwitchUser} from "@modbot/utils";
import { get } from ".";

export type ChatHistoryResult = {
    twitchChats: RawTwitchChat[],
    users: {
        [id: string]: RawTwitchUser,
    }
}

export async function getTwitchUser(id: string): Promise<RawTwitchUser> {
    return await get(`twitch/user/${id}`) as RawTwitchUser;
}

export async function getTwitchUsers(ids: string[]): Promise<{[id: string]: RawTwitchUser}> {
    return await get(`twitch/users?${ids.map(x => `user_id=${encodeURIComponent(x)}`).join("&")}`) as {
        [id: string]: RawTwitchUser,
    };
}

export async function getChatHistory(streamerIds: string[] = [], chatterIds: string[] = [], cursor: string = "", limit: number = 100): Promise<ChatHistoryResult> {
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

    if (cursor !== "") {
        query += `${query === "" ? "" : "&"}cursor=${encodeURIComponent(cursor)}`;
    }

    if (limit && limit !== 100) {
        query += `${query === "" ? "" : "&"}limit=${encodeURIComponent(limit)}`;
    }

    return await get(`twitch/chat-history${query === "" ? "" : "?" + query}`) as ChatHistoryResult;
}
