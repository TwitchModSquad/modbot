import sequelize from "../database";
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

export enum ListenSetting {
    NONE = "none",
    BANS_ONLY = "bans",
    BANS_WITH_CACHED_CHAT = "bans_cached",
    ALL = "all",
}

export interface RawTwitchUser {
    id: string;
    login: string;
    display_name: string;

    description?: string|null;
    profile_image_url?: string|null;
    offline_image_url?: string|null;

    follower_count?: number|null;

    listen_setting?: ListenSetting;

    type: TwitchUserType;
    broadcaster_type: TwitchUserBroadcasterType;

    identity?: number|null;

    rolesLastUpdatedDate?: string;
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

    declare listen_setting?: ListenSetting;

    declare type: TwitchUserType;
    declare broadcaster_type: TwitchUserBroadcasterType;

    declare identity?: number|null;

    declare rolesLastUpdatedAt?: Date;
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
            listen_setting: this.listen_setting,
            type: this.type,
            broadcaster_type: this.broadcaster_type,
            identity: this.identity,
            rolesLastUpdatedDate: this.rolesLastUpdatedAt ? this.rolesLastUpdatedAt.toISOString() : null,
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
        type: DataTypes.TEXT,
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
        references: {
            model: "identities",
            key: "id",
        }
    },
    listen_setting: {
        type: DataTypes.ENUM,
        values: Object.values(ListenSetting),
        defaultValue: ListenSetting.NONE,
        allowNull: false,
    },
    rolesLastUpdatedAt: {
        type: DataTypes.DATE,
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
        {
            name: "idx_listen_setting",
            fields: ["listen_setting"],
        }
    ],
    tableName: "twitch__users",
});
