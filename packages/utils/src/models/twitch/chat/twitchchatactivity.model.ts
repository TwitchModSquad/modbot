import sequelize from "../../database";
import {DataTypes, InferAttributes, InferCreationAttributes, Model} from "sequelize";

export interface RawTwitchChatActivity {
    chatterId: string;
    streamerId: string;
    lastMessageTimestamp?: string;
    count: number;
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
