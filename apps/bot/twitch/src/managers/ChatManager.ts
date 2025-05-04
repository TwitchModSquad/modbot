import {
    AutoModReason, AutoModResult,
    ListenSetting,
    logger,
    RawTwitchChat,
    TwitchChat,
    twitchChatsCached,
    twitchUsers
} from "@modbot/utils";
import {removePunishment} from "../stores";

export interface ChatMessage {
    id: string;
    streamerId: string;
    chatterId: string;
    message: string;
    badges?: Map<string, string>;
    emotes?: Map<string, string[]>;
    color?: string;

    automod_reason?: AutoModReason;
    automod_result?: AutoModResult;
    automod_level?: number;
}

interface MessageStatistics {
    percent_caps: number;
    percent_emotes: number;
    emotes: string;
}

function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
const CAPS_REGEX = /[A-Z]/g;

class ChatManager {

    private count: number = 0;

    constructor() {
        TwitchChat.count().then(count => this.count = count);
    }

    private parseStatistics(message: string, emoteOffsets: Map<string, string[]>): MessageStatistics {
        let messageWithoutEmotes = message;

        let percent_caps = 0;
        let percent_emotes = 0;

        let emotes = "";

        for (let [emote, positions] of emoteOffsets) {
            positions.forEach(position => {
                const [loc1, loc2] = position.split("-");
                if (emotes.length > 0) emotes += "/";
                emotes += `${emote}:${position}`;
                try {
                    messageWithoutEmotes = messageWithoutEmotes.replace(new RegExp(escapeRegExp(message.substring(Number(loc1), Number(loc2)+1)), "g"), "");
                } catch(err) {
                    logger.debug(err);
                }
            });
        }

        messageWithoutEmotes = messageWithoutEmotes.trim();
        percent_emotes = 1 - (messageWithoutEmotes.length / message.length);

        let messageWithoutCaps = messageWithoutEmotes.replace(CAPS_REGEX, "");
        if (messageWithoutEmotes.length > 0)
            percent_caps = 1 - (messageWithoutCaps.length / messageWithoutEmotes.length);

        return {
            emotes, percent_caps, percent_emotes,
        };
    }

    private parseBadges(badgeInfo: Map<string, string>): string {
        let badges = "";

        for (let [badge, num] of badgeInfo) {
            if (badges.length > 0) badges += ",";
            badges += `${badge}/${num}`;
        }

        return badges;
    }

    public getCount() {
        return this.count;
    }

    public async logMessage(message: ChatMessage) {
        this.count++;

        const streamer = await twitchUsers.get(message.streamerId, true);

        // Stop now if the streamer isn't subscribed to any chat logging
        if (![ListenSetting.ALL, ListenSetting.BANS_WITH_CACHED_CHAT].includes(streamer.listen_setting)) {
            return;
        }

        const chatter = await twitchUsers.get(message.chatterId, true);

        if (!streamer || !chatter) {
            logger.warn(`Skipping message for ${message.chatterId} in ${message.streamerId} as we can't find their user!`);
            return;
        }

        await removePunishment(streamer.id, chatter.id);

        const badges = this.parseBadges(message.badges ?? new Map());
        const {
            emotes, percent_caps, percent_emotes
        } = this.parseStatistics(message.message, message.emotes ?? new Map());

        const rawChat: RawTwitchChat = {
            id: message.id,
            streamerId: streamer.id,
            chatterId: chatter.id,
            color: message.color ?? "",
            message: message.message,
            badges, emotes,
            percent_caps, percent_emotes,
            automod_reason: message.automod_reason ?? null,
            automod_result: message.automod_result ?? null,
            automod_level: message.automod_level ?? null,
        };

        if (streamer.listen_setting === ListenSetting.ALL) {
            await TwitchChat.create(rawChat);
        } else if (streamer.listen_setting === ListenSetting.BANS_WITH_CACHED_CHAT) {
            await twitchChatsCached.addChatMessage(rawChat);
        }
    }

    public async deleteMessage(messageId: string) {
        const chatMessage = await TwitchChat.findByPk(messageId);
        if (chatMessage) {
            chatMessage.deleted = true;
            await chatMessage.save();
        }
    }

}

export const chatManager = new ChatManager();
