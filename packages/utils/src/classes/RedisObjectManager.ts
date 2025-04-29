import redis from "../redis";
import eventManager from "../managers/events/EventManager";

/**
 * A generic class to manage objects with Redis as the primary storage and an in-memory cache for optimization.
 *
 * @template T - The type of objects being managed.
 */
export default class RedisObjectManager<T> {
    protected redis;
    protected memoryCache: Map<string, T> = new Map();
    protected expiryTable: {expiresAt: number, id: string}[] = [];

    protected readonly prefix: string;
    readonly expiresIn?: number;

    constructor(prefix: string, expiresIn?: number) {
        this.prefix = prefix;
        this.expiresIn = expiresIn;

        this.redis = redis;

        if (this.expiresIn) {
            setInterval(() => {
                const idsForRemoval: string[] = this.expiryTable
                    .filter(e => e.expiresAt < Date.now())
                    .map(e => e.id);

                idsForRemoval.forEach(id => this.memoryCache.delete(id));
                this.expiryTable = this.expiryTable.filter(e => e.expiresAt > Date.now());
            }, 2500);
        }
    }

    protected getRedisKey(id: string): string {
        return `${this.prefix}:${id}`;
    }

    async get(id: string): Promise<T|null> {
        if (this.memoryCache.has(id)) {
            return this.memoryCache.get(id);
        }

        const redisData = await this.redis.get(this.getRedisKey(id));
        if (redisData) {
            const data: T = JSON.parse(redisData);
            if (this.expiresIn) {
                const ttl = await this.redis.ttl(this.getRedisKey(id));
                if (ttl > 0) {
                    this.expiryTable.push({
                        expiresAt: Date.now() + (ttl * 1000), id,
                    });
                }
            }
            this.memoryCache.set(id, data);
            return data;
        }

        return null;
    }

    async getMany(ids: string[]): Promise<T[]> {
        const result: T[] = [];
        const idsToQuery: string[] = [];

        ids.forEach(id => {
            if (this.memoryCache.has(id)) {
                result.push(this.memoryCache.get(id));
            } else {
                idsToQuery.push(id);
            }
        });

        for (const id of idsToQuery) {
            const data = await this.get(id);
            if (data) {
                result.push(data);
            }
        }

        return result;
    }

    async set(id: string, object: T) {
        this.memoryCache.set(id, object);
        if (this.expiresIn) {
            this.expiryTable.push({
                expiresAt: Date.now() + (this.expiresIn * 1000), id,
            });
            await this.redis.set(this.getRedisKey(id), JSON.stringify(object), "EX", this.expiresIn);
        } else {
            await this.redis.set(this.getRedisKey(id), JSON.stringify(object));
        }
        await eventManager.publish(`${this.prefix}:set`, {
            object, servicePrefix: eventManager.servicePrefix,
        })
    }

    async delete(id: string) {
        this.memoryCache.delete(id);
        await this.redis.del(this.getRedisKey(id));
        await eventManager.publish(`${this.prefix}:del`, {
            id, servicePrefix: eventManager.servicePrefix,
        });
    }
}
