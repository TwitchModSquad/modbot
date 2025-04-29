import {ChatInputCommandInteraction, SlashCommandSubcommandsOnlyBuilder} from "discord.js";

import {ReplyManager} from "../../classes";
import {TwineCommand} from "./TwineCommand";
import {TwineSubcommand} from "./TwineSubcommand";

export class TwineCommandWithSubcommands implements TwineCommand {
    data: SlashCommandSubcommandsOnlyBuilder;
    private readonly subcommands: TwineSubcommand[] = [];

    constructor(data: SlashCommandSubcommandsOnlyBuilder, subcommands: TwineSubcommand[]) {
        this.subcommands = subcommands;

        for (const subcommand of subcommands) {
            data = data.addSubcommand(subcommand.data);
        }

        this.data = data;
    }

    async execute(interaction: ChatInputCommandInteraction, replyManager: ReplyManager<ChatInputCommandInteraction>): Promise<void> {
        const subcommandName = interaction.options.getSubcommand(true);
        for (const subcommand of this.subcommands) {
            if (subcommand.data.name === subcommandName) {
                await subcommand.execute(interaction, replyManager);
                return;
            }
        }
        await replyManager.error(`Subcommand with name \`${subcommandName}\` was not found!`);
    }
}