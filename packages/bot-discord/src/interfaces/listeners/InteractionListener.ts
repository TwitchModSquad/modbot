import {ReplyManager, TwineInteraction} from "../../classes";

export enum InteractionListenerType {
    BUTTON,
    SELECT_MENU,
}

export interface InteractionListener<T extends TwineInteraction> {
    type: InteractionListenerType;
    matches(interaction: T): boolean;
    execute(interaction: T, replyManager: ReplyManager<T>): Promise<void>;
}
