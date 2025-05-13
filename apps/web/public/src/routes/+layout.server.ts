import type {LayoutServerLoad} from './$types';
import type {PublicStats} from "@modbot/utils";
import {PUBLIC_API_URI} from "$env/static/public";

export const load: LayoutServerLoad = async ({locals}) => {
    return {
        publicStats: locals.publicStats as PublicStats,
        apiUri: PUBLIC_API_URI,
    };
}
