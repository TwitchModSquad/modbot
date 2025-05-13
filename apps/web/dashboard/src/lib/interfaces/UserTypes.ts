import type {RawDiscordUser, RawTwitchUser} from "@modbot/utils";

export type UserType = 'both' | 'twitch' | 'discord';
export type User = (RawDiscordUser | RawTwitchUser) & { selected: boolean };
