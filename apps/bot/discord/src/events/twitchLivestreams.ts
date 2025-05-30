import {createLiveMessageComponent, events, logger, twitchUsers, DiscordMessage} from "@modbot/utils";
import {discordChannelManager} from "../managers";
import client from "../app";
import {EmbedBuilder, MessageEditOptions} from "discord.js";

events.register("twitch:live", async live => {
    const channels = await discordChannelManager.getChannelsFor("twitchLiveStartSettings", live.userId);

    if (channels.length === 0) return;

    const messageComponent = await createLiveMessageComponent(live);
    for (const channel of channels) {
        try {
            const message = await channel.discord.send(messageComponent);
            await DiscordMessage.create({
                id: message.id,
                channelId: message.channelId,
                twitchLiveUserId: live.userId,
                twitchLiveActive: true,
            });
        } catch(err) {
            logger.error("Error sending message in channel " + channel.discord.name + ":")
            logger.error(err);
        }
    }
});

events.register("twitch:live-update", async live => {
    const messages = await DiscordMessage.findAll({
        where: {
            twitchLiveUserId: live.userId,
            twitchLiveActive: true,
        },
    });

    if (messages.length === 0) return;

    const messageComponent = await createLiveMessageComponent(live);
    for (const message of messages) {
        try {
            const channel = await client.channels.fetch(message.channelId);
            if (channel && channel.isTextBased()) {
                const discordMessage = await channel.messages.fetch(message.id);
                if (discordMessage && discordMessage.editable) {
                    await discordMessage.edit(messageComponent as MessageEditOptions);
                }
            }
        } catch(err) {
            logger.error(`Failed to update message ${message.id}:`);
            logger.error(err);
        }
    }
});

events.register("twitch:offline", async userId => {
    const messages = await DiscordMessage.findAll({
        where: {
            twitchLiveUserId: userId,
            twitchLiveActive: true,
        }
    });

    if (messages.length === 0) return;

    const streamer = await twitchUsers.get(userId);

    if (!streamer) return;

    const offlineEmbed = new EmbedBuilder()
        .setAuthor({
            iconURL: streamer.profile_image_url,
            name: streamer.display_name,
        })
        .setTitle("Stream Offline!")
        .setTimestamp(new Date())
        .setFooter({
            text: "The Mod Squad",
            iconURL: "https://cdn.modsquad.tools/assets/images/logo.webp",
        });

    for (const message of messages) {
        try {
            const channel = await client.channels.fetch(message.channelId);
            if (channel && channel.isTextBased()) {
                const discordMessage = await channel.messages.fetch(message.id);
                if (discordMessage && discordMessage.editable) {
                    await discordMessage.edit({
                        embeds: [offlineEmbed],
                        components: [],
                    });
                }
            }
        } catch(err) {
            logger.error(`Failed to update message ${message.id}:`);
            logger.error(err);
        }
    }
});
