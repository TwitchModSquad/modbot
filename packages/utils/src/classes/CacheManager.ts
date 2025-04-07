import logger from "../logger";
import redis from "../redis";

type ModelType<T> = {
    findByPk(id: number|string): Promise<{raw: () => T}|null>;
};

interface CacheManagerOptions<T> {
    model: ModelType<T>;
    cachePrefix: string;
    cacheTTL: number;
    retrieveFunction?: (id: string|number) => Promise<T>;
}

export default class CacheManager<T extends {id: number|string, cachedDate?: string}> {
    protected redis;

    protected readonly model: ModelType<T>;
    protected readonly cachePrefix: string;
    protected readonly retrieveFunction?: (id: string|number) => Promise<T|null>;
    protected readonly cacheTTL: number;

    protected memoryCache: Map<string|number, T> = new Map();

    constructor(options: CacheManagerOptions<T>) {
        this.model = options.model;
        this.cachePrefix = options.cachePrefix;
        this.cacheTTL = options.cacheTTL;
        this.retrieveFunction = options.retrieveFunction;

        this.redis = redis;
    }

    protected getRedisKey(id: number|string): string {
        return `${this.cachePrefix}:${id}`;
    }

    async updateFromDB(id: string|number): Promise<T | null> {
        const retrievedObject = await this.model.findByPk(id);
        if (retrievedObject) {
            const object = retrievedObject.raw();
            await this.set(object);
            return object;
        }
        return null;
    }

    async get(id: string|number, retrieve: boolean = false): Promise<T | null> {
        const start = Date.now();

        if (this.memoryCache.has(id)) {
            logger.debug(`Memory cache hit for ${this.getRedisKey(id)} (${Date.now() - start} ms)`);
            return this.memoryCache.get(id);
        }

        const redisData = await this.redis.get(this.getRedisKey(id));
        if (redisData) {
            logger.debug(`Redis cache hit for ${this.getRedisKey(id)} (${Date.now() - start} ms)`);
            const data: T = JSON.parse(redisData);
            this.memoryCache.set(id, data);
            return data;
        }

        const dbData = await this.model.findByPk(id);
        if (dbData) {
            logger.debug(`Database hit for ${this.getRedisKey(id)} (${Date.now() - start} ms)`);
            const data: T = dbData.raw();
            data.cachedDate = new Date().toISOString();
            await this.redis.set(this.getRedisKey(id), JSON.stringify(data), "EX", this.cacheTTL);
            this.memoryCache.set(id, data);
            return data;
        }

        if (retrieve && this.retrieveFunction) {
            const data = await this.retrieveFunction(id);
            if (data) {
                logger.debug(`Retrieve hit for ${this.getRedisKey(id)} (${Date.now() - start} ms)`);
                data.cachedDate = new Date().toISOString();
                await this.redis.set(this.getRedisKey(id), JSON.stringify(data), "EX", this.cacheTTL);
                this.memoryCache.set(id, data);
                return data;
            }
        }

        return null;
    }

    async set(item: T): Promise<void> {
        this.memoryCache.set(item.id, item);
        await this.redis.set(this.getRedisKey(item.id), JSON.stringify(item), "EX", this.cacheTTL);
    }

    async delete(id: number|string) {
        this.memoryCache.delete(id);
        await this.redis.del(this.getRedisKey(id));
    }
}
