import sequelize from "./database";
import {DataTypes, InferAttributes, InferCreationAttributes, Model} from "sequelize";

export enum RoleType {
    MODERATOR = "moderator",
    EDITOR = "editor",
}

export class TwitchRole extends Model<InferAttributes<TwitchRole>, InferCreationAttributes<TwitchRole>> {
    declare userId: string;
    declare streamerId: string;
    declare type: RoleType;
    declare confirmed: boolean;

    declare createdAt?: Date;
    declare updatedAt?: Date;
    declare deletedAt?: Date;
}

TwitchRole.init({
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        references: {
            model: "twitch__users",
            key: "id",
        },
    },
    streamerId: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        references: {
            model: "twitch__users",
            key: "id",
        },
    },
    type: {
        type: DataTypes.ENUM,
        values: Object.values(RoleType),
        allowNull: false,
    },
    confirmed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
}, {
    sequelize, paranoid: true,
    tableName: "twitch__roles",
});
