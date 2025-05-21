import sequelize from "./database";
import {DataTypes, InferAttributes, InferCreationAttributes, Model} from "sequelize";

export interface RawDiscordMessage {
    id: string;
    channelId: string;
    twitchBanId?: number|null;

    twitchLiveUserId?: string|null;
    twitchLiveActive?: boolean|null;

    createdDate?: string;
    updatedDate?: string;
}

export class DiscordMessage extends Model<InferAttributes<DiscordMessage>, InferCreationAttributes<DiscordMessage>> implements RawDiscordMessage {
    declare id: string;
    declare channelId: string;

    declare twitchBanId?: number;

    declare twitchLiveUserId?: string;
    declare twitchLiveActive?: boolean;

    declare createdAt?: Date;
    declare updatedAt?: Date;

    raw(): RawDiscordMessage {
        return {
            id: this.id,
            channelId: this.channelId,
            twitchBanId: this.twitchBanId,
            twitchLiveUserId: this.twitchLiveUserId,
            twitchLiveActive: this.twitchLiveActive,
            createdDate: this.createdAt ? this.createdAt.toISOString() : null,
            updatedDate: this.updatedAt ? this.updatedAt.toISOString() : null,
        };
    }
}

DiscordMessage.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    channelId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    twitchBanId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
            model: "twitch__bans",
            key: "id",
        },
    },
    twitchLiveUserId: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
            model: "twitch__users",
            key: "id",
        },
    },
    twitchLiveActive: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
}, {
    sequelize,
    tableName: "discord__messages",
});
