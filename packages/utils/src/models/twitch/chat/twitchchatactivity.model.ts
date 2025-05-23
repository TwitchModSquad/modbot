import sequelize from "../../database";
import {DataTypes, InferAttributes, InferCreationAttributes, Model, WhereOptions} from "sequelize";

export interface RawTwitchChatActivity {
    chatterId: string;
    streamerId: string;
    lastMessageTimestamp?: string;
    count: number;
}

export const getHistory = (type: "chatter"|"streamer", userId: string, limit: number = 1000, page: number = 1, order: ["lastMessageDate"|"count", "ASC"|"DESC"] = ["count", "DESC"]): Promise<TwitchChatActivity[]> => {
    const where: WhereOptions<TwitchChatActivity> = {};

    if (type === "chatter") {
        where.chatterId = userId;
    } else {
        where.streamerId = userId;
    }

    return TwitchChatActivity.findAll({
        where, order: [order],
        limit, offset: (page - 1) * limit,
    });
}

export class TwitchChatActivity extends Model<InferAttributes<TwitchChatActivity>, InferCreationAttributes<TwitchChatActivity>> implements RawTwitchChatActivity {
    declare chatterId: string;
    declare streamerId: string;
    declare lastMessageDate: Date;
    declare count: number;

    raw(): RawTwitchChatActivity {
        return {
            chatterId: this.chatterId,
            streamerId: this.streamerId,
            lastMessageTimestamp: this.lastMessageDate.toISOString(),
            count: this.count,
        };
    }
}

TwitchChatActivity.init({
    streamerId: {
        type: DataTypes.STRING,
        primaryKey: true,
        references: {
            model: "twitch__users",
            key: "id",
        },
    },
    chatterId: {
        type: DataTypes.STRING,
        primaryKey: true,
        references: {
            model: "twitch__users",
            key: "id",
        },
    },
    lastMessageDate: {
        type: DataTypes.DATE,
    },
    count: {
        type: DataTypes.INTEGER.UNSIGNED,
        defaultValue: 0,
    },
}, {
    sequelize,
    timestamps: false,
    tableName: "twitch__chat_activity",
    indexes: [
        {
            name: "chatter_idx",
            fields: ["chatterId"],
        },
        {
            name: "streamer_idx",
            fields: ["streamerId"],
        },
    ],
});
