const fs = require('fs');
const Discord = require('discord.js');

// Create a new Discord client using discord.js
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MEMBERS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_BANS] });
global.client.mbm = client;

// Client scope command and listener caches
client.commands = new Discord.Collection();
client.listeners = new Discord.Collection();

// Load application config file
const config = require("../config.json");

/** 
 * @param {String} path - Relative path to the file to be loaded
 * @returns JS files that satisfy the path query
 */
const grabFiles = path => fs.readdirSync(path).filter(file => file.endsWith('.js'));

const commandFiles = grabFiles('./mbm/commands');
const listenerFiles = grabFiles('./mbm/listeners');

// Process command files
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

// Process listener files
for (const file of listenerFiles) {
    const listener = require(`./listeners/${file}`);
    client.listeners.set(listener.name, listener);
}

// Register listeners.
client.listeners.forEach(listener => {
    client[listener.eventType](listener.eventName, listener.listener);
});

client.login(config.mbm.token);

// Register slash commands.
require("./slashCommands")();

module.exports = client;