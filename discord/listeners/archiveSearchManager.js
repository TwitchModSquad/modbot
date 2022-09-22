const {Modal, TextInputComponent, SelectMenuComponent, showModal} = require("discord-modals");
const Discord = require("discord.js");
const api = require("../../api/index");
const config = require("../../config.json");
const con = require("../../database");

let crossbanable = [];
api.Twitch.getUserById(config.twitch.id, false, true).then(tmsUser => {
    tmsUser.refreshStreamers().then(streamers => {
        streamers.forEach(streamer => {
            crossbanable = [
                ...crossbanable,
                streamer.id
            ];
        });
    }).catch(console.error);
}).catch(console.error);

const listener = {
    name: 'crossbanManager',
    eventName: 'interactionCreate',
    eventType: 'on',
    storedCrossBanChannels: [],
    storedCrossBanUser: [],
    async listener (interaction) {
        if (interaction.isSelectMenu() && interaction.component.customId === "archive-search-twitch") {
            
        }
    }
};

module.exports = listener;