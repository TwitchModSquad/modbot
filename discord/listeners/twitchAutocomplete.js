const client = global.client.mbm;
const con = require("../../database");

const listener = {
    name: 'twitchAutocomplete',
    eventName: 'interactionCreate',
    eventType: 'on',
    listener (interaction) {
        if (interaction.isAutocomplete()) {
            if (interaction.commandName === "archive" || interaction.commandName === "mention") {
                let focused = interaction.options.getFocused(true);

                if (focused) {
                    if (focused.name.startsWith("streamer") || focused.name.startsWith("twitch")) {
                        if (focused.value.length < 2) return;
                        
                        con.query("select display_name from twitch__user where display_name like ? order by id asc limit 25;", [focused.value.replace(/[%\.]/g, "") + "%"], (err, res) => {
                            if (err) {
                                global.api.Logger.warning(err);
                                return;
                            }

                            let result = [];

                            res.forEach(user => {
                                result = [
                                    ...result,
                                    {name: user.display_name, value: user.display_name}
                                ]
                            });

                            interaction.respond(result).catch(global.api.Logger.severe);
                        });
                    }
                }
            }
        }
    }
};

module.exports = listener;