import {
    ActionRowBuilder,
    ChatInputCommandInteraction,
    ModalBuilder, ModalSubmitInteraction,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";
import {BindModalStore} from "./index";
import {discordChannelManager} from "../../../managers";
import {ReplyManager} from "../../../classes";
import {Events} from "../../../managers/DiscordChannelManager";
import {ListenSetting} from "@modbot/utils";

export default class TwitchUserListBind implements BindModalStore {

    public name: string;
    public value: keyof Events;
    private inputPlaceholder: string;
    private disallowedListenSettings: ListenSetting[];

    constructor(name: string, value: keyof Events, inputPlaceholder: string, disallowedListenSettings: ListenSetting[] = []) {
        this.name = name;
        this.value = value;
        this.inputPlaceholder = inputPlaceholder;
        this.disallowedListenSettings = disallowedListenSettings;
        this.execute = this.execute.bind(this);
    }

    public async modal(interaction: ChatInputCommandInteraction): Promise<ModalBuilder> {
        let twitchUserValue = "";
        if (interaction?.channelId) {
            const channel = discordChannelManager.get(interaction.channelId);
            if (channel && channel[this.value]) {
                const users = await discordChannelManager.getUsers(
                    channel[this.value]
                );
                if (users) {
                    if (users === "*") {
                        twitchUserValue = "*";
                    } else {
                        twitchUserValue = users
                            .map(x => x.login)
                            .join("\n");
                    }
                }
            }
        }
        return new ModalBuilder()
            .setCustomId(this.value)
            .setTitle(`Bind: ${this.name} Event`)
            .setComponents(
                [
                    new ActionRowBuilder<TextInputBuilder>()
                        .setComponents(
                            new TextInputBuilder()
                                .setStyle(TextInputStyle.Paragraph)
                                .setCustomId("users")
                                .setLabel("Twitch Usernames (* = all users)")
                                .setRequired(false)
                                .setMaxLength(1024)
                                .setPlaceholder(`${this.inputPlaceholder} Use new lines for multiple.`)
                                .setValue(twitchUserValue)
                        ),
                ]
            );
    }

    public async execute(interaction: ModalSubmitInteraction, replyManager: ReplyManager<ModalSubmitInteraction>) {
        await replyManager.defer(true);

        try {
            const userSetting = await discordChannelManager.parseLoginList(
                interaction.fields.getTextInputValue("users") ?? "",
                this.disallowedListenSettings
            )

            await discordChannelManager.putEvents(interaction.channel, {
                [this.value]: userSetting,
            });

            await replyManager.success(
                `Successfully bound event to <#${interaction.channelId}>!\n\n` +
                (
                    userSetting === "*" ?
                        `All ${this.name} recorded will now be sent in this channel.` :
                        `${this.name} from the following users will now be sent in this channel: ${userSetting.map(x => `\`${x.display_name}\``).join(", ")}`
                )
            );
        } catch(err) {
            await replyManager.error(err.message);
        }
    }

}