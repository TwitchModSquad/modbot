import {ChatClient, ChatMessage, ClearChat, ClearMsg} from "@twurple/chat";
import {
    authProvider, events,
    ListenSetting,
    logger,
    RawTwitchChat, TwitchBan,
    twitchChatsCached, TwitchTimeout,
    twitchUsers
} from "@modbot/utils";
import {TwitchChat} from "@modbot/utils/dist/models/twitchchat.model";
import { banStore, removePunishment, timeoutStore } from "../stores";
import {chatManager} from "../managers";

export enum ListenClientType {
    MEMBER = "member",
    MODERATOR = "moderator",
    LIMITED = "limited",
}

export default class ListenClient {

    public joinedChannels: string[] = [];
    public failedChannels: string[] = [];
    private chatClient: ChatClient;

    constructor(public userId: string|null, public channels: string[] = [], public type: ListenClientType = ListenClientType.MEMBER) {}

    public get intent() {
        return this.userId === process.env.TWITCH_USER_ID ? "chat" : `chat:${this.userId}`;
    }

    public async join(channel: string): Promise<void> {
        this.channels.push(channel);
        if (this.chatClient) {
            await this.chatClient.join(channel);
        }
    }

    public part(channel: string): void {
        this.chatClient.part(channel);
        
    }

    public async connect(): Promise<void> {
        logger.debug(`Listen client connected for ${this.type} ${this.intent}: ${this.channels.join(", ")}`);

        this.chatClient = new ChatClient({
            authProvider,
            authIntents: [this.intent],
            channels: this.channels,
        });

        this.chatClient.connect();

        this.chatClient.onJoin(e => {
            logger.debug(`Joined channel ${e}`);
            this.joinedChannels.push(e);
        });

        this.chatClient.onJoinFailure(e => {
            logger.warn(`Failed to join channel ${e}`);
            this.failedChannels.push(e);
        });

        this.chatClient.onMessage(this.handleChat);
        this.chatClient.onMessageRemove(this.handleChatRemove);
        this.chatClient.onBan(this.handleBan);
        this.chatClient.onTimeout(this.handleTimeout);
    }

    private async handleChat(channel: string, user: string, text: string, message: ChatMessage) {
        await chatManager.logMessage({
            id: message.id,
            streamerId: message.channelId,
            chatterId: message.userInfo.userId,
            message: message.text,
            color: message.userInfo.color,
        });
    }

    private async handleChatRemove(channel: string, messageId: string, msg: ClearMsg) {
        await chatManager.deleteMessage(messageId);
    }

    private async handleBan(channel: string, user: string, msg: ClearChat) {
        const streamer = await twitchUsers.get(msg.channelId, true);

        if (streamer.listen_setting === ListenSetting.NONE) return;

        const chatter = await twitchUsers.get(msg.targetUserId, true);

        if (!streamer || !chatter) {
            logger.warn(`Skipping ban for ${user} in ${channel} as we can't find their user!`);
            return;
        }

        const ban = await TwitchBan.create({
            streamerId: streamer.id,
            chatterId: chatter.id,
        });

        await ban.fetchData();

        banStore.add(ban);
        await events.publish("twitch:ban", ban.raw());
    }

    private async handleTimeout(channel: string, user: string, duration: number, msg: ClearChat) {
        const streamer = await twitchUsers.get(msg.channelId, true);

        if (streamer.listen_setting !== ListenSetting.ALL) return;

        const chatter = await twitchUsers.get(msg.targetUserId, true);

        if (!streamer || !chatter) {
            logger.warn(`Skipping timeout for ${user} in ${channel} as we can't find their user!`);
            return;
        }

        const timeout = await TwitchTimeout.create({
            streamerId: streamer.id,
            chatterId: chatter.id,
            duration: duration,
            endTime: new Date(Date.now() + (duration * 1000)),
        });

        timeoutStore.add(timeout);

        await events.publish("twitch:timeout", timeout.raw());
    }

}
