import {logger, PunishmentFields} from "@modbot/utils";
import {Model, ModelStatic, Op} from "sequelize";

export default class PunishmentStore<T extends PunishmentFields, M extends Model<T, Partial<T>> & T> {
    private model: ModelStatic<M> = null;

    private cache: Map<number, M> = new Map();

    private async updateAll() {
        logger.debug(`Loading punishments from ${this.model.tableName}`);
        const punishments = await this.model.findAll({
            where: {
                [Op.or]: [
                    { endTime: null },
                ]
            }
        });
        for (const punishment of punishments) {
            this.cache.set(punishment.id, punishment);
        }
        logger.info(`Loaded ${punishments.length} punishments from ${this.model.tableName}`);
    }

    constructor(model: ModelStatic<M>) {
        this.model = model;

        setTimeout(() => this.updateAll(), 3000);
    }

    public getAll(): M[] {
        return [...this.cache.values()];
    }

    public getById(id: number): M {
        return this.cache.get(id);
    }

    public getFromStream(streamerId: string, chatterId: string): M[] {
        return this.getAll().filter(
            x => x.streamerId === streamerId && x.chatterId === chatterId
        );
    }

    public add(punishment: M): void {
        this.cache.set(punishment.id, punishment);
    }
}
