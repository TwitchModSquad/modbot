import {ReplyManager, TwineInteraction} from "../../classes";

export enum InteractionListenerType {
    BUTTON,
    STRING_SELECT_MENU,
    MODAL,
}

export interface InteractionListener<T extends TwineInteraction> {
    type: InteractionListenerType;
    matches(interaction: T): boolean;
    execute(interaction: T, replyManager: ReplyManager<T>): Promise<void>;
}
