import sequelize from "./database";
import {DataTypes, InferAttributes, InferCreationAttributes, Model} from "sequelize";

export interface RawDiscordChannel {
    id: string;
    guildId: string;

    twitchBanSettings?: string|null;

    createdDate?: string;
    updatedDate?: string;
}

export class DiscordChannel extends Model<InferAttributes<DiscordChannel>, InferCreationAttributes<DiscordChannel>> implements RawDiscordChannel {
    declare id: string;
    declare guildId: string;

    declare twitchBanSettings?: string|null;

    declare createdAt?: Date;
    declare updatedAt?: Date;

    raw(): RawDiscordChannel {
        return {
            id: this.id,
            guildId: this.guildId,
            createdDate: this.createdAt ? this.createdAt.toISOString() : null,
            updatedDate: this.updatedAt ? this.updatedAt.toISOString() : null,
        };
    }
}

DiscordChannel.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    guildId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    twitchBanSettings: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    sequelize,
    tableName: "discord__guilds",
});
