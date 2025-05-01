import {DiscordUser, logger, RawDiscordUser, CacheManager} from "../../index";

async function getUser(userId: string): Promise<RawDiscordUser> {
    const response = await fetch(`https://discord.com/api/v10/users/${userId}`, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_MODBOT_TOKEN}`,
        }
    });

    if (!response.ok) {
        logger.debug(response.statusText);
        return null;
    }

    const data = await response.json();

    const [discordUser] = await DiscordUser.upsert({
        id: data.id,
        username: data.username,
        discriminator: data.discriminator,
        globalName: data.globalName,
        avatar: data.avatar,
    });

    return discordUser.raw();
}

class DiscordUserManager extends CacheManager<RawDiscordUser> {
    private usernameCache: Map<string, string> = new Map();

    constructor() {
        super({
            model: DiscordUser,
            cachePrefix: "discord:user",
            cacheTTL: 3600,
            retrieveFunction: async (id: string|number): Promise<RawDiscordUser> => getUser(String(id)),
        });
    }

    async set(item: RawDiscordUser): Promise<void> {
        await super.set(item);
        this.usernameCache.set(item.username.toLowerCase(), item.id);
    }

    async getByName(username: string): Promise<RawDiscordUser> {
        username = username.toLowerCase();
        if (this.usernameCache.has(username)) {
            const id = this.usernameCache.get(username);
            return this.get(id);
        }

        const dbUser = await DiscordUser.findOne({
            where: {
                username,
            },
        });
        if (dbUser) {
            const raw = dbUser.raw();
            this.set(raw).catch(e => logger.error(e));
            return raw;
        }

        return null;
    }
}

export default new DiscordUserManager();
