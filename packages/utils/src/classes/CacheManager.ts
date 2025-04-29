import logger from "../logger";
import redis from "../redis";
import {UpdateOptions} from "sequelize";
import eventManager from "../managers/events/EventManager";

type SequelizeModel<T> = {
    raw(): T;
};

type ModelType<T> = {
    findByPk(id: number|string): Promise<SequelizeModel<T>|null>;
    update(data: Partial<T>, options: UpdateOptions): Promise<[affectedCount: number, affectedRows: SequelizeModel<T>[]]>;
};

interface CacheManagerOptions<T> {
    model: ModelType<T>;
    cachePrefix: string;
    cacheTTL: number;
    retrieveFunction?: (id: string|number) => Promise<T>;
}

interface CacheDeleteOptions {
    id: string|number;
    servicePrefix: string;
}

interface CacheSetOptions<T> {
    object: T;
    servicePrefix: string;
}

/**
 * A generic Cache Manager class for managing in-memory cache, Redis cache, and fallback to a database or
 * optional retrieval function for retrieving, storing, updating, and deleting cached data.
 * This class supports cache invalidation and synchronization across multiple service instances using Redis.
 *
 * @template T - The type of the object to be cached, extending the base type with `id` and optional `cachedDate` properties.
 */
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

        eventManager.register(this.cachePrefix + ":del", async (data: CacheDeleteOptions) => {
            // Ignore requests from our own service
            if (data.servicePrefix === eventManager.servicePrefix) return;

            logger.debug(`Deleting cache for ${data.id} due to Redis`);
            // We can trust the other client already deleted the cache in Redis, so we just delete it from memory
            this.memoryCache.delete(data.id);
        });

        eventManager.register(this.cachePrefix + ":set", async (data: CacheSetOptions<T>) => {
            // Ignore requests from our own service
            if (data.servicePrefix === eventManager.servicePrefix) return;

            logger.debug(`Setting cache for ${data.object.id} due to Redis`);
            this.memoryCache.set(data.object.id, data.object);
            await this.redis.set(this.getRedisKey(data.object.id), JSON.stringify(data.object), "EX", this.cacheTTL);
        });
    }

    protected getRedisKey(id: number|string): string {
        return `${this.cachePrefix}:${id}`;
    }

    /**
     * Updates a resource with the provided data for the specified ID.
     *
     * @param {string|number} id - The ID of the resource to update.
     * @param {Partial<T>} data - An object containing the data to be updated.
     * @return {Promise<void>} A promise that resolves when the update operation is complete.
     */
    public async update(id: string|number, data: Partial<T>): Promise<T> {
        await this.model.update(data, {
            where: { id },
        });

        const newModel = await this.get(id);
        await this.set(newModel);
        return newModel;
    }

    /**
     * Retrieves data from memory cache, Redis, database, or an optional retrieval function.
     * Performs a cache-first lookup, using memory cache before resorting to Redis or database.
     * If retrieve is true and a retrieval function is provided, attempts to fetch the data through it as a final fallback.
     *
     * @param {string|number} id - The unique identifier of the data to be retrieved.
     * @param {boolean} [retrieve=false] - Indicates whether to use the optional retrieval
     * @return {Promise<T | null>} - A promise of the resolve object or null
     */
    public async get(id: string|number, retrieve: boolean = false): Promise<T | null> {
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

    /**
     * Stores the given item in both in-memory cache and Redis cache.
     *
     * @param {T} item - The item to be stored. Must include an `id` property.
     * @return {Promise<void>} A promise that resolves once the item has been stored in both caches.
     */
    public async set(item: T): Promise<void> {
        this.memoryCache.set(item.id, item);
        await this.redis.set(this.getRedisKey(item.id), JSON.stringify(item), "EX", this.cacheTTL);
        await eventManager.publish(this.cachePrefix + ":set", {
            object: item,
            servicePrefix: eventManager.servicePrefix,
        });
    }

    /**
     * Deletes an item from the memory cache and Redis cache by its ID. Optionally publishes an event upon deletion.
     *
     * @param {number|string} id The unique identifier of the item to be deleted.
     * @return {Promise<void>} A promise that resolves when the deletion process is complete.
     */
    public async delete(id: number|string): Promise<void> {
        this.memoryCache.delete(id);
        await this.redis.del(this.getRedisKey(id));
        await eventManager.publish(this.cachePrefix + ":del", {
            id,
            servicePrefix: eventManager.servicePrefix,
        });
    }
}
