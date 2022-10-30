const CLIENT_MAXIMUM_CHANNELS = 200;
const CHANNEL_CONNECT_INTERVAL = 1000;
const CLIENT_CONNECT_INTERVAL = 10000;

const ACTIVE_CHANNEL_PADDING = 3;

// Load application config file
const config = require("../config.json");

// Load local API module
const api = require("../api/index");

const tmi = require('tmi.js');
const con = require("../database");

const discordClient = require("../discord/discord");
const Discord = require("discord.js");

let nextClient = Date.now();
let clients = [];

let modSquadGuild = null;

let disallowed_channels = ["ludwig", "tarzaned", "flexingseal", "miki", "dirtybird", "alttprandomizer"];

let bannedList = [];
let timeoutList = [];

let bannedPerMinute = {};

let refreshTokens = {};

// Refresh the bans per minute stat for each watched channel every second
setInterval(() => {
    for (const [streamer, timestampList] of Object.entries(bannedPerMinute)) {
        let now = Date.now();
        bannedPerMinute[streamer] = timestampList.filter(ts => now - ts < 60000);
    }
}, 1000);

function resetRefreshTokens() {
    let newTable = {};

    con.query("select id, refresh_token from twitch__user where scopes like '%moderation:read%';", (err, res) => {
        if (!err) {
            res.forEach(row => {
                newTable[row.id] = row.refresh_token;
            });
            refreshTokens = newTable;
        } else api.Logger.warning(err);
    });
}

setInterval(resetRefreshTokens, 60000);
resetRefreshTokens();

// Load a list of bans from the database
con.query("select * from twitch__ban where active = true;", (err, res) => {
    if (err) {
        global.api.Logger.warning(err);
        return;
    }

    res.forEach(log => {
        bannedList = [
            ...bannedList,
            {
                streamer_id: log.streamer_id,
                user_id: log.user_id,
            }
        ]
    });

    global.api.Logger.info("Loaded " + bannedList.length + " bans");
});

// Load a list of timeouts from the database
con.query("select * from twitch__timeout where active = true;", (err, res) => {
    if (err) {
        global.api.Logger.warning(err);
        return;
    }

    res.forEach(log => {
        timeoutList = [
            ...timeoutList,
            {
                streamer_id: log.streamer_id,
                user_id: log.user_id,
            }
        ]
    });

    global.api.Logger.info("Loaded " + timeoutList.length + " t/o's");
});

/**
 * @param {Number} day - 0-6 as a representation of the day of the week (0 = Sunday)
 * @returns {String} The corresponding day of the week as a 3 character String
*/
function parseDay(day) {
    let result = "";

    switch (day) {
        case 0:
            result = "Sun";
            break;
        case 1:
            result = "Mon";
            break;
        case 2:
            result = "Tue";
            break;
        case 3:
            result = "Wed";
            break;
        case 4:
            result = "Thu";
            break;
        case 5:
            result = "Fri";
            break;
        case 6:
            result = "Sat";
    }

    return result;
}

/**
 * 
 * @param { Number | String | Date | undefined } timestamp - The timestamp to parse, if provided, otherwise the current time is parsed
 * @returns {String} The parsed Date in the format MM:DD:YY HH:MM:SS
 */
function parseDate(timestamp) {
    let dte = new Date(timestamp);

    let hr = "" + dte.getHours();
    let mn = "" + dte.getMinutes();
    let sc = "" + dte.getSeconds();

    if (hr.length === 1) hr = "0" + hr;
    if (mn.length === 1) mn = "0" + mn;
    if (sc.length === 1) sc = "0" + sc;

    let mo = "" + (dte.getMonth() + 1);
    let dy = "" + dte.getDate();
    let yr = dte.getFullYear();

    if (mo.length === 1) mo = "0" + mo;
    if (dy.length === 1) dy = "0" + dy;

    return `${parseDay(dte.getDay())} ${mo}.${dy}.${yr} ${hr}:${mn}:${sc}`;
}

// I think reason may be deprecated here, so it may always be null. I'll have to check on that.
/**
 * Add a ban event to the database
 * @param {String} channel - The twitch channel where the user was banned
 * @param {String} userid - The twitch user id to add to the ban list
 * @param {String} username - The twitch username of the offending user
 * @param {String} reason - The reason for the ban
 * @param {Number} timebanned - The timestamp of the ban event as a unix timestamp
 * @returns {void}
 */
