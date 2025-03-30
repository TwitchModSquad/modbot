import sequelize from "./database";
import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from "sequelize";

export enum IdentityRole {
    NON_MEMBER = "non-member",
    MEMBER = "member",
    MODERATOR = "moderator",
    ADMIN = "admin",
}

export interface RawIdentity {
    id: number;
    role: IdentityRole;
    createdDate?: string;
    updatedDate?: string;
    cachedDate?: string;
}

export class Identity extends Model<InferAttributes<Identity>, InferCreationAttributes<Identity>> implements RawIdentity {
    declare id: CreationOptional<number>;
    declare role: IdentityRole;
    declare createdAt?: Date;
    declare updatedAt?: Date;

    raw(): RawIdentity {
        return {
            id: this.id,
            role: this.role,
            createdDate: this.createdAt.toISOString(),
            updatedDate: this.updatedAt.toISOString(),
        };
    }
}

Identity.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    role: {
        type: DataTypes.ENUM,
        values: Object.values(IdentityRole),
        defaultValue: IdentityRole.NON_MEMBER,
        allowNull: false,
    },
}, {
    sequelize,
    tableName: "identities",
});
