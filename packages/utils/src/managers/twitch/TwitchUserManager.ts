import CacheManager from "../../classes/CacheManager";

import {RawTwitchUser, TwitchUser, TwitchUserBroadcasterType, TwitchUserType} from "../../models";
import {HelixUser} from "@twurple/api";
import {getTwitchClient, logger} from "../../index";

const helixToRawUser = (user: HelixUser): RawTwitchUser => {
    return {
        id: user.id,
        login: user.name,
        display_name: user.displayName,
        description: user.description,
        profile_image_url: user.profilePictureUrl,
        offline_image_url: user.offlinePlaceholderUrl,
        type: user.type as TwitchUserType,
        broadcaster_type: user.broadcasterType as TwitchUserBroadcasterType,
    };
}

const getUser = (search: string|number, withFunc: "getUserByIdBatched"|"getUserByNameBatched"): Promise<RawTwitchUser> => {
    return new Promise(resolve => {
        getTwitchClient().users[withFunc](String(search)).then(user => {
            if (!user) {
                return resolve(null);
            }
            const data: RawTwitchUser = helixToRawUser(user);

            TwitchUser.upsert(data).then(apiUser => {
                resolve(apiUser[0].raw());
            }, e => {
                logger.debug(e);
                resolve(null);
            });
        }, e => {
            logger.debug(e);
            resolve(null);
        })
    });
}

class TwitchUserManager extends CacheManager<RawTwitchUser> {
    private usernameCache: Map<string, string> = new Map();

    constructor() {
        super({
            model: TwitchUser,
            cachePrefix: "twitch:user",
            cacheTTL: 3600,
            retrieveFunction: async (id: string|number): Promise<RawTwitchUser> => getUser(id, "getUserByIdBatched"),
        });
    }

    async set(item: RawTwitchUser): Promise<void> {
        await super.set(item);
        this.usernameCache.set(item.login.toLowerCase(), item.id);
    }

    async getByName(username: string, retrieve: boolean = false): Promise<RawTwitchUser> {
        username = username.toLowerCase();
        if (this.usernameCache.has(username)) {
            const id = this.usernameCache.get(username);
            return this.get(id, retrieve);
        }
        const dbUser = await TwitchUser.findOne({
            where: {
                login: username,
            },
        });
        if (dbUser) {
            const raw = dbUser.raw();
            this.set(raw).catch(e => logger.error(e));
            return raw;
        }
        if (retrieve) {
            return getUser(username, "getUserByNameBatched");
        } else {
            return null;
        }
    }
}

export default new TwitchUserManager();
