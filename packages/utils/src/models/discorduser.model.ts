import sequelize from "./database";
import {DataTypes, InferAttributes, InferCreationAttributes, Model} from "sequelize";

export interface RawDiscordUser {
    id: string;

    username: string;
    discriminator: string;
    globalName?: string|null;
    displayName?: string|null;

    avatar?: string;

    identity?: number|null;

    createdDate?: string;
    updatedDate?: string;
    cachedDate?: string;
}

export class DiscordUser extends Model<InferAttributes<DiscordUser>, InferCreationAttributes<DiscordUser>> implements RawDiscordUser {
    declare id: string;

    declare username: string;
    declare discriminator: string;
    declare globalName: string;
    declare displayName: string;

    declare avatar: string|null;

    declare identity?: number|null;

    declare createdAt?: Date;
    declare updatedAt?: Date;

    raw(): RawDiscordUser {
        return {
            id: this.id,
            username: this.username,
            discriminator: this.discriminator,
            globalName: this.globalName,
            displayName: this.displayName,
            avatar: this.avatar,
            identity: this.identity,
            createdDate: this.createdAt ? this.createdAt.toISOString() : null,
            updatedDate: this.updatedAt ? this.updatedAt.toISOString() : null,
        };
    }
}

DiscordUser.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING(32),
        allowNull: false,
    },
    discriminator: {
        type: DataTypes.STRING(4),
        allowNull: false,
    },
    globalName: {
        type: DataTypes.STRING(32),
        allowNull: true,
    },
    displayName: {
        type: DataTypes.STRING(32),
        allowNull: true,
    },
    avatar: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    identity: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
            model: "identities",
            key: "id",
        }
    }
}, {
    sequelize,
    indexes: [
        {
            name: "idx_username_exact",
            fields: ["username"],
        },
        {
            name: "idx_username_prefix",
            fields: ["username"],
            using: "BTREE",
        },
    ],
    tableName: "discord__users",
});
