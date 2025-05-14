import {get} from "$lib/api/index";
import type {RawDiscordUser, RawIdentity, RawTwitchUser} from "@modbot/utils";

export type IdentityResult = {
    identity: RawIdentity,
    users: {
        twitch: RawTwitchUser[],
        discord: RawDiscordUser[],
    },
}

export async function getIdentity(id: number): Promise<IdentityResult> {
    return await get("identity/" + id) as IdentityResult;
}
