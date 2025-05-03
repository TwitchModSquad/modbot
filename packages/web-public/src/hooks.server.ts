// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { API_URI } from '$env/static/private';
import type { PublicStats } from '@modbot/utils';

const POLL_TIME = 5 * 60 * 1000;

let publicStats: PublicStats = {
    discordMembers: 0,
    twitchBans: 0,
    twitchChats: 0,
    twitchTimeouts: 0,
    channels: 0,
};

const update = async () => {
    try {
        const response = await fetch(API_URI);
        publicStats = (await response.json()).stats;
    } catch (err) {
        console.error('Failed to update publicStats:', err);
    }
};

update().catch(e => console.error(e)); // run on server start
setInterval(update, POLL_TIME); // poll every 5 minutes

export const handle: Handle = async ({ event, resolve }) => {
    event.locals.publicStats = publicStats;
    return resolve(event);
};
