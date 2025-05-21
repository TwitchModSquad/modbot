import {CacheManager} from "../classes";
import {DiscordUser, Identity, RawDiscordUser, RawIdentity, RawTwitchUser, TwitchUser} from "../";

class IdentityManager extends CacheManager<RawIdentity> {
    constructor() {
        super({
            model: Identity,
            cachePrefix: "identity",
            cacheTTL: 3600,
        });
    }

    async getUsers(identityId: number): Promise<{twitchUsers: RawTwitchUser[], discordUsers: RawDiscordUser[]}> {
        return {
            twitchUsers: await this.getTwitchUsers(identityId),
            discordUsers: await this.getDiscordUsers(identityId),
        }
    }

    async getTwitchUsers(identityId: number): Promise<RawTwitchUser[]> {
        const users = await TwitchUser.findAll({
            where: {
                identity: identityId,
            }
        });

        return users.map(x => x.raw());
    }

    async getDiscordUsers(identityId: number): Promise<RawDiscordUser[]> {
        const users = await DiscordUser.findAll({
            where: {
                identity: identityId,
            }
        });

        return users.map(x => x.raw());
    }
}

export default new IdentityManager();