const addBan = async (channel, userid, username, reason, timebanned) => {
    let channelStripped = channel.replace("#", "");

    let streamer = (await api.Twitch.getUserByName(channelStripped, true))[0];
    let streamer_id = streamer.id;

    let speaker = (await api.Twitch.getUserByName(username, true))[0];

    if (!bannedPerMinute.hasOwnProperty(channel)) {
        bannedPerMinute[channel] = [];
    }
    bannedPerMinute[channel] = [
        ...bannedPerMinute[channel],
        Date.now()
    ];

    
    /* 
     When a twitch channel hits the BPM rate of 60 or greater, the bot will print a warning message and part 
     from the channel of interest for 15 minutes. On the first instance of a BPM overload of 61, the bot will 
     also send an alert to the mod squad Discord if it can find the liveban text channel.
    */
    if (bannedPerMinute[channel].length > 60) {
        global.api.Logger.info("More than 60 bans per minute in " + channel + ". Parting for 15 minutes.");

        if (bannedPerMinute[channel].length === 61 && config.hasOwnProperty("liveban_channel")) {
            let dchnl = modSquadGuild.channels.cache.find(dchnl => dchnl.id == config.liveban_channel);

            if (dchnl.isText()) {
                const embed = new Discord.MessageEmbed()
                        // Set the title of the field
                        .setTitle(`Bot Action Detected`)
                        // Set the description of the field
                        .setDescription(`Channel \`${channel}\` appears to be handling a bot attack. Channel has had \`${bannedPerMinute[channel].length}\` bans in the last minute, this exceeds the limit of \`60\`.\nThe bot will part from the channel for \`15 minutes\`.`)
                        // Set the color of the embed
                        .setColor(0x8c1212);

                dchnl.send({content: ' ', embeds: [embed]});
            }
        }

        partFromChannel(channelStripped);

        setTimeout(() => {
            listenOnChannel(channelStripped);
        }, 15 * 60 * 1000);

        return;
    }

    /*
     If the BPM rate of the channel of interest is under the BPM cap, the bot will add the ban to the list
     and continue without printing a rate limit message.
    */
    if (bannedPerMinute[channel].length <= 30) {
        try {
            await con.pquery("insert into twitch__ban (timebanned, streamer_id, user_id) values (?, ?, ?);", [
                timebanned,
                streamer_id,
                userid
            ]);
        } catch (err) {
            api.Logger.warning(err);
        }
    
        bannedList = [
            ...bannedList,
            {
                streamer_id: streamer_id,
                user_id: userid,
            }
        ]
    } else {
        global.api.Logger.info(`Not logging ban in ${channel} due to exceeding BPM threshold (${bannedPerMinute[channel].length}>30)`);
    }

    /* 
     If the BPM rate of the channel of interest is healthy (under the BPM cap) and the liveban text channel is 
     found, the bot will send a message detailing the twitch ban information to the liveban text channel.
    */
    if (bannedPerMinute[channel].length <= 5) {
        if (config.hasOwnProperty("liveban_channel")) {
            let dchnl = modSquadGuild.channels.cache.find(dchnl => dchnl.id == config.liveban_channel);

            if (dchnl.isText()) {
                con.query("select twitch__user.display_name, message, deleted, timesent from twitch__chat join twitch__user on twitch__user.id = twitch__chat.user_id where streamer_id = ? and user_id = ? order by timesent desc limit 10;",[
                    streamer_id,
                    userid
                ], async (err, res) => {
                    // Build the skeleton embed for the ban message 
                    const embed = new Discord.MessageEmbed()
                            .setTitle(`User was Banned!`)
                            .setURL(speaker.getShortlink())
                            .setAuthor({name: streamer.display_name, iconURL: streamer.profile_image_url, url: "https://twitch.tv/" + channelStripped})
                            .setDescription(`User \`${username}\` was banned from channel \`${channel}\``)
                            .setColor(0xe83b3b)
                            .setFooter({text: "Bans per Minute: " + bannedPerMinute[channel].length});

                    // Utilize the streamer refresh token to get the ban reason and moderator name
                    if (refreshTokens.hasOwnProperty(streamer_id)) {
                        try {
                            let accessToken = await api.Authentication.Twitch.getAccessToken(refreshTokens[streamer_id]);
                            let bans = await api.Twitch.TwitchAPI.getBans(streamer_id, userid, accessToken);

                            let ban = null;
                            let banDiff = 2500;

                            bans.forEach(cban => {
                                let timeDiff = Math.abs(timebanned - (new Date(cban.created_at)).getTime());
                                if (banDiff > timeDiff) {
                                    ban = cban;
                                    banDiff = timeDiff;
                                }
                            });
                            
                            if (ban) {
                                let moderator = await api.Twitch.getUserById(ban.moderator_id);

                                let reason = "No reason provided";

                                if (ban.reason && ban.reason.length > 0)
                                    reason = ban.reason;

                                embed.addField("Moderator", `\`\`\`${moderator.display_name}\`\`\``, true);
                                embed.addField("Reason", `\`\`\`${reason}\`\`\``, true)
                                
                                con.query("update twitch__ban set moderator_id = ?, reason = ? where timebanned = ? and streamer_id = ? and user_id = ?;", [
                                    moderator.id,
                                    ban.reason,
                                    timebanned,
                                    streamer_id,
                                    userid
                                ]);
                            }
                        } catch (err) {
                            api.Logger.warning(err);
                        }
                    }
                    
                    // If the query returns results, parse the results and add them to the embed.
                    if (typeof(res) === "object") {
                        let logs = "";

                        res = res.reverse();

                        res.forEach(log => {
                            let date = new Date(log.timesent);

                            let hor = date.getHours() + "";
                            let min = date.getMinutes() + "";
                            let sec = date.getSeconds() + "";

                            if (hor.length == 1) hor = "0" + hor;
                            if (min.length == 1) min = "0" + min;
                            if (sec.length == 1) sec = "0" + sec;

                            logs += `\n${hor}:${min}:${sec} [${log.display_name}]: ${log.message}${log.deleted == 1 ? " [❌ deleted]" : ""}`;
                        });

                        if (logs == "") logs = "There are no logs in this channel from this user!";

                        embed.addField(`Chat Log in \`${channel}\``, "```" + logs + "```", false);
                    }

                    const lares = await con.pquery("select streamer.display_name as channel, max(timesent) as lastactive from twitch__chat join twitch__user as streamer on twitch__chat.streamer_id = streamer.id where user_id = ? group by streamer.display_name;", [userid]);

                    let bannedChannels = [];

                    // Get a list of all the channels the user is banned from
                    try {
                        let gbcRes = await con.pquery("select distinct tu.display_name as channel from twitch__ban as tb join twitch__user as tu on tb.streamer_id = tu.id where tb.user_id = ? and active = true;", [userid]);

                        gbcRes.forEach(bc => {
                            bannedChannels = [
                                ...bannedChannels,
                                bc.channel
                            ];
                        });
                    } catch (err) {
                        global.api.Logger.warning(err);
                    }

                    let longestChannelName = 7;
                    let activeChannels = "";

                    // Calculate longest channel name
                    lares.forEach(xchnl => {
                        if (xchnl.channel.length > longestChannelName) longestChannelName = xchnl.channel.length;
                    });

                    bannedChannels.forEach(chnl => {
                        if (chnl.length > longestChannelName) longestChannelName = chnl.length;
                    });

                    // Assemble active channels
                    lares.forEach(xchnl => {
                        activeChannels += "\n" + xchnl.channel + (' '.repeat(Math.max(1, longestChannelName + ACTIVE_CHANNEL_PADDING - xchnl.channel.length))) + parseDate(parseInt(xchnl.lastactive)) + (bannedChannels.includes(xchnl.channel) || xchnl.channel === channel ? ' [❌ banned]' : '');

                        bannedChannels.splice(bannedChannels.indexOf(xchnl.channel), 1);
                    });

                    // Assemble "also banned in" section
                    if (bannedChannels.length > 0) {
                        activeChannels += "\nAlso banned in:";
                    }

                    bannedChannels.forEach(chnl => {
                        activeChannels += "\n" + chnl + (' '.repeat(Math.max(1, longestChannelName + ACTIVE_CHANNEL_PADDING - chnl.length))) + "Never Active" + (' '.repeat(12)) + '[❌ banned]';
                    });

                    // Add the field, if any active channels were found (which should pretty much always be true)
                    if (activeChannels !== "")
                        embed.addField(`Active in Channels:`, `\`\`\`\nChannel${' '.repeat(longestChannelName + ACTIVE_CHANNEL_PADDING - 7)}Last Active${activeChannels}\`\`\``);
                    
                    const crossbanButton = new Discord.MessageButton()
                            .setCustomId("cb-" + speaker.id)
                            .setLabel("Crossban")
                            .setStyle("DANGER");
                    
                    const row = new Discord.MessageActionRow()
                            .addComponents(crossbanButton);

                    dchnl.send({content: ' ', embeds: [embed], components: [row]}).then(message => {
                        con.query("update twitch__ban set discord_message = ? where timebanned = ? and streamer_id = ? and user_id = ?;", [
                            message.id,
                            timebanned,
                            streamer_id,
                            userid
                        ]);
                    }).catch(global.api.Logger.warning);
                });
            }
        }
    } else {
        global.api.Logger.info(`Not notifying of ban in ${channel} due to exceeding BPM threshold (${bannedPerMinute[channel]}>5)`);
    }
}

