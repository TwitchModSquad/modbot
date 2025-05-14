import {get} from ".";
import type {RawDiscordUser} from "@modbot/utils";

export async function getDiscordUser(id: string): Promise<RawDiscordUser> {
    return await get(`discord/user/${id}`) as RawDiscordUser;
}
