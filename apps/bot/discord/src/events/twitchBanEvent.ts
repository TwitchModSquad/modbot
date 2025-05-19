import eventManager from "@modbot/utils/dist/managers/events/EventManager";
import {discordChannelManager} from "../managers";
import {createBanEmbed} from "@modbot/utils";

const BPM_LIMIT = 10;

interface BPMObject {
    streamerId: string;
    time: number;
}

let bpmTable: BPMObject[] = [];

eventManager.register("twitch:ban", async ban => {
    bpmTable = bpmTable.filter(x => x.time + (60 * 1000) > Date.now());
    const channelBpm = bpmTable.filter(x => x.streamerId === ban.streamerId).length;
    if (channelBpm >= BPM_LIMIT) return;

    const embed = await createBanEmbed(ban);

    const channels = await discordChannelManager.getChannelsFor("twitchBanSettings", ban.streamerId);

    for (const channel of channels) {
        await channel.discord.send({embeds: [embed]});
    }
});
