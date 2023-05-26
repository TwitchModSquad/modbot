const con = require("../../database");

require("../index");

const {EmbedBuilder, codeBlock} = require("discord.js");

const User = require("../User");
const Identity = require("../Identity");
const FullIdentity = require("../FullIdentity");

const TwitchTimeout = require("./TwitchTimeout");
const TwitchBan = require("./TwitchBan");
const TwitchUsername = require("./TwitchUsername");
const TwitchRole = require("./TwitchRole");

const https = require("https");

const FOLLOWER_REQUIREMENT = 5000;

const config = require("../../config.json");

const {ApiClient} = require("twitch");
const {ClientCredentialsAuthProvider} = require("twitch-auth");

const authProvider = new ClientCredentialsAuthProvider(config.twitch.client_id, config.twitch.client_secret);
const api = new ApiClient({ authProvider });

const tmi = require('tmi.js');

const modClient = new tmi.Client({
    options: { debug: false },
    connection: { reconnect: true },
    identity: {
        username: config.twitch.username,
        password: config.twitch.oauth
    },
});

let connected = false;

modClient.on("connected", () => {
    connected = true;
});

modClient.on("disconnected", () => {
    connected = false;
})

modClient.connect();

const sleep = ms => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function comma(x) {
    if (!x) return "0";
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * The class for a specific Twitch user
 * @extends User
 */
class TwitchUser extends User {

    /**
     * The display name for the user
     * @type {string}
     */
    display_name;

    /**
     * The login for the user
     * @type {string}
     */
    login;

    /**
     * The email for the user. Only present in users which have authenticated with TMS.
     * @type {?string}
     */
    email;

    /**
     * The profile image URL for the user.
     * @type {?string}
     */
    profile_image_url;

    /**
     * The offline image URL for the user.
     * @type {?string}
     */
    offline_image_url;

    /**
     * The description for the user.
     * @type {?string}
     */
    description;

    /**
     * The total view count for the user.
     * @type {?number}
     */
    view_count;

    /**
     * The total follower count for the user.
     * @type {?number}
     */
    follower_count;
    
    /**
     * Affiliation for the user. (partner, affiliate, or blank)
     * @type {?string}
     */
    affiliation;

    /**
     * Constructs a TwitchUser object
     * 
     * @param {number} id 
     * @param {?Identity} identity 
     * @param {string} login 
     * @param {string} display_name 
     * @param {?string} email 
     * @param {?string} profile_image_url 
     * @param {?string} offline_image_url 
     * @param {?string} description 
     * @param {?number} view_count 
     * @param {?number} follower_count 
     * @param {?string} affiliation 
     */

    constructor(id, identity, login, display_name, email, profile_image_url, offline_image_url, description, view_count, follower_count, affiliation) {
        super(id, identity);
        
        this.login = login;
        this.display_name = display_name;
        this.email = email;
        this.profile_image_url = profile_image_url;
        this.offline_image_url = offline_image_url;
        this.description = description;
        this.view_count = view_count;
        this.follower_count = follower_count;
        this.affiliation = affiliation;
    }

    /**
     * Refreshes the follower count. Will NOT post to the database
     * @returns {Promise<number>}
     */
    refreshFollowers() {
        return new Promise(async (resolve, reject) => {
            try {
                this.follower_count = (await api.helix.users.getFollows({followedUser: this.id})).total;

                resolve(this.follower_count);
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Refresh the streamers under a channel name.
     * 
     * @returns {Promise<TwitchUser[]>}
     */
    refreshStreamers() {
        return new Promise((resolve, reject) => {
            let thisUser = this;

            https.request({
                host: "modlookup.3v.fi",
                path: "/api/user-v3/" + this.login + "?limit=100&cursor="
            }, response => {
                let str = "";
    
                response.on('data', function (chunk) {
                    str += chunk;
                });
    
                response.on('end', async function () {
                    try {
                        let data = JSON.parse(str.trim());
    
                        if (data.status == 200) {
                            if (data.hasOwnProperty("channels") && data.channels.length > 0) {

                                if (thisUser.identity === null) {
                                    let identity = new FullIdentity(null, thisUser.display_name, false, false, false, [thisUser], []);
                                    await identity.post();
                                }

                                let streamers = [];
    
                                for (let i = 0; i < data.channels.length; i++) {
                                    let channel = data.channels[i];
    
                                    try {
                                        let user = (await global.api.Twitch.getUserByName(channel.name, true))[0];

                                        let identity;
                                        if (!user.identity?.id) {
                                            identity = new FullIdentity(null, user.display_name, false, false, false, [user], []);
                                        } else {
                                            identity = await global.api.getFullIdentity(user.identity.id);
                                        }
                                        
                                        await user.refreshFollowers();
                                        await identity.post();

                                        if (!streamers.find(streamer => streamer.id == user.id)) {
                                            streamers = [
                                                ...streamers,
                                                user
                                            ];
                                        }

                                        let active = user.follower_count >= FOLLOWER_REQUIREMENT || user.affiliation === "partner";

                                        if (active && global.listenOnChannel) {
                                            global.listenOnChannel(user.login);
                                        }

                                        con.query("insert into identity__moderator (identity_id, modfor_id, active) values (?, ?, ?) on duplicate key update active = ?;", [thisUser.identity.id, identity.id, active, active]);
                                    } catch (e) {
                                        if (e !== "No users were found!") {
                                            global.api.Logger.warning(e);
                                        }
                                    }
                                }

                                resolve(streamers);
                            } else {
                                reject("User was not listed as a moderator anywhere!");
                            }
                        } 
                    } catch (e) {
                        global.api.Logger.warning(e);
                    }
                });
            }).end();
        });
    }

    /**
     * Returns the streamers of a certain channel.
     * @param {boolean} includeInactive
     * @returns {Promise<{streamer: TwitchUser, active: boolean}[]>}
     */
    getStreamers(includeInactive = false) {
        return new Promise((resolve, reject) => {
            if (!this.identity?.id) {
                resolve([]); // not having an identity currently just returns an empty array as it shouldn't particularly be seen as an error
                return;
            }

            con.query(`select tu.id, im.active from identity__moderator as im join twitch__user as tu on tu.identity_id = im.modfor_id where im.identity_id = ?${includeInactive ? "" : " and active = true"};`, [this.identity.id], async (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    let users = [];

                    for (let i = 0; i < res.length; i++) {
                        users = [
                            ...users,
                            {
                                streamer: await global.api.Twitch.getUserById(res[i].id),
                                active: res[i].active,
                            },
                        ]
                    }

                    resolve(users);
                }
            });
        });
    }

    /**
     * Refresh the moderators under a channel name.
     * Warning: This may take an extended amount of time!
     * 
     * @param {boolean} createIdentities
     * @returns {Promise<TwitchUser[]>}
     */
    refreshMods(createIdentities = true) {
        return new Promise(async (resolve, reject) => {
            if (!connected) {
                while (!connected) {
                    global.api.Logger.warning("WAITING. Mod TMI client has not been activated. This may be a bug!");
                    await sleep(500);
                }
            }

            if (this.identity === null && createIdentities) {
                let identity = new FullIdentity(null, this.display_name, false, false, false, [this], []);
                await identity.post();
            }

            let mods = null;
            try {
                mods = await modClient.mods(this.display_name);
            } catch(err) {
                reject(err);
                return;
            }

            let finalMods = [];

            for (let i = 0; i < mods.length; i++) {
                try {
                    let users = await global.api.Twitch.getUserByName(mods[i], true);

                    for (let y = 0; y < users.length; y++) {
                        if (users[y].identity === null && createIdentities) {
                            let identity = new FullIdentity(null, users[y].display_name, false, false, false, [users[y]], []);
                            await identity.post();
                        }
                        
                        con.query("insert into twitch__role (user_id, streamer_id, role, source) values (?, ?, 'moderator', 'legacy') on duplicate key update updated = now();", [users[y].id, this.id], err => {
                            if (err) global.api.Logger.warning(err);
                        });

                        if (this.identity?.id && users[y].identity?.id && createIdentities) {
                            con.query("insert into identity__moderator (identity_id, modfor_id, active) values (?, ?, ?) on duplicate key update active = ?;", [users[y].identity.id, this.identity.id, this.follower_count >= FOLLOWER_REQUIREMENT, this.follower_count >= FOLLOWER_REQUIREMENT]);
                        }
                    }

                    finalMods = [
                        ...finalMods,
                        ...users,
                    ];
                } catch (err) {
                    global.api.Logger.warning(err);
                }
            }

            resolve(finalMods);
        });
    }

    /**
     * Returns the moderators of a certain channel.
     * 
     * @returns {Promise<TwitchUser[]>}
     */
    getMods() {
        return new Promise((resolve, reject) => {
            if (!this.identity?.id) {
                resolve([]); // not having an identity currently just returns an empty array as it shouldn't particularly be seen as an error
                return;
            }

            con.query("select tu.id from identity__moderator as im join twitch__user as tu on tu.identity_id = im.identity_id where im.modfor_id = ?;", [this.identity.id], async (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    let users = [];

                    for (let i = 0; i < res.length; i++) {
                        users = [
                            ...users,
                            await global.api.Twitch.getUserById(res[i].id),
                        ]
                    }

                    resolve(users);
                }
            });
        });
    }

    /**
     * Gets a list of Twitch user timeouts
     * 
     * @returns {Promise<TwitchTimeout[]>}
     */
     getTimeouts() {
        return new Promise((resolve, reject) => {
            con.query("select * from twitch__timeout where user_id = ? order by timeto desc;", [this.id], async (err, res) => {
                if (err) {
                    reject(err);
                    return;
                }

                let result = [];
                for (let i = 0; i < res.length; i++) {
                    let timeout = res[i];
                    result = [
                        ...result,
                        new TwitchTimeout(
                            timeout.id,
                            await global.api.Twitch.getUserById(timeout.streamer_id),
                            await global.api.Twitch.getUserById(timeout.user_id),
                            timeout.timeto,
                            timeout.duration,
                            timeout.active == 1,
                            timeout.discord_message
                        ),
                    ];
                }
                resolve(result);
            });
        });
    }

    /**
     * Gets a list of Twitch user bans
     * 
     * @returns {Promise<TwitchBan[]>}
     */
    getBans() {
        return new Promise((resolve, reject) => {
            con.query("select * from twitch__ban where user_id = ? order by timebanned desc;", [this.id], async (err, res) => {
                if (err) {
                    reject(err);
                    return;
                }

                let result = [];
                for (let i = 0; i < res.length; i++) {
                    let ban = res[i];
                    result = [
                        ...result,
                        new TwitchBan(
                            ban.id,
                            await global.api.Twitch.getUserById(ban.streamer_id),
                            await global.api.Twitch.getUserById(ban.user_id),
                            ban.timebanned,
                            ban.active == 1,
                            ban.discord_message
                        ),
                    ];
                }
                resolve(result);
            });
        });
    }

    /**
     * Utilizes an oAuth token to retrieve moderators, VIPs, and editors for a channel
     * 
     * @param {string} token
     * @returns {Promise<void>}
     */
    refreshStreamerRoles(token) {
        return new Promise(async (resolve, reject) => {
            try {
                let editors = await global.api.Authentication.Twitch.getEditors(token, this.id);
                let mods = await global.api.Authentication.Twitch.getMods(token, this.id);
                let vips = await global.api.Authentication.Twitch.getVIPs(token, this.id);
                
                await con.pquery("update twitch__role set last_known = now() where streamer_id = ?;", [this.id]);

                editors.forEach(editor => {
                    con.query("insert into twitch__role (user_id, streamer_id, role) values (?, ?, 'editor') on duplicate key update last_known = null, updated = now();", [editor.id, this.id], err => {
                        if (err) global.api.Logger.severe(err);
                    });
                });

                mods.forEach(mod => {
                    con.query("insert into twitch__role (user_id, streamer_id, role) values (?, ?, 'moderator') on duplicate key update last_known = null, updated = now();", [mod.id, this.id], err => {
                        if (err) global.api.Logger.severe(err);
                    });
                });

                vips.forEach(vip => {
                    con.query("insert into twitch__role (user_id, streamer_id, role) values (?, ?, 'vip') on duplicate key update last_known = null, updated = now();", [vip.id, this.id], err => {
                        if (err) global.api.Logger.severe(err);
                    });
                });

                resolve();
            } catch(err) {
                reject(err);
            }
        });
    }

    /**
     * Returns a list of roles in which this user has in other communities and roles in this user's channel
     * @param {boolean} includeInactive
     * @returns {Promise<TwitchRole[]>}
     */
    getRoles(includeInactive = false) {
        return new Promise((resolve, reject) => {
            con.query(`select * from twitch__role where (user_id = ? or streamer_id = ?)${includeInactive ? "" : " and last_known is null"};`, [this.id, this.id], async (err, res) => {
                if (err) {
                    reject(err);
                    return;
                }

                let roles = [];

                for (let i = 0; i < res.length; i++) {
                    let role = res[i];

                    roles = [
                        ...roles,
                        new TwitchRole(
                            role.user_id === this.id ? this : await global.api.Twitch.getUserById(role.user_id),
                            role.streamer_id === this.id ? this : await global.api.Twitch.getUserById(role.streamer_id),
                            role.role,
                            new Date(role.first_known),
                            new Date(role.updated),
                            role.last_known !== null ? new Date(role.last_known) : null,
                            role.source,
                            role.visibility
                        ),
                    ]
                }

                resolve(roles);
            });
        });
    }

    /**
     * Gets a list of active Twitch communities for this user
     * 
     * @returns {Promise<[{user: TwitchUser, chatCount: number, lastActive: number}]>}
     */
    getActiveCommunities() {
        return new Promise((resolve, reject) => {
            con.query("select * from twitch__chat_chatters where chatter_id = ? order by last_active desc;", [this.id], async (err, res) => {
                if (err) {
                    reject(err);
                    return;
                }

                let users = [];
                for (let i = 0; i < res.length; i++) {
                    let row = res[i];
                    let user = await global.api.Twitch.getUserById(row.streamer_id);
                    users = [
                        ...users,
                        {
                            user: user,
                            chatCount: row.chat_count,
                            lastActive: row.last_active,
                        }
                    ]
                }
                resolve(users);
            });
        });
    }

    /**
     * Returns any potential alt accounts for this user
     * @returns {Promise<TwitchUsername[]>}
     */
    getNames() {
        return new Promise((resolve, reject) => {
            con.query("select * from twitch__username where id = ? order by last_seen asc;", [this.id], (err, res) => {
                if (err) {
                    reject(err);
                    return;
                }

                let result = [];

                res.forEach(name => {
                    result = [
                        ...result,
                        new TwitchUsername(
                            this.id,
                            name.display_name,
                            new Date(name.first_seen),
                            name.last_seen !== null ? new Date(name.last_seen) : null,
                        ),
                    ]
                });

                resolve(result);
            });
        });
    }

    /**
     * Gets TMS short link to user's page
     * @returns {string}
     */
    getShortlink() {
        return `${config.pub_domain}panel/user/${this.id}`;
    }

    /**
     * Generated a Discord Embed for the user.
     * 
     * @returns {Promise<EmbedBuilder>}
     */
    discordEmbed() {
        return new Promise(async (resolve, reject) => {
            const embed = new EmbedBuilder()
                    .setAuthor({name: this.display_name, iconURL: this.profile_image_url, url: this.getShortlink()})
                    .setColor(0x772ce8)
                    .setThumbnail(this.profile_image_url)
                    .setDescription(`\`\`\`${this.id}\`\`\`**Name: **${this.display_name}\n**Followers: **${comma(this.follower_count)}\n**Views: **${comma(this.view_count)}\n[Profile](https://twitch.tv/${this.login})`)
                    .setFooter({text: "TMS Twitch User #" + this.id, iconURL: "https://tms.to/assets/images/logos/logo.webp"});

            if (this.description && this.description !== "")
                embed.addFields({
                    name: "Description",
                    value: codeBlock(this.description),
                    inline: false,
                });

            const streamers = (await this.getStreamers()).map(x => x.streamer);
            const mods = await this.getMods();
            const activeCommunities = await this.getActiveCommunities();
            const bans = await this.getBans();

            if (streamers.length > 0) {
                let streamerStr = "";
                streamers.forEach(streamer => {
                    if (streamerStr !== "") streamerStr += "\n";
                    streamerStr += `**${streamer.display_name}** : [Profile](https://twitch.tv/${streamer.login})`;
                });

                if (streamerStr.length <= 1024) {
                    embed.addFields({
                        name: "Streamers",
                        value: streamerStr,
                        inline: true,
                    });
                
                } else global.api.Logger.warning("Exceeded character count for streamers");
            }

            if (mods.length > 0) {
                let modsStr = "";
                mods.forEach(mod => {
                    if (modsStr !== "") modsStr += "\n";
                    modsStr += `**${mod.display_name}** : [Profile](https://twitch.tv/${mod.login})`;
                });

                if (modsStr.length <= 1024) {
                    embed.addFields({
                        name: "Moderators",
                        value: modsStr,
                        inline: true,
                    });
                } else global.api.Logger.warning("Exceeded character count for mods");
            }

            if (activeCommunities.length > 0) {
                let rows = activeCommunities
                    .map(x => [x.user.display_name, new Date(x.lastActive).toLocaleDateString(), String(x.chatCount)])
                    .slice(0, 20);

                rows = [
                    ["Streamer", "Last Active", "Messages"],
                    ...rows,
                ]

                let communitiesStr = global.api.stringTable(rows, 3, 5);

                if (communitiesStr.length <= 950) {
                    embed.addFields({
                        name: "Active Communities",
                        value: `[View online at tms.to](${this.getShortlink()})\n` + codeBlock(communitiesStr),
                        inline: false,
                    });
                } else global.api.Logger.warning("Exceeded character count for active communities");
            }

            if (bans.length > 0) {
                let result = "";

                bans.forEach(ban => {
                    if (result.length < 800) {
                        if (result !== "") result += "\n";

                        if (ban.discord_message && bans.length <= 8) {
                            result += `[${ban.channel.display_name} on ${new Date(ban.time).toLocaleDateString()}${ban.active ? "" : " \[inactive\]"}](https://discord.com/channels/${config.modsquad_discord}/${config.liveban_channel}/${ban.discord_message})`;
                        } else {
                            result += ban.channel.display_name + " on " + new Date(ban.time).toLocaleDateString();
                        }
                    }
                });

                if (result.length <= 1024) {
                    embed.addFields({
                        name: "Bans",
                        value: result,
                        inline: false,
                    });
                } else global.api.Logger.warning("Exceeded character count for bans");
            }

            resolve(embed);
        });
    }

    /**
     * Updates or creates the user with the information in this Object
     * 
     * @returns {Promise<TwitchUser>}
     */
    post() {
        return new Promise(async (resolve, reject) => {
            con.query("insert into twitch__user (id, login, display_name, identity_id, email, profile_image_url, offline_image_url, description, view_count, follower_count, affiliation) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) on duplicate key update login = ?, display_name = ?, identity_id = ?, email = ?, profile_image_url = ?, offline_image_url = ?, description = ?, view_count = ?, follower_count = ?, affiliation = ?;", [
                this.id,
                this.login,
                this.display_name,
                this.identity?.id,
                this.email,
                this.profile_image_url,
                this.offline_image_url,
                this.description,
                this.view_count,
                this.follower_count,
                this.affiliation,
                this.login,
                this.display_name,
                this.identity?.id,
                this.email,
                this.profile_image_url,
                this.offline_image_url,
                this.description,
                this.view_count,
                this.follower_count,
                this.affiliation,
            ], err => {
                if (err) {
                    reject(err);
                } else {
                    resolve(this);
                    global.api.Twitch.userCache.remove(this.id);
                }
            });
        });
    }

}

module.exports = TwitchUser;