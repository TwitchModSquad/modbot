import {RawTwitchBan, RawTwitchChat, RawTwitchLive, RawTwitchUser} from "../../models";
import {IdentifyHandle} from "./handles";
import {PublicStats} from "../../interfaces";

export interface EventMap {
    "identify": {
        data: string;
        response: IdentifyHandle;
    };
    "twitch:chat": {
        data: RawTwitchChat;
        response: void;
    };
    "twitch:ban": {
        data: RawTwitchBan;
        response: void;
    };
    "twitch:join": {
        data: RawTwitchUser;
        response: void;
    };
    "twitch:part": {
        data: RawTwitchUser;
        response: void;
    };
    "twitch:live": {
        data: RawTwitchLive;
        response: void;
    };
    "twitch:live-update": {
        data: RawTwitchLive;
        response: void;
    },
    "twitch:offline": {
        data: string;
        response: void;
    };
    "stats:request": {
        data: string;
        response: Partial<PublicStats>;
    };
}

export type EventNames = keyof EventMap;
export type EventType = EventNames | string;

export type DataType<T extends EventType> = T extends EventNames
    ? EventMap[T]['data']
    : unknown;

export type ResponseType<T extends EventType> = T extends EventNames
    ? EventMap[T]['response']
    : unknown;
