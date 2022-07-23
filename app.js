global.client = {};

global.app_dir = __dirname;

// Load Discord Module
require("./discord/discord");

// Load Discord ModBot Mobile module
require("./mbm/mbm");

// Load Twitch Module
require("./twitch/twitch");

// Load Express Backend
require("./backend/express");

// Load global intervals
const updateUsers = require("./interval/updateUsers");
const updateTwitchUsernames = require("./interval/updateTwitchUsernames");
const updateDiscordUsernames = require("./interval/updateDiscordUsernames");
const updateLiveChannels = require("./interval/updateLiveChannels");
const updateEntryUsernames = require("./interval/updateEntryUsernames");

updateUsers();
updateTwitchUsernames();
updateDiscordUsernames();
updateEntryUsernames();

setInterval(updateUsers, 10000);
setInterval(updateTwitchUsernames, 60000);
setInterval(updateDiscordUsernames, 60000);
setInterval(updateLiveChannels, 15000);
setInterval(updateEntryUsernames, 15000);