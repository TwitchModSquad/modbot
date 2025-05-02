// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { API_URI } from '$env/static/private';
import type { PublicStats } from '@modbot/utils';

let publicStats: PublicStats;

const update = async () => {
    try {
        const response = await fetch(API_URI);
        publicStats = (await response.json()).stats;
    } catch (err) {
        console.error('Failed to update publicStats:', err);
    }
};

update().catch(e => console.error(e)); // run on server start
setInterval(update, 120_000); // poll every 2 minutes

export const handle: Handle = async ({ event, resolve }) => {
    event.locals.publicStats = publicStats;
    return resolve(event);
};
