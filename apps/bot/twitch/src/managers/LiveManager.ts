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
    private liveStreams: RawTwitchLive[] = [];

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

    private async getLivestreams(): Promise<HelixStream[]> {
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
        return currentLivestreams;
    }

    private async refreshLiveChannels(currentLivestreams: HelixStream[] = null) {
        if (!currentLivestreams) {
            logger.debug("Refreshing live channels");
            currentLivestreams = await this.getLivestreams();
        }
        logger.debug("Found " + currentLivestreams.length + " live channels");

        const live = currentLivestreams.filter(x => !this.liveMembers.includes(x.userId));
        const offline = this.liveMembers.filter(x => !currentLivestreams.find(y => x === y.userId));
        const stillActive = currentLivestreams.filter(x => this.liveMembers.includes(x.userId));

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

        this.liveStreams = activityRecords;

        for (const stream of live) {
            const activity = activityRecords.find(x => x.livestreamId === stream.id);
            logger.info(`${stream.userDisplayName} is now live!`);
            await eventManager.publish("twitch:live", activity);
        }

        for (const id of offline) {
            logger.info(`${id} is no longer live!`);
            await eventManager.publish("twitch:offline", id);
        }

        for (const stream of stillActive) {
            const activity = activityRecords.find(x => x.livestreamId === stream.id);
            if (activity) {
                await eventManager.publish("twitch:live-update", activity);
            } else {
                logger.warn(`Found a still active stream that isn't in the database: ${stream.userDisplayName} (${stream.id})`);
            }
        }
    }

    private async loadLiveChannels() {
        const livestreams = await this.getLivestreams();

        // get all twitch live queries within the last 10 minutes
        const liveActivity = await TwitchLive.findAll({
            where: {
                [Op.or]: [
                    {
                        queryAt: {
                            [Op.gte]: new Date(Date.now() - (10 * 60_000)),
                        }
                    },
                    {
                        livestreamId: {
                            [Op.in]: livestreams.map(x => x.id),
                        },
                    },
                ],
            },
        });

        logger.info(`Loaded ${liveActivity.length} recent live queries`);

        // insert each user ID into liveMembers
        for (const live of liveActivity) {
            if (!this.liveMembers.includes(live.userId)) {
                this.liveMembers.push(live.userId);
            }
        }

        logger.info(`Added ${this.liveMembers} active live channels`);

        await this.refreshLiveChannels(livestreams);
    }

    constructor() {
        this.refreshMembers().catch(e => logger.error(e));

        setInterval(() => {
            this.refreshLiveChannels().catch(e => logger.error(e));
        }, 2 * 60_000);

        setTimeout(() => {
            this.loadLiveChannels().catch(e => logger.error(e));
        }, 10_000);

        eventManager.register("twitch:join", (user) => {
            if (!this.members.find(x => x.id === user.id)) {
                this.members.push(user);
            }
        });

        eventManager.register("twitch:part", (user) => {
            this.members = this.members.filter(x => x.id !== user.id);
        });

        eventManager.register("twitch:live-now", () => {
            return this.liveStreams;
        });
    }

}

export const liveManager = new LiveManager();
