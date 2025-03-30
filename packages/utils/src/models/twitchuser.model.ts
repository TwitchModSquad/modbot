import sequelize from "./database";
import {DataTypes, InferAttributes, InferCreationAttributes, Model} from "sequelize";

export enum TwitchUserType {
    DEFAULT = "",
    ADMIN = "admin",
    GLOBAL_MOD = "global_mod",
    STAFF = "staff",
}

export enum TwitchUserBroadcasterType {
    NONE = "",
    AFFILIATE = "affiliate",
    PARTNER = "partner",
}

export interface RawTwitchUser {
    id: string;
    login: string;
    display_name: string;

    description?: string|null;
    profile_image_url?: string|null;
    offline_image_url?: string|null;

    follower_count?: number|null;

    type: TwitchUserType;
    broadcaster_type: TwitchUserBroadcasterType;

    identity?: number|null;

    createdDate?: string;
    updatedDate?: string;
    cachedDate?: string;
}

export class TwitchUser extends Model<InferAttributes<TwitchUser>, InferCreationAttributes<TwitchUser>> implements RawTwitchUser {
    declare id: string;
    declare login: string;
    declare display_name: string;

    declare description?: string|null;
    declare profile_image_url?: string|null;
    declare offline_image_url?: string|null;

    declare follower_count?: number|null;

    declare type: TwitchUserType;
    declare broadcaster_type: TwitchUserBroadcasterType;

    declare identity?: number|null;

    declare createdAt?: Date;
    declare updatedAt?: Date;

    raw(): RawTwitchUser {
        return {
            id: this.id,
            login: this.login,
            display_name: this.display_name,
            description: this.description,
            profile_image_url: this.profile_image_url,
            offline_image_url: this.offline_image_url,
            follower_count: this.follower_count,
            type: this.type,
            broadcaster_type: this.broadcaster_type,
            identity: this.identity,
            createdDate: this.createdAt ? this.createdAt.toISOString() : null,
            updatedDate: this.updatedAt ? this.updatedAt.toISOString() : null,
        };
    }
}

TwitchUser.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    login: {
        type: DataTypes.STRING(25),
        allowNull: false,
    },
    display_name: {
        type: DataTypes.STRING(25),
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    profile_image_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    offline_image_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    follower_count: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
    },
    type: {
        type: DataTypes.ENUM,
        values: Object.values(TwitchUserType),
        defaultValue: TwitchUserType.DEFAULT,
        allowNull: false,
    },
    broadcaster_type: {
        type: DataTypes.ENUM,
        values: Object.values(TwitchUserBroadcasterType),
        defaultValue: TwitchUserBroadcasterType.NONE,
        allowNull: false,
    },
    identity: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
    },
}, {
    sequelize,
    indexes: [
        {
            name: "idx_login_exact",
            fields: ["login"],
        },
        {
            name: "idx_login_prefix",
            fields: ["login"],
            using: "BTREE",
        },
    ],
    tableName: "twitch__users",
});
