const {EmbedBuilder, Message} = require("discord.js");
const api = require("../../api/index");

const config = require("../../config.json");

const identityRegex = /(?<=-i:)\d+/gi;
const discordRegex = /(?<=-d:)\d+/gi;
const twitchRegex = /(?<=-t:)\w+/gi;

const notFoundEmbed = query => {
    return new EmbedBuilder()
            .setTitle("User not found!")
            .setDescription("User was not found with the following query: `"+query+"`")
            .setColor(0x772ce8);
}

const process = async (content, regex, type) => {
    let match = content.match(regex);
    
    if (match.length > 0) {
        let embeds = [];
        let errorEmbeds = [];

        for (let i = 0; i < match.length; i++) {
            try {
                let obj;
                if (type === "identity") {
                    obj = [await (await api.getFullIdentity(match[i])).discordEmbed()];
                } else if (type === "twitch") {
                    obj = await api.Twitch.getUserByName(match[i], true);
                    for (let oi = 0; oi < obj.length; oi++) {
                        obj[oi] = await obj[oi].discordEmbed();
                    }
                    if (obj.length === 0) continue;
                } else if (type === "discord") {
                    obj = [await (await api.Discord.getUserById(match[i], false, true)).discordEmbed()];
                }
                embeds = [
                    ...embeds,
                    ...obj,
                ];
            } catch (err) {
                global.api.Logger.warning(err);
                errorEmbeds = [
                    ...embeds,
                    notFoundEmbed(match[i])
                ];
            }
        }

        return {
            embeds: embeds,
            errorEmbeds: errorEmbeds
        };
    }

    return {
        embeds: [],
        errorEmbeds: []
    };
}

const listener = {
    name: 'userProfileGenerator',
    eventName: 'messageCreate',
    eventType: 'on',
    /**
     * Function for this listener
     * @param {Message} message 
     */
    async listener (message) {
        const content = message.content.toLowerCase();
        if (!(content.includes("-i:") || content.includes("-d:") || content.includes("-t:"))) return;

        let embeds = [];
        let errorEmbeds = [];

        if (content.indexOf("-i:") !== -1) {
            const result = await process(content, identityRegex, "identity");
            embeds = [
                ...embeds,
                ...result.embeds,
            ];
            errorEmbeds = [
                ...errorEmbeds,
                ...result.errorEmbeds,
            ];
        }
        if (content.indexOf("-d:") !== -1) {
            const result = await process(content, discordRegex, "discord");
            embeds = [
                ...embeds,
                ...result.embeds,
            ];
            errorEmbeds = [
                ...errorEmbeds,
                ...result.errorEmbeds,
            ];
        }
        if (content.indexOf("-t:") !== -1) {
            const result = await process(content, twitchRegex, "twitch");
            embeds = [
                ...embeds,
                ...result.embeds,
            ];
            errorEmbeds = [
                ...errorEmbeds,
                ...result.errorEmbeds,
            ];
        }

        if (embeds.length > 0)
            message.reply({embeds: embeds});

        if (errorEmbeds.length > 0)
            message.member.send({embeds: errorEmbeds}).then(() => {}, err => {});
    }
};

module.exports = listener;