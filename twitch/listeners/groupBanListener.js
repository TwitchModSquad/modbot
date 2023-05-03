const api = require("../../api");

const formatting = require("../Formatting");

const Discord = require("discord.js");

const listener = {
    name: "groupBanListener",
    eventName: "ban",
    listener: async (streamer, chatter, timebanned, userstate, bpm) => {
        let groups = [];

        api.Group.getActiveGroups().forEach(group => {
            group.participants.forEach(participant => {
                if (participant.id === streamer.id
                    && !groups.find(x => x.id === group.id)) {
                    groups = [
                        ...groups,
                        group,
                    ]
                }
            });
        });

        groups.forEach(group => {
            group.getThread().then(async thread => {
                try {
                    const embed = await formatting.parseBanEmbed(streamer, chatter, bpm, timebanned);

                    const crossbanButton = new Discord.MessageButton()
                            .setCustomId("cb-" + chatter.id)
                            .setLabel("Crossban")
                            .setStyle("DANGER");
                    
                    const row = new Discord.MessageActionRow()
                            .addComponents(crossbanButton);

                    thread.send({content: '@here', embeds: [embed], components: [row]}).catch(api.Logger.warning);
                } catch (err) {
                    api.Logger.severe(err);
                }
            }, api.Logger.warning);
        });
    }
};

module.exports = listener;