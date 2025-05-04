import type { LayoutServerLoad } from './$types';
import { API_URI } from "$env/static/private";
import type {RawDiscordUser, RawIdentity, RawTwitchUser} from "@modbot/utils";
import {redirect} from "@sveltejs/kit";

export const load: LayoutServerLoad = async ({ fetch, cookies }) => {
    const res = await fetch(`${API_URI}identity/me`, {
        headers: {
            Cookie: cookies.getAll().map(c => `${c.name}=${c.value}`).join('; ')
        }
    });

    let identity = null;
    let twitchUsers = null;
    let discordUsers = null;
    if (res.ok) {
        const data = await res.json();
        identity = data.data.identity as RawIdentity;
        twitchUsers = data.data.users.twitch as RawTwitchUser[];
        discordUsers = data.data.users.discord as RawDiscordUser[];
    }

    if (!identity || !twitchUsers || !discordUsers) {
        throw redirect(303, `${API_URI}auth/twitch`);
    }

    return {
        identity,
        twitchUsers,
        discordUsers,
    };
};
