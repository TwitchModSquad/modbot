import {cleanCodeBlockContent as cleanCB, codeBlock as cb} from "discord.js";
import {RawTwitchUser, TwitchChat} from "./models";


export const codeBlock = (content?: string) => cb(cleanCB(content ?? ""));

export const formatRelativeTime = (time: number): string => {
    let seconds = Math.floor((Date.now() - time) / 1000);
    let hours = Math.floor(seconds / 3_600);
    seconds -= hours * 3600;
    let minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;
    return `-${hours}:${minutes}:${seconds}`;
}

export const formatChatMessage = (chatHistory: TwitchChat, chatter: RawTwitchUser) => {
    return `${formatRelativeTime(chatHistory.createdAt.getTime())} ` +
        `[${chatter.display_name}]: ${chatHistory.message}`;
}
