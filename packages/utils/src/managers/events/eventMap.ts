import {RawTwitchBan, RawTwitchChat} from "../../models";
import {IdentifyHandle} from "./handles";

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
    }
}

export type EventNames = keyof EventMap;
export type EventType = EventNames | string;

export type DataType<T extends EventType> = T extends EventNames
    ? EventMap[T]['data']
    : unknown;

export type ResponseType<T extends EventType> = T extends EventNames
    ? EventMap[T]['response']
    : unknown;