/**
 * Add a timeout event to the database
 * @param {String} channel - The twitch channel where the user was timed out 
 * @param {String} userid - The twitch user id to add to the timeout list
 * @param {String} username - The twitch username of the offending user
 * @param {String} reason - The reason for the timeout
 * @param {Number} duration - The duration of the timeout
 * @param {Number} timeto - The timestamp of the timeout event as a unix timestamp
*/
const addTimeout = async (channel, userid, username, reason, duration, timeto) => {
    let streamer = (await api.Twitch.getUserByName(channel.replace("#", ""), true))[0];
    let user = (await api.Twitch.getUserByName(username, true))[0];

    con.query("insert into twitch__timeout (streamer_id, user_id, timeto, duration) values (?, ?, ?, ?);", [
        streamer.id,
        userid,
        timeto,
        duration,
    ]);

    timeoutList = [
        ...timeoutList,
        {
            streamer_id: streamer.id,
            user_id: userid,
        }
    ];
}

/**
 * 
 * @param {String} channel - The twitch channel to check for ban records on a user
 * @param {String} userid - The twitch user id of the possibly banned user
 * @returns {Object | null} The ban record if found, null if not
 */
const isBanned = async (channel, userid) => {
    let streamer = (await api.Twitch.getUserByName(channel.replace("#",""), true))[0];
    return bannedList.find(bannedRow => bannedRow.streamer_id === streamer.id && bannedRow.user_id === userid) !== undefined;
}

