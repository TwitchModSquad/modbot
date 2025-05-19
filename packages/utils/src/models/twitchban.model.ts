import sequelize from "./database";
import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model, Op} from "sequelize";
import {logger, getTwitchClient, twitchUsers, codeBlock, formatChatMessage, TwitchChat} from "../index";
import {EmbedBuilder} from "discord.js";

export const createBanEmbed = async (ban: RawTwitchBan): Promise<EmbedBuilder> => {
    const streamer = await twitchUsers.get(ban.streamerId);
    const chatter = await twitchUsers.get(ban.chatterId);

    const embed = new EmbedBuilder()
        .setColor(0xC83C3C)
        .setAuthor({
            iconURL: streamer.profile_image_url,
            name: streamer.display_name,
        })
        .setThumbnail(chatter.profile_image_url)
        .setTitle(`${chatter.display_name} was banned!`)
        .setDescription(`User \`${chatter.display_name}\` was banned from channel \`#${streamer.login}\`!`)
        .setFooter({
            text: "The Mod Squad",
            iconURL: "https://cdn.modsquad.tools/assets/images/logo.webp",
        });

    if (ban.moderatorId) {
        const moderator = await twitchUsers.get(ban.moderatorId);
        embed.addFields({
            name: "Moderator",
            value: codeBlock(moderator.display_name),
            inline: true,
        });
    }

    if (ban.reason) {
        embed.addFields({
            name: "Reason",
            value: codeBlock(ban.reason),
            inline: true,
        });
    }

    const chatHistory = await TwitchChat.findAll({
        where: {
            streamerId: ban.streamerId,
            chatterId: ban.chatterId,
            createdAt: {
                [Op.lt]: new Date(ban.startDate),
            }
        },
        order: [
            ["createdAt", "DESC"],
        ]
    });

    let chatHistoryText = chatHistory.length > 0 ?
        chatHistory.map(x => formatChatMessage(x, chatter)).join("\n") :
        "There are no logs in this channel from this user!";

    embed.addFields({
        name: "Chat History",
        value: codeBlock(chatHistoryText),
        inline: false,
    });

    return embed;
}

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
