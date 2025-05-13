import type {RawDiscordUser, RawTwitchUser} from "@modbot/utils";
import {get} from ".";

export type UserSearchResult = {
    twitchUsers: RawTwitchUser[],
    discordUsers: RawDiscordUser[],
}

export async function userSearch(query: string): Promise<UserSearchResult> {
    return await get(`user-search?query=${query}`) as UserSearchResult;
}
