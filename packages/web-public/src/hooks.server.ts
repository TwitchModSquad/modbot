// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { API_URI } from '$env/static/private';
import type { PublicStats } from '@modbot/utils';

const POLL_TIME = 5 * 60 * 1000;

let publicStats: PublicStats = {
    channels: 0,
    discordMembers: 0,
    modSquadMembers: 0,
    twitchBans: 0,
    twitchChats: 0,
    twitchTimeouts: 0,
    members: [],
};

const update = async () => {
    try {
        const response = await fetch(API_URI);
        publicStats = (await response.json()).stats;
    } catch (err) {
        console.error('Failed to update publicStats:', err);
    }
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

setTimeout(async () => {
    while (publicStats.modSquadMembers === 0 || publicStats.discordMembers === 0) {
        await update();
        await sleep(1000);
    }
}, 3000);

setInterval(update, POLL_TIME); // poll every 5 minutes

export const handle: Handle = async ({ event, resolve }) => {
    event.locals.publicStats = publicStats;
    return resolve(event);
};
