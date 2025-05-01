import {InteractionListener, InteractionListenerType} from "../../../interfaces";
import {ModalSubmitInteraction} from "discord.js";
import {ReplyManager} from "../../../classes";
import {SlashCommandModalListener} from "../../../interfaces";

export default class SlashCommandModals implements InteractionListener<ModalSubmitInteraction> {
    public type = InteractionListenerType.MODAL;

    private modals = new Map<string, SlashCommandModalListener>();

    public matches(interaction: ModalSubmitInteraction): boolean {
        return this.modals.has(interaction.customId);
    }

    public async execute(interaction: ModalSubmitInteraction, replyManager: ReplyManager<ModalSubmitInteraction>): Promise<void> {
        if (this.modals.has(interaction.customId)) {
            await this.modals.get(interaction.customId)(interaction, replyManager);
        } else {
            // This should never happen due to matches(), but just in case!
            await replyManager.error("Couldn't find a slash command modal with that ID!");
        }
    }

    public register(customId: string, callback: SlashCommandModalListener) {
        this.modals.set(customId, callback);
    }

}
