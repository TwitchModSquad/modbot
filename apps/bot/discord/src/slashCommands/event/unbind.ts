import {
    ChatInputCommandInteraction,
    SlashCommandSubcommandBuilder,
} from "discord.js";
import {ReplyManager} from "../../classes";
import {TwineSubcommand} from "../../interfaces";
import {discordChannelManager} from "../../managers";
import {DiscordChannel} from "@modbot/utils";

export default class UnbindSubcommand implements TwineSubcommand {

    public data: SlashCommandSubcommandBuilder = new SlashCommandSubcommandBuilder()
        .setName("unbind")
        .setDescription("Unbind all listeners in a channel");

    public async execute(interaction: ChatInputCommandInteraction, replyManager: ReplyManager<ChatInputCommandInteraction>) {
        await DiscordChannel.destroy({
            where: {
                id: interaction.channelId,
            }
        })
        await discordChannelManager.delete(interaction.channelId);

        await replyManager.success(`All listeners unbound in <#${interaction.channelId}>!`);
    }

}