/**
 * 
 * @param {String} channel - The twitch channel to check for timeout records on a user
 * @param {String} userid - The twitch user id of the possibly timed out user
 * @returns {Object | null} The timeout record if found, null if not
 */
const isTimedOut = async (channel, userid) => {
    let streamer = (await api.Twitch.getUserByName(channel.replace("#",""), true))[0];
    return timeoutList.find(timeoutRow => timeoutRow.streamer_id === streamer.id && timeoutRow.user_id === userid) !== undefined;
}

/**
 * A parent function used to easily call event functions when twitch events are triggered
 * @method message - The twitch message event handler
 * @method messageDeleted - The twitch messageDeleted event handler
 * @method ban - The twitch ban event handler
 * @method timeout - The twitch timeout event handler
 */
const handle = {
    message: async (channel, tags, message, self) => {
        try {
            // Ignore echoed messages.
            if (self) return;
    
            if (tags.hasOwnProperty("message-type") && tags["message-type"] === "whisper") return;

            let streamer = (await api.Twitch.getUserByName(channel.replace("#", ""), true))[0];
            let user = (await api.Twitch.getUserByName(tags.username, true))[0];
    
            con.query("insert into twitch__chat (id, streamer_id, user_id, message, emotes, badges, color, timesent) values (?, ?, ?, ?, ?, ?, ?, ?);", [
                tags.id,
                streamer.id,
                user.id,
                message,
                tags["emotes-raw"],
                tags["badges-raw"],
                tags["color"],
                tags["tmi-sent-ts"],
            ], err => {
                if (err) global.api.Logger.warning(err);
            });
    
            if (await isBanned(channel, tags["user-id"])) {
                global.api.Logger.info("Changing ban active state of " + tags["display-name"]);
    
                con.query("update twitch__ban set active = false where streamer_id = ? and user_id = ?;", [
                    streamer.id,
                    tags["user-id"]
                ]);
    
                bannedList = bannedList.filter(brow => brow.streamer_id !== streamer.id && brow.userid !== tags["user-id"]);
            }
    
            if (await isTimedOut(channel, tags["user-id"])) {
                global.api.Logger.info("Changing timeout active state of " + tags["display-name"]);
    
                con.query("update twitch__timeout set active = false where streamer_id = ? and user_id = ?;", [
                    streamer.id,
                    tags["user-id"]
                ]);
    
                timeoutList = timeoutList.filter(torow => torow.streamer_id !== streamer.id && torow.user_id !== tags["user-id"]);
            }
        } catch (e) {
            global.api.Logger.warning(e);
        }
    },
    messageDeleted: (channel, username, deletedMessage, userstate) => {
        let id = userstate["target-msg-id"];
    
        con.query("update twitch__chat set deleted = true where id = ?;", [id]);
    },
    ban: (channel, username, reason, userstate) => {
        addBan(channel, userstate["target-user-id"], username, reason, userstate["tmi-sent-ts"]);
    },
    timeout: (channel, username, reason, duration, userstate) => {
        addTimeout(channel, userstate["target-user-id"], username, reason, duration, userstate["tmi-sent-ts"]);
    },
};

