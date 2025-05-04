import {ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder} from "discord.js";
import {ReplyManager} from "../../classes";

export interface TwineCommand {
    data: SlashCommandBuilder|SlashCommandSubcommandsOnlyBuilder;
    execute: (interaction: ChatInputCommandInteraction, replyManager: ReplyManager<ChatInputCommandInteraction>) => Promise<void>;
}
