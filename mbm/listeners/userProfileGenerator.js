const {MessageEmbed} = require("discord.js");
const api = require("../../api/index");

const config = require("../../config.json");

const identityRegex = /(?<=-i:)\d+/gi;
const discordRegex = /(?<=-d:)\d+/gi;
const twitchRegex = /(?<=-t:)\w+/gi;

const notFoundEmbed = query => {
    return new MessageEmbed()
            .setTitle("User not found!")
            .setDescription("User was not found with the following query: `"+query+"`")
            .setColor(0x772ce8);
}

const process = async (message, regex, type) => {
    let match = message.content.match(regex);
    
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

        if (embeds.length > 0)
            message.reply({content: ' ', embeds: embeds});

        if (errorEmbeds.length > 0)
            message.member.send({content: ' ', embeds: errorEmbeds}).then(() => {}, err => {});
    }
}

const listener = {
    name: 'userProfileGenerator',
    eventName: 'messageCreate',
    eventType: 'on',
    listener (message) {
        if (message.guild.id !== config.modsquad_discord) return;


        if (message.content.toLowerCase().indexOf("-i:") !== -1) {
            process(message, identityRegex, "identity");
        } else if (message.content.toLowerCase().indexOf("-d:") !== -1) {
            process(message, discordRegex, "discord");
        } else if (message.content.toLowerCase().indexOf("-t:") !== -1) {
            process(message, twitchRegex, "twitch");
        }
    }
};

module.exports = listener;