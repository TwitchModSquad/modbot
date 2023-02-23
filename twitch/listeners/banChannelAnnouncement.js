const con = require("../../database");
const api = require("../../api");
const config = require("../../config.json");

const formatting = require("../Formatting");

const Discord = require("discord.js");
const { ButtonStyle } = require("discord.js");

const BPM_ANNOUNCE_MAXIMUM = 5;

const listener = {
    name: "banChannelAnnouncement",
    eventName: "ban",
    listener: async (streamer, chatter, timebanned, userstate, bpm) => {
        if (bpm < BPM_ANNOUNCE_MAXIMUM) {
            if (config.hasOwnProperty("liveban_channel")) {
                let dchnl = global.modSquadGuild.channels.cache.find(dchnl => dchnl.id == config.liveban_channel);
    
                if (dchnl.isText()) {
                    try {
                        const embed = await formatting.parseBanEmbed(streamer, chatter, bpm, timebanned);

                        const crossbanButton = new Discord.ButtonBuilder()
                                .setCustomId("cb-" + chatter.id)
                                .setLabel("Crossban")
                                .setStyle(ButtonStyle.Danger);
                
                        const hideButton = new Discord.ButtonBuilder()
                                .setCustomId("hide-ban")
                                .setLabel("Hide Ban")
                                .setStyle(ButtonStyle.Secondary);
                        
                        const row = new Discord.ActionRowBuilder()
                                .addComponents(crossbanButton, hideButton);

                        dchnl.send({embeds: [embed], components: [row]}).then(message => {
                            con.query("update twitch__ban set discord_message = ? where timebanned = ? and streamer_id = ? and user_id = ?;", [
                                message.id,
                                timebanned,
                                streamer.id,
                                chatter.id,
                            ]);
                        }).catch(api.Logger.warning);
                    } catch (err) {
                        api.Logger.severe(err);
                    }
                }
            }
        }
    }
};

module.exports = listener;