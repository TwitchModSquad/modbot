import sequelize from "./database";
import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from "sequelize";
import {ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle, MessageCreateOptions} from "discord.js";
import {twitchUsers} from "../managers";
import {HelixGame} from "@twurple/api";
import {getTwitchClient} from "../twitch";
import {codeBlock} from "../utils";

const gameCache = new Map<string, HelixGame>();

export const getGame = async (gameId: string): Promise<HelixGame|null> => {
    if (gameCache.has(gameId)) {
        return gameCache.get(gameId);
    }

    const game = await getTwitchClient().games.getGameById(gameId);
    if (game) {
        gameCache.set(gameId, game);
        return game;
    }
    return null;
}

export const createLiveMessageComponent = async (live: RawTwitchLive): Promise<MessageCreateOptions> => {
    const streamer = await twitchUsers.get(live.userId);
    const game = await getGame(live.gameId);

    const embed = new EmbedBuilder()
        .setColor(0x772ce8)
        .setAuthor({
            iconURL: streamer.profile_image_url,
            name: streamer.display_name,
        })
        .setImage(live.thumbnailUrl
            .replace("{width}", "512")
            .replace("{height}", "288") +
            `?v=${Date.now()}`
        )
        .setTitle(live.title)
        .setFooter({
            text: "The Mod Squad",
            iconURL: "https://cdn.modsquad.tools/assets/images/logo.webp",
        })
        .setTimestamp(new Date(live.startedDate));

    if (game) {
        embed.setThumbnail(game.getBoxArtUrl(225, 300));
        embed.addFields({
            name: "Game",
            value: codeBlock(game.name),
            inline: true,
        });
    }

    embed.addFields({
        name: "Viewers",
        value: codeBlock(live.viewers.toLocaleString()),
        inline: true,
    });

    const actionRow: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>()
        .setComponents(
            new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setURL(`https://www.twitch.tv/${streamer.login}`)
                .setLabel(`Visit ${streamer.display_name} on Twitch`)
        );

    return {
        embeds: [embed],
        components: [actionRow],
    };
}

export interface RawTwitchLive {
    id: number;
    livestreamId: string;
    userId: string;

    gameId?: string|null;
    title: string;
    thumbnailUrl: string;
    viewers: number;

    isMature: boolean;

    startedDate?: string;
    queryDate?: string;
}

export class TwitchLive extends Model<InferAttributes<TwitchLive>, InferCreationAttributes<TwitchLive>> implements RawTwitchLive {
    declare id: CreationOptional<number>;
    declare livestreamId: string;
    declare userId: string;

    declare gameId?: string|null;
    declare title: string;
    declare thumbnailUrl: string;
    declare viewers: number;

    declare isMature: boolean;

    declare startedAt: Date;
    declare queryAt: Date;

    raw(): RawTwitchLive {
        return {
            id: this.id,
            livestreamId: this.livestreamId,
            userId: this.userId,
            gameId: this.gameId,
            title: this.title,
            thumbnailUrl: this.thumbnailUrl,
            viewers: this.viewers,
            isMature: this.isMature,
            startedDate: this.startedAt.toISOString(),
            queryDate: this.queryAt.toISOString(),
        }

    }
}

TwitchLive.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    livestreamId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    gameId: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    thumbnailUrl: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    viewers: {
        type: DataTypes.INTEGER.UNSIGNED,
        defaultValue: 0,
        allowNull: false,
    },
    isMature: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    startedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    queryAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    }
}, {
    sequelize,
    timestamps: false,
    tableName: "twitch__live",
    indexes: [
        {
            name: "idx_streamer",
            fields: ["userId"],
        },
    ],
});
