const api = require("../../api");
const Discord = require("discord.js");
const config = require("../../config.json");

const PART_THRESHOLD = 30; // bans/min
const PART_TIME = 15;     // minutes

const listener = {
    name: "banPartListener",
    eventName: "ban",
    listener: async (streamer, chatter, timebanned, userstate, bpm) => {
        if (bpm > PART_THRESHOLD) {
            if (config.hasOwnProperty("liveban_channel")) {
                let dchnl = global.modSquadGuild.channels.cache.find(dchnl => dchnl.id == config.liveban_channel);
    
                if (dchnl.isText()) {
                    const embed = new Discord.MessageEmbed()
                            // Set the title of the field
                            .setTitle(`Bot Action Detected`)
                            // Set the description of the field
                            .setDescription(`Channel \`${streamer.display_name}\` appears to be handling a bot attack. Channel has had \`${bpm}\` bans in the last minute, this exceeds the limit of \`${PART_THRESHOLD}\`.\nThe bot will part from the channel for \`${PART_TIME} minutes\`.`)
                            // Set the color of the embed
                            .setColor(0x8c1212);
    
                    dchnl.send({content: ' ', embeds: [embed]});
                }
            }

            api.Logger.warning(`Parting from channel ${streamer.display_name} for exceeding BPM threshold of ${PART_THRESHOLD}`);
            global.partFromChannel(streamer.display_name.toLowerCase());

            setTimeout(() => {
                global.listenOnChannel(streamer.display_name.toLowerCase());
            }, PART_TIME * 60 * 1000);
        }
    }
};

module.exports = listener;