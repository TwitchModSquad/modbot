import sequelize from "../database";
import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from "sequelize";

export interface RawTwitchTimeout {
    id: number;
    streamerId: string;
    chatterId: string;
    moderatorId?: string|null;
    reason?: string|null;

    duration: number;

    startDate?: string;
    endDate?: string;
}

export class TwitchTimeout extends Model<InferAttributes<TwitchTimeout>, InferCreationAttributes<TwitchTimeout>> implements RawTwitchTimeout {
    declare id: CreationOptional<number>;
    declare streamerId: string;
    declare chatterId: string;
    declare moderatorId?: string|null;
    declare reason?: string|null;

    declare duration: number;

    declare startTime?: Date;
    declare endTime?: Date|null;

    raw(): RawTwitchTimeout {
        return {
            id: this.id,
            streamerId: this.streamerId,
            chatterId: this.chatterId,
            moderatorId: this.moderatorId,
            reason: this.reason,
            duration: this.duration,
            startDate: this.startTime ? this.startTime.toISOString() : null,
            endDate: this.endTime ? this.endTime.toISOString() : null,
        };
    }
}

TwitchTimeout.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    streamerId: {
        type: DataTypes.STRING,
        references: {
            model: "twitch__users",
            key: "id",
        },
    },
    chatterId: {
        type: DataTypes.STRING,
        references: {
            model: "twitch__users",
            key: "id",
        },
    },
    moderatorId: {
        type: DataTypes.STRING,
        references: {
            model: "twitch__users",
            key: "id",
        },
        allowNull: true,
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    duration: {
        type: DataTypes.INTEGER.UNSIGNED,
    },
    startTime: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: true,
    }
}, {
    sequelize,
    tableName: "twitch__timeouts",
    timestamps: false,
    indexes: [
        {
            name: "idx_streamer",
            fields: ["streamerId"],
        },
        {
            name: "idx_chatter",
            fields: ["chatterId"],
        },
    ],
});
