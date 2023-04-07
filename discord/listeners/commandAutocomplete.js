const api = require("../../api/");

const listener = {
    name: 'commandAutocomplete',
    eventName: 'interactionCreate',
    eventType: 'on',
    listener (interaction) {
        if (interaction.isAutocomplete()) {
            if (interaction.commandName === "command") {
                let subcommand = interaction.options.getSubcommand(true);
                let focused = interaction.options.getFocused(true);

                if (focused) {
                    api.Discord.getUserById(interaction.user.id).then(user => {
                        if (user.identity?.id) {
                            api.getFullIdentity(user.identity.id).then(async identity => {
                                if (focused.name === "streamer") {
                                    let streamerIdentities = await identity.getActiveModeratorChannels();
                                    let streamers = [];
                                    streamerIdentities.forEach(sIdentity => {
                                        streamers = [
                                            ...streamers,
                                            ...sIdentity.modForIdentity.twitchAccounts,
                                        ]
                                    });
    
                                    streamers = streamers
                                        .filter(x => x.login.startsWith(focused.value.toLowerCase()))
                                        .map(x => {return {name: x.display_name, value: x.display_name}});
    
                                    interaction.respond(streamers);
                                } else if (focused.name === "label")  {
                                    let streamer = interaction.options.getString("streamer");

                                    if (streamer) {
                                        try {
                                            streamer = (await api.Twitch.getUserByName(streamer))[0];
                                            let commands = (await api.Twitch.getStreamerCommands(streamer))
                                                .map(x => {return {name: x.command, value: x.command}});
                                            
                                            interaction.respond(commands);
                                        } catch (err) {
                                            api.Logger.warning(err);
                                        }
                                    }
                                }
                            }, api.Logger.warning);
                        } else {
                            api.Logger.warning(user.name + " is not properly linked to TMS");
                        }
                    }, api.Logger.warning);
                }
            }
        }
    }
};

module.exports = listener;