con.query("select streamer_id, user_id from twitch__ban where active = true;", (err, res) => {
    if (err) {global.api.Logger.warning(err);return;}

    res.forEach(ban => {
        bannedList = [
            ...bannedList,
            {
                streamer_id: ban.streamer_id,
                user_id: ban.user_id,
            }
        ]
    });
});

con.query("select streamer_id, user_id from twitch__timeout where active = true;", (err, res) => {
    if (err) {global.api.Logger.warning(err);return;}

    res.forEach(timeout => {
        timeoutList = [
            ...timeoutList,
            {
                streamer_id: timeout.streamer_id,
                user_id: timeout.user_id,
            }
        ];
    });
});

/**
 * Check if a twitch channel is already being listened to by the bot
 * @param {String} channel - The twitch channel to check for a listener
 * @returns {Boolean} True if a listener is found, false if not
 */
const isChannelListenedTo = channel => {
    for (let client of clients) {
        if (client.channels.includes(channel)) {
            return true;
        }
    }
    return false;
}

/**
 * Initialize a new TMI.js client and create a parent object to house it
 * @returns {ClientObject} A new client object which contains a TMI.js client, a list of channels it is listening to, and the object status.
 */
const initializeClient = () => {
    const client = new tmi.Client({
        options: { debug: false },
        connection: { reconnect: true },
        identity: {
            username: config.twitch.username,
            password: config.twitch.oauth
        },
    });

    // Activate event handlers for the TMI client
    client.on('message', handle.message);
    client.on("messagedeleted", handle.messageDeleted);
    client.on('ban', handle.ban);
    client.on("timeout", handle.timeout);

    // Create the parent object to house the client
    let clientObj = {
        client: client,
        status: "initializing",
        nextConnect: Date.now(),
        channels: [],
    };

    const listen = name => {
        const join = () => {
            client.join(name).catch(err => {
                if (err === "Not connected to server.") {
                    setTimeout(() => listen(name), 500);
                    return;
                }

                global.api.Logger.warning(`Error connecting to ${name}: ${err} - Will retry once.`);
                setTimeout(() => {
                    client.join(name).catch(err => {
                        global.api.Logger.warning(`Error connecting to ${name}: ${err} - Will not retry.`);
                    });
                }, 200);
            });
        };

        let now = Date.now();
        if (now >= clientObj.nextConnect) {
            join();
        } else {
            setTimeout(join, clientObj.nextConnect - now);
        }
        clientObj.nextConnect = Math.max(now, clientObj.nextConnect) + CHANNEL_CONNECT_INTERVAL;
    };

    clientObj.addChannel = name => {
        name = name.toLowerCase();
        if (!isChannelListenedTo(name) && !disallowed_channels.includes(name)) {
            clientObj.channels = [
                ...clientObj.channels,
                name
            ];
        }
    };

    // Add the created client object to the list of clients
    clients = [
        ...clients,
        clientObj
    ];

    const connectClient = () => {
        global.api.Logger.info("Initializing client...");
        client.connect();
    }

    let now = Date.now();
    if (now >= nextClient) {
        connectClient();
    } else {
        setTimeout(connectClient, nextClient - now);
    }
    nextClient = Math.max(now, nextClient) + CLIENT_CONNECT_INTERVAL;

    const interval = setInterval(() => {
        if (client.readyState() === "OPEN") {
            global.api.Logger.info("Client opened. Connecting clients.");
            clearInterval(interval);

            clientObj.addChannel = name => {
                name = name.toLowerCase();
                if (!isChannelListenedTo(name) && !disallowed_channels.includes(name)) {
                    clientObj.channels = [
                        ...clientObj.channels,
                        name
                    ];
                    listen(name);
                }
            };
    
            clientObj.channels.forEach(channel => {
                listen(channel);
            });

            clientObj.status = "initialized";
        }
    }, 200);

    return clientObj;
}

