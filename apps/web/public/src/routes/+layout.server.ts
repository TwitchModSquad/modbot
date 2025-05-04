import type {LayoutServerLoad} from './$types';
import type {PublicStats} from "@modbot/utils";
import {API_URI} from "$env/static/private";

export const load: LayoutServerLoad = async ({locals}) => {
    return {
        publicStats: locals.publicStats as PublicStats,
        apiUri: API_URI,
    };
}
