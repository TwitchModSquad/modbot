global.client = {};

global.app_dir = __dirname;

// Load Discord Module
require("./discord/discord");

// Load Discord ModBot Mobile module
require("./mbm/mbm");

// Load Twitch Module
require("./twitch/twitch");

// Load Express Web Server
require("./web/express");

// Load global intervals
const updateChatIndexes = require("./interval/updateChatIndexs");
const updateUsers = require("./interval/updateUsers");
const updateTwitchUsernames = require("./interval/updateTwitchUsernames");
const updateDiscordUsernames = require("./interval/updateDiscordUsernames");
const updateLiveChannels = require("./interval/updateLiveChannels");
const updateEntryUsernames = require("./interval/updateEntryUsernames");

const SECONDS_TO_MILLISECONDS = 1000;
const MINUTES_TO_MILLISECONDS = 60 * SECONDS_TO_MILLISECONDS;
const   HOURS_TO_MILLISECONDS = 60 * MINUTES_TO_MILLISECONDS;

updateChatIndexes();
updateUsers();
updateTwitchUsernames();
updateDiscordUsernames();
setTimeout(updateEntryUsernames, 5000);

setInterval(updateChatIndexes, 15 * MINUTES_TO_MILLISECONDS); // 15 minutes
setInterval(updateUsers, 10 * SECONDS_TO_MILLISECONDS); // 10 seconds
setInterval(updateTwitchUsernames, 1 * MINUTES_TO_MILLISECONDS);
setInterval(updateDiscordUsernames, 1 * MINUTES_TO_MILLISECONDS);
setInterval(updateLiveChannels, 15 * SECONDS_TO_MILLISECONDS);
setInterval(updateEntryUsernames, 3 * HOURS_TO_MILLISECONDS);