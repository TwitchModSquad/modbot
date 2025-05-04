import {ChatInputCommandInteraction, SlashCommandSubcommandBuilder} from "discord.js";

import {ReplyManager} from "../../classes";

export interface TwineSubcommand {
    data: SlashCommandSubcommandBuilder;
    execute: (interaction: ChatInputCommandInteraction, replyManager: ReplyManager<ChatInputCommandInteraction>) => Promise<void>;
}