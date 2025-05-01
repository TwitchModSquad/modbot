import {
    ChatInputCommandInteraction,
    ModalBuilder,
    SlashCommandSubcommandBuilder,
} from "discord.js";
import {ReplyManager} from "../../../classes";
import {SlashCommandModalListener, TwineSubcommand} from "../../../interfaces";
import {logger} from "@modbot/utils";
import {slashCommandModals} from "../../../listeners";
import TwitchUserListBind from "./TwitchUserListBind";

export interface BindModalStore {
    value: string;
    name: string;
    modal: ModalBuilder|((interaction: ChatInputCommandInteraction|null) => Promise<ModalBuilder>);
    execute: SlashCommandModalListener;
}

export default class BindSubcommand implements TwineSubcommand {

    public modals: BindModalStore[] = [
        new TwitchUserListBind(
            "Twitch Ban",
            "twitchBanSettings",
            "The streamer(s) to announce bans for."),
        new TwitchUserListBind(
            "Twitch Livestream Start",
            "twitchLiveStartSettings",
            "The streamer(s) to announce livestreams for."),
    ];

    public data: SlashCommandSubcommandBuilder = new SlashCommandSubcommandBuilder()
        .setName("bind")
        .setDescription("Bind an event to your current channel")
        .addStringOption(option => option
            .setName("event")
            .setDescription("The event to bind")
            .setRequired(true)
            .setChoices([
                ...this.modals,
            ])
        );

    private async registerModals() {
        for (const modal of this.modals) {
            if (typeof modal.modal === "function") {
                slashCommandModals.register((await modal.modal(null)).toJSON().custom_id, modal.execute);
            } else {
                slashCommandModals.register(modal.modal.toJSON().custom_id, modal.execute);
            }
        }
    }

    constructor() {
        this.registerModals().catch(e => logger.error(e));
    }

    public async execute(interaction: ChatInputCommandInteraction, replyManager: ReplyManager<ChatInputCommandInteraction>) {
        const eventName = interaction.options.getString("event", true);

        const modalOption = this.modals.find(x => x.value === eventName);
        if (modalOption) {
            let modal: ModalBuilder;
            if (typeof modalOption.modal === "function") {
                modal = await modalOption.modal(interaction);
            } else {
                modal = modalOption.modal;
            }
            await interaction.showModal(modal);
        } else {
            await replyManager.error(`Unknown event name \`${eventName}\`!`);
        }
    }

}