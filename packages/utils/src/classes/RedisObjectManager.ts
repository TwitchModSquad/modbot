import Redis from "ioredis";

export default class RedisObjectManager<T> {
    protected redis = new Redis(process.env.REDIS_URL);
    protected memoryCache: Map<string, T> = new Map();
    protected expiryTable: {expiresAt: number, id: string}[] = [];

    protected readonly prefix: string;
    readonly expiresIn?: number;

    constructor(prefix: string, expiresIn?: number) {
        this.prefix = prefix;
        this.expiresIn = expiresIn;

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
    }

    async delete(id: string) {
        this.memoryCache.delete(id);
        await this.redis.del(this.getRedisKey(id));
    }
}
