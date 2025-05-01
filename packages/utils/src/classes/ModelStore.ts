import {FindOptions, Model, UpdateOptions} from "sequelize";
import logger from "../logger";
import eventManager from "../managers/events/EventManager";

type SequelizeModel<T> = Model & {
    raw(): T;
};

type ModelType<T> = {
    findByPk(id: number|string): Promise<SequelizeModel<T>|null>;
    findAll(options?: FindOptions<T>): Promise<SequelizeModel<T>[]>;
    update(data: Partial<T>, options: UpdateOptions): Promise<[affectedCount: number, affectedRows: SequelizeModel<T>[]]>;
};

interface CacheDeleteOptions {
    id: string|number;
    servicePrefix: string;
}

interface CacheSetOptions<T> {
    object: T;
    servicePrefix: string;
}

/**
 * A model store intended to retrieve all Models on startup and maintain an up-to-date record of those models.
 * @template T - The type of the object to be stored.
 */
export class ModelStore<T extends {id: string|number}> {
    protected store: Map<string|number, T> = new Map<string|number, T>();

    protected readonly model: ModelType<T>;
    protected readonly redisPrefix: string;

    /**
     * Updates all entries in the store with the latest data from the models.
     *
     * Fetches all models from the data source, clears the current store, and
     * populates the store with updated data for each model.
     *
     * @return {Promise<void>} A promise that resolves when the store has been updated.
     */
    private async updateAll(): Promise<void> {
        logger.info(`Updating models in ModelStore ${this.redisPrefix}`);
        const allModels = await this.model.findAll();
        this.store.clear();
        for (const model of allModels) {
            const rawModel = model.raw();
            this.store.set(rawModel.id, rawModel);
        }
        logger.info(`Loaded ${this.store.size} ${this.redisPrefix} models!`);
    }

    constructor(model: ModelType<T>, redisPrefix: string) {
        this.model = model;
        this.redisPrefix = redisPrefix;

        this.updateAll().catch(e => logger.error(e));

        eventManager.register(this.redisPrefix + ":del", async (data: CacheDeleteOptions) => {
            // Ignore requests from our own service
            if (data.servicePrefix === eventManager.servicePrefix) return;

            logger.debug(`Deleting ${data.id} due to Redis`);
            // We can trust the other client already deleted the cache in Redis, so we just delete it from memory
            this.store.delete(data.id);
        });

        eventManager.register(this.redisPrefix + ":set", async (data: CacheSetOptions<T>) => {
            // Ignore requests from our own service
            if (data.servicePrefix === eventManager.servicePrefix) return;

            logger.debug(`Setting ${data.object.id} due to Redis`);
            this.store.set(data.object.id, data.object);
        });
    }

    public get(id: string|number): T|null {
        return this.store.get(id);
    }

    public getAll(): T[] {
        return [...this.store.values()];
    }

    public async update(id: string|number, data: Partial<T>): Promise<T> {
        await this.model.update(data, {
            where: { id },
        });

        const newModel = await this.model.findByPk(id);
        if (!newModel) {
            return null;
        }
        await this.set(newModel.raw());
        return newModel.raw();
    }

    public async delete(id: string|number): Promise<void> {
        this.store.delete(id);
        await eventManager.publish(this.redisPrefix + ":del", {
            id,
            servicePrefix: eventManager.servicePrefix,
        })
    }

    public async set(data: T): Promise<void> {
        this.store.set(data.id, data);
        await eventManager.publish(this.redisPrefix + ":set", {
            object: data,
            servicePrefix: eventManager.servicePrefix,
        });
    }

}
