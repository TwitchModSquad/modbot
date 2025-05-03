import eventManager from "./events/EventManager";
import {PublicStats} from "../interfaces";
import {ServiceType} from "../enums";
import {logger} from "../index";

class StatsManager {
    private publicStats: PublicStats = {
        discordMembers: 0,
        channels: 0,
        modSquadMembers: 0,
        twitchBans: 0,
        twitchChats: 0,
        twitchTimeouts: 0,
    };

    private async requestPublicStats(): Promise<void> {
        const results = await eventManager.requestAll(
            "stats:request",
            eventManager.servicePrefix
        );

        for (const result of results) {
            this.publicStats = {
                ...this.publicStats,
                ...result,
            };
        }

        logger.debug(`Public stats: ${JSON.stringify(this.publicStats)}`);
    }

    public register(service: ServiceType): void {
        if (service === ServiceType.API) {
            setInterval(() => this.requestPublicStats(), 120_000);
            setTimeout(() => this.requestPublicStats(), 2000);
        }
    }

    public getPublicStats(): PublicStats {
        return this.publicStats;
    }

}

export default new StatsManager();
