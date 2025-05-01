import {ModalSubmitInteraction} from "discord.js";
import {ReplyManager} from "../../classes";

export type SlashCommandModalListener = (interaction: ModalSubmitInteraction, replyManager: ReplyManager<ModalSubmitInteraction>) => Promise<void>;
