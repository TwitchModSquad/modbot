import {
    getTwitchClient,
    ListenSetting,
    logger,
    RawTwitchUser,
    RawTwitchLive,
    TwitchUser,
    TwitchLive
} from "@modbot/utils";
import {Op} from "sequelize";
import eventManager from "@modbot/utils/dist/managers/events/EventManager";
import {HelixStream} from "@twurple/api";

class LiveManager {

    private members: RawTwitchUser[] = [];
    private liveMembers: string[] = [];

    private async refreshMembers() {
        const members = await TwitchUser.findAll({
            where: {
                listen_setting: {
                    [Op.ne]: ListenSetting.NONE,
                }
            }
        });

        this.members = members.map(x => x.raw());
    }

    private async refreshLiveChannels() {
        logger.debug("Refreshing live channels");
        let currentLivestreams: HelixStream[] = [];
        for (let i = 0; i < this.members.length; i += 100) {
            const memberIdBatch = this.members
                    .slice(i, i + 100)
                    .map(x => x.id);

            const streams = await getTwitchClient().streams.getStreamsByUserIds(memberIdBatch);
            currentLivestreams = [
                ...currentLivestreams,
                ...streams,
            ]
        }
        logger.debug("Found " + currentLivestreams.length + " live channels");

        const live = currentLivestreams.filter(x => !this.liveMembers.includes(x.userId));
        const offline = this.liveMembers.filter(x => !currentLivestreams.find(y => x === y.userId));

        this.liveMembers = currentLivestreams.map(x => x.userId);

        let activityRecords: RawTwitchLive[] = [];
        for (const stream of currentLivestreams) {
            const twitchLive = await TwitchLive.create({
                livestreamId: stream.id,
                userId: stream.userId,
                gameId: stream.gameId,
                title: stream.title,
                viewers: stream.viewers,
                isMature: stream.isMature,
                startedAt: stream.startDate,
                thumbnailUrl: stream.thumbnailUrl,
            });
            activityRecords.push(twitchLive.raw());
        }

        for (const stream of live) {
            const activity = activityRecords.find(x => x.livestreamId === stream.id);
            logger.info(`${stream.userDisplayName} is now live!`);
            await eventManager.publish("twitch:live", activity);
        }

        for (const id of offline) {
            logger.info(`${id} is no longer live!`);
            await eventManager.publish("twitch:offline", id);
        }
    }

    constructor() {
        this.refreshMembers().catch(e => logger.error(e));

        setInterval(() => {
            this.refreshLiveChannels().catch(e => logger.error(e));
        }, 2 * 60_000);

        setTimeout(() => {
            this.refreshLiveChannels().catch(e => logger.error(e));
        }, 10_000);

        eventManager.register("twitch:join", (user) => {
            if (!this.members.find(x => x.id === user.id)) {
                this.members.push(user);
            }
        });

        eventManager.register("twitch:part", (user) => {
            this.members = this.members.filter(x => x.id !== user.id);
        });
    }

}

export const liveManager = new LiveManager();
