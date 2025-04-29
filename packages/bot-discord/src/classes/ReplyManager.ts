import {
    EmbedBuilder,
    Guild,
    InteractionCallbackResponse,
    InteractionDeferReplyOptions, InteractionEditReplyOptions, InteractionReplyOptions,
    InteractionResponse,
    Message,
    MessageFlags, MessagePayload
} from "discord.js";

import { readFileSync } from 'fs';
import { join } from 'path';

const packageJson = JSON.parse(readFileSync(join(__dirname, '../../../../package.json'), 'utf8'));
const version = packageJson.version;

export const SUCCESS_COLOR = 0x32a852;
export const ERROR_COLOR = 0xab4b3c;
export const THEME_COLOR = 0x772ce8;

enum ReplyType {
    INFO,
    SUCCESS,
    ERROR,
}

export function createBaseEmbed(guild: Guild = null, color: number = THEME_COLOR) {
    const iconURL = guild?.iconURL() ?? "https://cdn.twijn.net/voicetwine/images/icon/1-64x64.png";
    return new EmbedBuilder()
        .setColor(color)
        .setFooter({
            iconURL: iconURL,
            text: `${guild?.name ? `${guild.name} • ` : ''}The Mod Squad v${version}`,
        });
}

export type TwineInteraction = {
    reply: (message: InteractionReplyOptions) => Promise<Message>;
    editReply: (message: string|MessagePayload|InteractionEditReplyOptions) => Promise<InteractionResponse|Message>;
    deferred: boolean;
    deferReply: (options?: InteractionDeferReplyOptions) => Promise<InteractionCallbackResponse>;
    guild: Guild;
}

export class ReplyManager<T extends TwineInteraction> {
    private readonly interaction: T;

    private repliedWith: ReplyType = null;

    private createMessageData(title: string, messageText: string, color: number) {
        return {
            embeds: [
                createBaseEmbed(this.interaction.guild, color)
                    .setTitle(title)
                    .setDescription(messageText),
            ],
            flags: MessageFlags.Ephemeral,
        };
    }

    private reply(title: string, messageText: string, color: number): Promise<InteractionResponse|Message> {
        if (this.interaction.deferred) {
            return this.interaction.editReply(this.createMessageData(title, messageText, color) as InteractionEditReplyOptions);
        } else {
            return this.interaction.reply(this.createMessageData(title, messageText, color) as InteractionReplyOptions);
        }
    }

    constructor(interaction: T) {
        this.interaction = interaction;
    }

    defer(ephemeral: boolean = true) {
        if (ephemeral) {
            return this.interaction.deferReply({
                flags: MessageFlags.Ephemeral,
            });
        } else {
            return this.interaction.deferReply();
        }
    }

    edit(messageText: string, title?: string): Promise<InteractionResponse|Message> {
        let color = THEME_COLOR;

        switch (this.repliedWith) {
            case ReplyType.SUCCESS:
                title = "Success!";
                color = SUCCESS_COLOR;
                break;
            case ReplyType.ERROR:
                title = "Error!";
                color = ERROR_COLOR;
                break;
            default:
                if (!title) {
                    title = "Information";
                }
        }

        return this.interaction.editReply(this.createMessageData(title, messageText, color) as InteractionEditReplyOptions);
    }

    success(messageText: string): Promise<InteractionResponse|Message> {
        this.repliedWith = ReplyType.SUCCESS;
        return this.reply("Success!", messageText, SUCCESS_COLOR);
    }

    error(messageText: string): Promise<InteractionResponse|Message> {
        this.repliedWith = ReplyType.ERROR;
        return this.reply("Error", messageText, ERROR_COLOR);
    }

    info(messageText: string, title?: string): Promise<InteractionResponse|Message> {
        if (!title) title = "Information";
        this.repliedWith = ReplyType.INFO;
        return this.reply(title, messageText, THEME_COLOR);
    }

}
