import {
    ChatInputCommandInteraction,
    SlashCommandSubcommandBuilder,
} from "discord.js";
import {ReplyManager} from "../../classes";
import {TwineSubcommand} from "../../interfaces";
import {discordChannelManager} from "../../managers";
import {RawTwitchUser} from "@modbot/utils";

export default class ListSubcommand implements TwineSubcommand {

    public data: SlashCommandSubcommandBuilder = new SlashCommandSubcommandBuilder()
        .setName("list")
        .setDescription("List all bound events in your Guild");

    public async execute(interaction: ChatInputCommandInteraction, replyManager: ReplyManager<ChatInputCommandInteraction>) {
        const boundChannels = await discordChannelManager.getChannelsInGuild(interaction.guildId);

        let result = "";

        for (const channel of boundChannels) {
            let twitchBanChannels: RawTwitchUser[]|"*" = await discordChannelManager.getUsers(channel.db.twitchBanSettings);
            let twitchLiveStartChannels: RawTwitchUser[]|"*" = await discordChannelManager.getUsers(channel.db.twitchLiveStartSettings);

            if (!twitchBanChannels && !twitchLiveStartChannels) continue;

            result += `${result === "" ? "" : "\n"}<#${channel.discord.id}>`;

            if (twitchBanChannels) {
                result += "\n> Listening for bans on channels: ";
                if (twitchBanChannels === "*") {
                    result += "`All Channels`";
                } else {
                    result += twitchBanChannels.map(x => `\`${x.display_name}\``).join(" ");
                }
            }

            if (twitchLiveStartChannels) {
                result += "\n> Listening for livestream starts on channels: ";
                if (twitchLiveStartChannels === "*") {
                    result += "`All Channels`";
                } else {
                    result += twitchLiveStartChannels.map(x => `\`${x.display_name}\``).join(" ");
                }
            }
        }

        await replyManager.info(result, "Bound Events");
    }

}