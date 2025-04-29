import sequelize from "./database";
import {DataTypes, InferAttributes, InferCreationAttributes, Model} from "sequelize";

export enum AutoModReason {
    AUTOMOD = "automod",
    BLOCKED_TERM = "blocked_term",
}

export enum AutoModResult {
    APPROVED = "approved",
    DENIED = "denied",
    EXPIRED = "expired",
}

export interface RawTwitchChat {
    id: string;
    streamerId: string;
    chatterId: string;
    color?: string;
    badges?: string;
    emotes?: string;
    message: string;
    deleted?: boolean;
    percent_caps: number;
    percent_emotes: number;

    automod_reason?: AutoModReason;
    automod_result?: AutoModResult;
    automod_level?: number;

    createdDate?: string;
    updatedDate?: string;
}

export class TwitchChat extends Model<InferAttributes<TwitchChat>, InferCreationAttributes<TwitchChat>> implements RawTwitchChat {
    declare id: string;
    declare streamerId: string;
    declare chatterId: string;
    declare color?: string;
    declare badges?: string;
    declare emotes?: string;
    declare message: string;
    declare deleted?: boolean;
    declare percent_caps: number;
    declare percent_emotes: number;

    declare automod_reason?: AutoModReason;
    declare automod_result?: AutoModResult;
    declare automod_level?: number;

    declare createdAt?: Date;
    declare updatedAt?: Date;

    raw(): RawTwitchChat {
        return {
            id: this.id,
            streamerId: this.streamerId,
            chatterId: this.chatterId,
            color: this.color,
            badges: this.badges,
            emotes: this.emotes,
            message: this.message,
            deleted: this.deleted,
            percent_caps: this.percent_caps,
            percent_emotes: this.percent_emotes,
            automod_reason: this.automod_reason,
            automod_result: this.automod_result,
            createdDate: this.createdAt ? this.createdAt.toISOString() : null,
            updatedDate: this.updatedAt ? this.updatedAt.toISOString() : null,
        };
    }
}

TwitchChat.init({
    id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
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
    color: {
        type: DataTypes.STRING(7),
        defaultValue: "",
    },
    badges: {
        type: DataTypes.STRING(256),
        defaultValue: "",
    },
    emotes: {
        type: DataTypes.TEXT,
        defaultValue: "",
    },
    message: {
        type: DataTypes.TEXT,
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    percent_caps: {
        type: DataTypes.DECIMAL(5, 4),
    },
    percent_emotes: {
        type: DataTypes.DECIMAL(5, 4),
    },
    automod_reason: {
        type: DataTypes.ENUM,
        values: Object.values(AutoModReason),
        allowNull: true,
    },
    automod_result: {
        type: DataTypes.ENUM,
        values: Object.values(AutoModResult),
        allowNull: true,
    },
    automod_level: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: true,
    }
}, {
    sequelize,
    tableName: "twitch__chats",
    indexes: [
        {
            name: "streamer_chatter_createdAt_idx",
            fields: ["streamerId", "chatterId", "createdAt"],
        },
        {
            name: "chatter_createdAt_idx",
            fields: ["chatterId", "createdAt"],
        },
        {
            name: "streamer_createdAt_idx",
            fields: ["streamerId", "createdAt"],
        },
        {
            name: "createdAt_idx",
            fields: ["createdAt"],
        },
    ],
});
