const tmi = require('tmi.js');
const fs = require('fs');
const api = require('../api/');
const config = require("../config.json");

const grabFiles = path => fs.readdirSync(path).filter(file => file.endsWith('.js'));

const listenerFiles = grabFiles('./overview/listeners');

const client = new tmi.Client({
    options: {
        skipMembership: true,
        debug: true,
    },
    connection: { reconnect: true },
    channels: ["twitchmodsquad"],
    identity: {
        username: config.twitch.username,
        password: config.twitch.oauth,
    },
});

for (const file of listenerFiles) {
    const listener = require(`./listeners/${file}`);

    client.on(listener.eventName, listener.listener);
}

client.connect();

global.client.overview = client;
