const api = require("../../api/");
const fs = require("fs");

const grabFiles = path => fs.readdirSync(path).filter(file => file.endsWith('.js'));

const commandFiles = grabFiles("./overview/commands");
let commands = {};

for (const file of commandFiles) {
    const command = require(`../commands/${file}`);
    commands[command.name.toLowerCase()] = command;
}

const listener = {
    name: "commandListener",
    eventName: "message",
    twitchCommands: commands,
    listener: async (channel, tags, message, self) => {
        if (!message.startsWith("!") || self) return;

        try {
            let splitStr = message.split(" ");
            let commandName = splitStr[0].toLowerCase().replace("!","");

            if (commands.hasOwnProperty(commandName)) {
                const streamer = await api.Twitch.getUserById(tags["room-id"], false, true);
                const chatter = await api.Twitch.getUserById(tags["user-id"], false, true);
                commands[commandName].execute(streamer, chatter, tags, splitStr.splice(1), message);
            }
        } catch (err) {
            api.Logger.warning(err);
        }
    }
};

module.exports = listener;