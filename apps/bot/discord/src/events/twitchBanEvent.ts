import eventManager from "@modbot/utils/dist/managers/events/EventManager";
import {codeBlock as cb, cleanCodeBlockContent as cleanCB, EmbedBuilder} from "discord.js";
import {RawTwitchUser, TwitchChat, twitchUsers} from "@modbot/utils";
import {Op} from "sequelize";
import {discordChannelManager} from "../managers";

const BPM_LIMIT = 10;

const codeBlock = (content?: string) => cb(cleanCB(content ?? ""));

const formatChatMessage = (chatHistory: TwitchChat, chatter: RawTwitchUser) => {
    return `${Math.floor((chatHistory.createdAt.getTime() - Date.now()) / 1000)} s ` +
        `[${chatter.display_name}]: ${chatHistory.message}`;
}

interface BPMObject {
    streamerId: string;
    time: number;
}

let bpmTable: BPMObject[] = [];

eventManager.register("twitch:ban", async ban => {
    bpmTable = bpmTable.filter(x => x.time + (60 * 1000) > Date.now());
    const channelBpm = bpmTable.filter(x => x.streamerId === ban.streamerId).length;
    if (channelBpm >= BPM_LIMIT) return;

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

    const channels = await discordChannelManager.getChannelsFor("twitchBanSettings", ban.streamerId);

    for (const channel of channels) {
        if (channel.isSendable()) {
            channel.send({embeds: [embed]});
        }
    }
});
