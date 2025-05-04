import {EventSubWsListener} from "@twurple/eventsub-ws";
import {authProvider, AutoModResult, getTwitchClient, TwitchChat, TwitchUser, twitchUsers} from "@modbot/utils";
import {chatManager} from "../managers";

export let eventSubClient: EventSubWsListener;

export default async (members: TwitchUser[]) => {
    eventSubClient = new EventSubWsListener({
        apiClient: getTwitchClient(),
    });

    for (const member of members) {
        const modToken = await authProvider.getAccessTokenForIntent(`mod:${member.id}`);

        if (modToken) {
            eventSubClient.onAutoModMessageHold(member.id, modToken.userId, async event => {
                const chatter = await twitchUsers.get(event.userId, true);
                if (!chatter) return;

                await chatManager.logMessage({
                    id: event.messageId,
                    message: event.messageText,
                    chatterId: event.userId,
                    streamerId: event.broadcasterId,
                    automod_level: event.level,
                });
            });

            eventSubClient.onAutoModMessageUpdate(member.id, modToken.userId, async event => {
                const chatter = await twitchUsers.get(event.userId, true);
                if (!chatter) return;

                const message = await TwitchChat.findByPk(event.messageId);
                if (!message) return;

                let status: AutoModResult;
                switch (event.status) {
                    case "approved":
                        status = AutoModResult.APPROVED;
                        break;
                    case "denied":
                        status = AutoModResult.DENIED;
                        break;
                    default:
                        status = AutoModResult.EXPIRED;
                        break;
                }

                message.automod_result = status;
                await message.save();
            })
        }
    }

    eventSubClient.start();
}
