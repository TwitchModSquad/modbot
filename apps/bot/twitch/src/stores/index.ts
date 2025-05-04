import banStore from "./BanStore";
import timeoutStore from "./TimeoutStore";
import {logger, TwitchBan, TwitchTimeout} from "@modbot/utils";

export {default as banStore} from "./BanStore";
export {default as timeoutStore} from "./TimeoutStore";

export const removePunishment = async (streamerId: string, chatterId: string): Promise<void> => {
    const punishments: (TwitchBan|TwitchTimeout)[] = [
        ...banStore.getFromStream(streamerId, chatterId),
        ...timeoutStore.getFromStream(streamerId, chatterId),
    ];

    for (const punishment of punishments) {
        if (!punishment.endTime || punishment.endTime.getTime() > Date.now()) {
            punishment.endTime = new Date();
            await punishment.save();
            logger.info(`Expired punishment from ${streamerId}:${chatterId}`);
        }
    }
}
