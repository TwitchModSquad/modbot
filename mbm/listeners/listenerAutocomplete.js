const { AutocompleteInteraction } = require("discord.js");
const api = require("../../api/");

const listenerCommand = require("../commands/listener");

const listener = {
    name: 'listenerAutocomplete',
    eventName: 'interactionCreate',
    eventType: 'on',
    /**
     * 
     * @param {AutocompleteInteraction} interaction 
     */
    listener (interaction) {
        if (interaction.isAutocomplete()) {
            if (interaction.commandName === "listener" && interaction.options.getSubcommand() === "delete") {
                let focused = interaction.options.getFocused(true);

                if (focused) {
                    if (focused.name === "listener") {
                        api.Discord.getGuild(interaction.guild.id).then(guild => {
                            let listeners = guild.listeners.filter(x => x.channel.id === interaction.channelId);

                            interaction.respond(listeners.map(x => {
                                return {
                                    name: listenerCommand.listeners[x.event].name,
                                    value: String(x.id),
                                };
                            }));
                        }, err => {
                            api.Logger.warning(err);
                        });
                    }
                }
            }
        }
    }
};

module.exports = listener;