import {RawTwitchChat} from "../../";
import Redis from "ioredis";
import redis from "../../redis";

const CHAT_TTL = 24 * 60 * 60;

class TwitchChatCacheManager {

    private redis: Redis;
    private prefix = "twitch:chat";

    constructor() {
        this.redis = redis;
    }

    private getKey(streamerId: string, chatterId: string): string {
        return `${this.prefix}:${streamerId}:${chatterId}`;
    }

    public async addChatMessage(message: RawTwitchChat): Promise<void> {
        const key = this.getKey(message.streamerId, message.chatterId);

        await this.redis.lpush(key, JSON.stringify(message));
        await this.redis.ltrim(key, 0, 9);
        await this.redis.expire(key, CHAT_TTL);
    }

    public async getChatMessages(streamerId: string, chatterId: string): Promise<RawTwitchChat[]> {
        const key = this.getKey(streamerId, chatterId);

        return (await this.redis.lrange(key, 0, -1))
            .map(x => JSON.parse(x) as RawTwitchChat);
    }

}

export default new TwitchChatCacheManager();
