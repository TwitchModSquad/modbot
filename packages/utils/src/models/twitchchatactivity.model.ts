import sequelize from "./database";
import {DataTypes, InferAttributes, InferCreationAttributes, Model} from "sequelize";

export class TwitchChatActivity extends Model<InferAttributes<TwitchChatActivity>, InferCreationAttributes<TwitchChatActivity>> {
    declare chatterId: string;
    declare streamerId: string;
    declare lastMessageDate: Date;
    declare count: number;
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
