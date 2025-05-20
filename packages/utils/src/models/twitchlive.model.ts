import sequelize from "./database";
import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from "sequelize";

export interface RawTwitchLive {
    id: number;
    livestreamId: string;
    userId: string;

    gameId?: string|null;
    title: string;
    thumbnailUrl: string;
    viewers: number;

    isMature: boolean;

    startedDate?: string;
    queryDate?: string;
}

export class TwitchLive extends Model<InferAttributes<TwitchLive>, InferCreationAttributes<TwitchLive>> implements RawTwitchLive {
    declare id: CreationOptional<number>;
    declare livestreamId: string;
    declare userId: string;

    declare gameId?: string|null;
    declare title: string;
    declare thumbnailUrl: string;
    declare viewers: number;

    declare isMature: boolean;

    declare startedAt: Date;
    declare queryAt: Date;

    raw(): RawTwitchLive {
        return {
            id: this.id,
            livestreamId: this.livestreamId,
            userId: this.userId,
            gameId: this.gameId,
            title: this.title,
            thumbnailUrl: this.thumbnailUrl,
            viewers: this.viewers,
            isMature: this.isMature,
            startedDate: this.startedAt.toISOString(),
            queryDate: this.queryAt.toISOString(),
        }

    }
}

TwitchLive.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    livestreamId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    gameId: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    thumbnailUrl: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    viewers: {
        type: DataTypes.INTEGER.UNSIGNED,
        defaultValue: 0,
        allowNull: false,
    },
    isMature: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    startedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    queryAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    }
}, {
    sequelize,
    timestamps: false,
    tableName: "twitch__live",
    indexes: [
        {
            name: "idx_streamer",
            fields: ["userId"],
        },
    ],
});
