import SlashCommandModals from "./modal/SlashCommandModals";
import {InteractionListener} from "../../interfaces";

export const slashCommandModals = new SlashCommandModals();

export const interactionListeners: InteractionListener<any>[] = [
    slashCommandModals,
];
