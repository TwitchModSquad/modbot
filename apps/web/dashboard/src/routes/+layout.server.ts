import type { LayoutServerLoad } from './$types';
import { PUBLIC_API_URI, PUBLIC_WEB_URI } from "$env/static/public";
import type {RawDiscordUser, RawIdentity, RawTwitchRole, RawTwitchUser} from "@modbot/utils";
import {redirect} from "@sveltejs/kit";

export const load: LayoutServerLoad = async ({ fetch, cookies, url }) => {
    console.log(cookies.getAll());
    const sessionCookie = cookies.getAll().find(x => x.name === 'v3_session');
    console.log(sessionCookie);
    if (!sessionCookie) {
        throw redirect(303, `${PUBLIC_API_URI}auth/twitch`);
    }

    const sessionId = sessionCookie.value;

    const res = await fetch(`${PUBLIC_API_URI}identity/me`, {
        headers: {
            authorization: sessionId,
        },
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
        throw redirect(303, `${PUBLIC_API_URI}auth/twitch`);
    }

    if (url.pathname !== "/manage/streamers") {
        for (const user of twitchUsers) {
            const roleRes = await fetch(`${PUBLIC_API_URI}twitch/user/${user.id}/streamers`, {
                headers: {
                    authorization: sessionId,
                },
            });

            if (res.ok) {
                const data = await roleRes.json() as { ok: boolean, error?: string, data: { roles: RawTwitchRole[] }};
                if (data.ok) {
                    for (const role of data.data.roles) {
                        if (!role.confirmed) {
                            throw redirect(303, `/manage/streamers`);
                        }
                    }
                } else {
                    console.error(`Failed to get roles: ${data.error}`);
                }
            }
        }
    }

    return {
        apiUri: PUBLIC_API_URI, webUri: PUBLIC_WEB_URI,
        identity,
        twitchUsers,
        discordUsers,
    };
};