/**
 * Finds a client object that has space to listen to new channels, if none are found, creates a new client object
 * @returns {ClientObject} A client object which is ready to be used
 */
const getFreeClient = () => {
    for (let client of clients) {
        if (client.channels.length < CLIENT_MAXIMUM_CHANNELS) {
            return client;
        }
    }

    return initializeClient();
}

/**
 * 
 * @returns {Number} The total number of channels currently being listened to by the bot
 */
const getChannelCount = () => {
    let total = 0;
    clients.forEach(client => {
        total += client.channels.length;
    })
    return total;
}

/**
 * Update the Discord bot's presence to reflect the current number of channels being listened to
 * @returns {void} 
*/
const updateActivity = () => {
    let channelCount = getChannelCount();
    let nodeCount = clients.length;
    if (global?.client?.discord?.user)
        global.client.discord.user.setActivity(`${channelCount} channel${channelCount === 1 ? "" : "s"} with ${nodeCount} node${nodeCount === 1 ? "" : "s"}`, {type: "WATCHING"})
}

setInterval(updateActivity, 30000);
setTimeout(updateActivity, 3000);

/**
 * 
 * @param {String} channel - The twitch channel to add to the bot's listening list
 */
const listenOnChannel = channel => {
    getFreeClient().addChannel(channel);
}

/**
 * 
 * @param {String} channel - The twitch channel to remove from the bot's listening list
 */
const partFromChannel = channel => {
    channel = channel.replace('#', "");
    for (let client of channels) {
        if (client.channels.includes(channel)) {
            global.api.Logger.info("Parting channel " + channel);
            client.client.part(channel);
            client.channels.splice(client.channels.indexOf(channel), 1);
        }
    }
}

// Fetch the current mod squad Discord Guild object
discordClient.guilds.fetch(config.modsquad_discord).then(guild => {
    modSquadGuild = guild;
});

con.query("select distinct lower(twitch__user.display_name) as name from identity__moderator join identity on modfor_id = identity.id join twitch__user on twitch__user.identity_id = identity.id where identity__moderator.active = true;", (err, res) => {
    if (err) {global.api.Logger.warning(err);return;}

    res.forEach(streamer => {
        listenOnChannel(streamer.name);
    });

    global.api.Logger.info("Startup completed!");
});

// Create a singular client object to execute bans
const banClient = new tmi.Client({
    options: { debug: false },
    connection: { reconnect: true },
    identity: {
        username: config.twitch.username,
        password: config.twitch.oauth
    },
});

banClient.connect();

// Bind listenOnChannel to the global scope
global.listenOnChannel = listenOnChannel;

global.client.ban = banClient;

module.exports = {
    listenOnChannel: listenOnChannel,
    banClient: banClient,
    getClients: function() {return clients;},
};
