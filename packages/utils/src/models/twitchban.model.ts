import sequelize from "./database";
import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from "sequelize";
import {authProvider, logger, getTwitchClient, twitchUsers} from "../index";

export interface RawTwitchBan {
    id: number;
    streamerId: string;
    chatterId: string;
    moderatorId?: string|null;
    reason?: string|null;

    startDate?: string;
    endDate?: string;
}

export class TwitchBan extends Model<InferAttributes<TwitchBan>, InferCreationAttributes<TwitchBan>> implements RawTwitchBan {
    declare id: CreationOptional<number>;
    declare streamerId: string;
    declare chatterId: string;
    declare moderatorId?: string|null;
    declare reason?: string|null;

    declare startTime?: Date;
    declare endTime?: Date|null;

    async fetchData(): Promise<void> {
        try {
            const banResult = await getTwitchClient().asUser(this.streamerId, async ctx => {
                return await ctx.moderation.getBannedUsers(this.streamerId, {
                    userId: this.chatterId,
                    limit: 1,
                });
            });

            if (banResult.data.length > 0) {
                const ban = banResult.data[0];
                const moderator = await twitchUsers.get(ban.moderatorId, true);
                if (moderator) {
                    this.moderatorId = moderator.id;
                }
                this.reason = ban.reason;
                await this.save();
            } else {
                logger.warn(`No ban information returned for ban ${this.id}`);
            }
        } catch(e) {
            logger.warn(`Failed to get twitch ban data for ban ${this.id}: ${e}`);
        }
    }

    raw(): RawTwitchBan {
        return {
            id: this.id,
            streamerId: this.streamerId,
            chatterId: this.chatterId,
            moderatorId: this.moderatorId,
            reason: this.reason,
            startDate: this.startTime ? this.startTime.toISOString() : null,
            endDate: this.endTime ? this.endTime.toISOString() : null,
        };
    }
}

TwitchBan.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
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
    moderatorId: {
        type: DataTypes.STRING,
        references: {
            model: "twitch__users",
            key: "id",
        },
        allowNull: true,
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    startTime: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: true,
    }
}, {
    sequelize,
    tableName: "twitch__bans",
    timestamps: false,
    indexes: [
        {
            name: "idx_streamer",
            fields: ["streamerId"],
        },
        {
            name: "idx_chatter",
            fields: ["chatterId"],
        },
    ],
});
