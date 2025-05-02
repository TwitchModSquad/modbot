import type {PageServerLoad} from "./$types";
import type {PublicStats} from "@modbot/utils";

export const load: PageServerLoad = async ({ locals }) => {
    return {
        publicStats: locals.publicStats as PublicStats,
    };
}
