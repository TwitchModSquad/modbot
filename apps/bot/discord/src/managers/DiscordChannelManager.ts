import {DiscordChannel, ListenSetting, ModelStore, RawDiscordChannel, RawTwitchUser, twitchUsers} from "@modbot/utils";
import {GuildTextBasedChannel, TextBasedChannel} from "discord.js";
import client from "../app";

export type ChannelEvents = {
    twitchBanSettings?: RawTwitchUser[]|"*";
    twitchLiveStartSettings?: RawTwitchUser[]|"*";
};

export type Events = ChannelEvents;

class DiscordChannelManager extends ModelStore<RawDiscordChannel> {

    constructor() {
        super(DiscordChannel, "discord:channel");
    }

    public async putEvents(channel: GuildTextBasedChannel, events: Events) {
        const currentChannel = this.get(channel.id);

        let rawChannel: RawDiscordChannel = {
            id: channel.id,
            guildId: channel.guildId,
        };

        const modifyUserList = (settingName: keyof Events) => {
            if (events && events[settingName]) {
                if (events[settingName] === "*") {
                    rawChannel[settingName] = "*";
                } else if (events[settingName] instanceof Array) {
                    rawChannel[settingName] = events[settingName]
                        .map(x => x.id)
                        .join(",");
                }
            }
        }

        modifyUserList("twitchBanSettings");
        modifyUserList("twitchLiveStartSettings");

        if (currentChannel) {
            await this.update(channel.id, rawChannel);
        } else {
            const discordChannel = await DiscordChannel.create(rawChannel);
            rawChannel = discordChannel.raw();
            await this.set(rawChannel);
            return rawChannel;
        }
    }

    public async getChannelsFor(event: keyof ChannelEvents, userId: string): Promise<TextBasedChannel[]> {
        let channels: TextBasedChannel[] = [];

        for (const discordChannel of this.getAll()) {
            if (discordChannel[event] === "*" || discordChannel[event].split(",").includes(userId)) {
                const channel = await client.channels.fetch(discordChannel.id);
                if (channel.isTextBased()) {
                    channels.push(channel as TextBasedChannel);
                }
            }
        }

        return channels;
    }

    public async getUsers(setting: string, throwIfMissing: boolean = false): Promise<RawTwitchUser[] | "*" | null> {
        if (!setting) {
            return null;
        }

        if (setting === "*") {
            return "*";
        }

        let users: RawTwitchUser[] = [];
        for (const userId of setting.split(",")) {
            const user = await twitchUsers.get(userId, true);
            if (user) {
                users.push(user);
            } else if (throwIfMissing) {
                throw new Error(`User with ID ${userId} not found!`);
            }
        }
        return users;
    }

    public async parseLoginList(list: string, disallowedListenSettings: ListenSetting[] = []): Promise<RawTwitchUser[]|"*"> {
        const userLogins = list.split("\n")
            .map(x => x.trim())
            .filter(x => x.length > 0);

        if (userLogins.includes("*")) {
            return "*";
        }

        const users: RawTwitchUser[] = [];
        for (const userLogin of userLogins) {
            const user = await twitchUsers.getByName(userLogin, true);

            if (!user) {
                throw new Error(`User ${userLogin} not found!`);
            }

            if (disallowedListenSettings.includes(user.listen_setting)) {
                throw new Error(`User ${user.display_name} can't be bound with this event as they aren't being watched by the bot!`);
            }

            users.push(user);
        }
        return users;
    }

}

export default new DiscordChannelManager();
