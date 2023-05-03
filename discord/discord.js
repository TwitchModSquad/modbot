const fs = require('fs');
const Discord = require('discord.js');

const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MEMBERS, Discord.Intents.FLAGS.GUILD_MESSAGES] });
global.client.discord = client;

const discordModals = require('discord-modals');
discordModals(client);

client.commands = new Discord.Collection();
client.listeners = new Discord.Collection();

const config = require("../config.json");

const grabFiles = path => fs.readdirSync(path).filter(file => file.endsWith('.js'));

const commandFiles = grabFiles('./discord/commands');
const listenerFiles = grabFiles('./discord/listeners');

// process command files
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

// process listener files
for (const file of listenerFiles) {
    const listener = require(`./listeners/${file}`);
    client.listeners.set(listener.name, listener);
}

// Register listeners.
client.listeners.forEach(listener => {
    client[listener.eventType](listener.eventName, listener.listener);
});

client.login(config.discord.token);

// Register slash commands.
require("./slashCommands")(client);

setTimeout(() => {
    // require("./interval/crossban")(client);
}, 500);

module.exports = client;