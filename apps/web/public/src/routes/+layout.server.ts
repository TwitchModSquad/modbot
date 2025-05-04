import type {LayoutServerLoad} from './$types';
import type {PublicStats} from "@modbot/utils";

export const load: LayoutServerLoad = async ({locals}) => {
    return {
        publicStats: locals.publicStats as PublicStats,
    };
}
