const api = require("../../api/");
const fs = require("fs");

const grabFiles = path => fs.readdirSync(path).filter(file => file.endsWith('.js'));

const commandFiles = grabFiles("./twitch/commands");
let globalCommands = {};

for (const file of commandFiles) {
    const command = require(`../commands/${file}`);
    globalCommands[command.name.toLowerCase()] = command;
}

global.twitchCommands = globalCommands;

const listener = {
    name: "commandListener",
    eventName: "message",
    twitchCommands: globalCommands,
    listener: async (streamer, chatter, tags, message, self) => {
        if (self) return;

        try {
            let commands = await api.Twitch.getStreamerCommands(streamer);

            let splitStr = message.split(" ");
            let commandName = splitStr[0].toLowerCase();

            let foundCommand = commands.find(x => x.command === commandName);
            if (foundCommand && globalCommands.hasOwnProperty(foundCommand.referencedCommand.toLowerCase()))
                globalCommands[foundCommand.referencedCommand.toLowerCase()].execute(streamer, chatter, tags, commandName, splitStr.splice(1), message);
        } catch (err) {
            api.Logger.warning(err);
        }
    }
};

module.exports = listener;