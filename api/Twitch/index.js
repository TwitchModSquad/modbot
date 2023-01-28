const con = require("../../database");

const TwitchChat = require("./TwitchChat");

const Identity = require("../Identity");
const TwitchUser = require("./TwitchUser");
const TwitchCommand = require("./TwitchCommand");

const Cache = require("../Cache/Cache");
const Assumption = require("../Assumption");
const AssumedTwitchUser = require("./AssumedTwitchUser");

const TwitchAPI = require("./TwitchAPI");

const config = require("../../config.json");

const {ApiClient} = require("twitch");
const {ClientCredentialsAuthProvider} = require("twitch-auth");

const authProvider = new ClientCredentialsAuthProvider(config.twitch.client_id, config.twitch.client_secret);
const api = new ApiClient({ authProvider });

let commands = [];

setTimeout(() => {
    for (const name in global.twitchCommands) {
        commands = [
            ...commands,
            name
        ]
    }
}, 500);

/**
 * Utility class for Twitch services
 */
class Twitch {

    /**
     * Direct access to Twitch's API suite
     * 
     * @type {ApiClient}
     */
    Direct = api;

    /**
     * Custom class for Helix calls
     * 
     * @type {TwitchAPI}
     */
    TwitchAPI = new TwitchAPI();

    /**
     * Access to Chat methods
     * 
     * @type {TwitchChat}
     */
    Chat = new TwitchChat();

    /**
     * Twitch user cache (ID)
     * 
     * @type {Cache}
     */
    userCache = new Cache(600000);

    /**
     * Streamer command cache
     * 
     * @type {Cache}
     */
    streamerCommands = new Cache(600000);

    /**
     * Requests a user directly from the Twitch Helix API
     * This method should NEVER be used externally as it can take a substantial amount of time to request and WILL overwrite other data.
     * @param {string} id 
     * @returns {Promise<TwitchUser>}
     */
    getUserByIdByForce(id) {
        return new Promise(async (resolve, reject) => {
            try {
                let helixUser = await api.helix.users.getUserById(id);

                if (helixUser) {
                    let user = new TwitchUser(helixUser.id, null, helixUser.name, helixUser.displayName, null, helixUser.profilePictureUrl, helixUser.offlinePlaceholderUrl, helixUser.description, helixUser.views, null, (helixUser.broadcasterType === "" ? null : helixUser.broadcasterType));
                    await user.refreshFollowers();
                    user.post();
    
                    await con.pquery("insert into twitch__username (id, display_name) values (?, ?) on duplicate key update last_seen = null;", [user.id, user.display_name]);
                    
                    resolve(user);
                } else {
                    reject("User not found!");
                }
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Gets a user based on a Twitch user ID.
     * @param {number} id 
     * @param {boolean} bypassCache
     * @param {boolean} requestIfUnavailable
     * 
     * @returns {Promise<TwitchUser>}
     */
    getUserById(id, bypassCache = false, requestIfUnavailable = false) {
        return this.userCache.get(id, (resolve, reject) => {
            con.query("select twitch__user.*, identity.name as identity_name, identity.authenticated, identity.admin, identity.moderator from twitch__user left join identity on twitch__user.identity_id = identity.id where twitch__user.id = ?;", [id], (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    if (res.length > 0) {
                        let row = res[0];
                        resolve(new TwitchUser(
                            row.id,
                            row.identity_id === null ? null : new Identity(row.identity_id, row.identity_name, Boolean(row.authenticated), Boolean(row.admin), Boolean(row.moderator)),
                            row.login,
                            row.display_name,
                            row.email,
                            row.profile_image_url,
                            row.offline_image_url,
                            row.description,
                            row.view_count,
                            row.follower_count,
                            row.affiliation,
                        ));
                    } else {
                        if (requestIfUnavailable) {
                            this.getUserByIdByForce(id).then(resolve, reject);
                        } else {
                            reject("User not found!");
                        }
                    }
                }
            });
        }, bypassCache);
    }

    /**
     * Requests a user directly from the Twitch Helix API
     * This method should NEVER be used externally as it can take a substantial amount of time to request and WILL overwrite other data.
     * @param {string} display_name 
     * @returns {Promise<AssumedTwitchUser[]>}
     */
    getUserByNameByForce(display_name) {
        return new Promise(async (resolve, reject) => {
            try {
                let helixUser = await api.helix.users.getUserByName(display_name);

                if (helixUser) {
                    let user = new TwitchUser(helixUser.id, null, helixUser.name, helixUser.displayName, null, helixUser.profilePictureUrl, helixUser.offlinePlaceholderUrl, helixUser.description, helixUser.views, null, (helixUser.broadcasterType === "" ? null : helixUser.broadcasterType));
                    await user.refreshFollowers();
                    await user.post();

                    await con.pquery("insert into twitch__username (id, display_name) values (?, ?) on duplicate key update last_seen = null;", [user.id, user.display_name]);

                    user = new AssumedTwitchUser(user, [new Assumption("display_name", display_name, user.display_name)]);

                    resolve([user]);
                } else {
                    reject("No users were found!");
                }
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Gets a user based on a Twitch name
     * @param {string} display_name
     * @param {boolean} requestIfUnavailable default false
     * @returns {Promise<AssumedTwitchUser[]>}
     */
    getUserByName(display_name, requestIfUnavailable = false) {
        return new Promise((resolve, reject) => {
            con.query("select id from twitch__username where display_name = ?;", [display_name], async (err, res) => {
                if (!err) {
                    if (res.length > 0) {
                        let result = [];
                        for (let i = 0; i < res.length; i++) {
                            let row = res[i];
                            try {
                                let user = await this.getUserById(row.id);
                                result = [
                                    ...result,
                                    new AssumedTwitchUser(user, [new Assumption("display_name", display_name, user.display_name)]),
                                ];
                            } catch (e) {
                                global.api.Logger.warning(e);
                            }
                        }
                        resolve(result);
                    } else {
                        if (requestIfUnavailable) {
                            this.getUserByNameByForce(display_name).then(resolve, reject);
                        } else
                            reject("No users were found!");
                    }
                } else {
                    reject(err);
                }
            });
        });
    }

    /**
     * Gets a list of users based on an identity
     * @param {number} id
     * @returns {Promise<TwitchUser[]>}
     */
    getUsersByIdentity(id) {
        return new Promise((resolve, reject) => {
            con.query("select id from twitch__user where identity_id = ?;", [id], async (err, res) => {
                if (!err) {
                    let result = [];
                    for (let i = 0; i < res.length; i++) {
                        try {
                            let user = await this.getUserById(res[i].id);
                            result = [
                                ...result,
                                user,
                            ];
                        } catch (e) {
                            global.api.Logger.warning(e);
                        }
                    }
                    resolve(result);
                } else {
                    reject(err);
                }
            });
        });
    }

    /**
     * Gets the commands under a specified streamer
     * @param {TwitchUser} streamer 
     * @return {Promise<TwitchCommand[]>}
     */
    getStreamerCommands(streamer) {
        return this.streamerCommands.get(streamer.id, (resolve, reject) => {
            con.query("select id, name, referenced_command from twitch__command where streamer_id = ? order by referenced_command asc, name asc;", [streamer.id], (err, res) => {
                if (!err) {
                    let commands = res.map(x => new TwitchCommand(
                            x.id,
                            streamer,
                            x.name.toLowerCase(),
                            x.referenced_command.toLowerCase()
                        ));
                    
                    resolve(commands);
                } else {
                    reject(err);
                }
            });
        });
    }

    /**
     * Adds a command to a streamer
     * @param {TwitchUser} streamer 
     * @param {string} command
     * @param {string} label
     * @return {Promise<TwitchCommand[]>}
     */
    addStreamerCommand(streamer, command, label) {
        command = command.toLowerCase();
        label = label.toLowerCase();
        return new Promise((resolve, reject) => {
            if (!commands.includes(command)) {
                reject(command + " is not a recognized TMS command");
                return;
            }

            con.query("select id from twitch__command where streamer_id = ? and name = ?;", [streamer.id, label], (err, res) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (res.length > 0) {
                    reject("A command with this label already exists");
                    return;
                }

                con.query("insert into twitch__command (streamer_id, name, referenced_command) values (?, ?, ?);", [streamer.id, label, command], err => {
                    if (err) {
                        reject(err);
                    } else {
                        this.streamerCommands.remove(streamer.id);
                        this.getStreamerCommands(streamer).then(resolve, reject);
                    }
                });
            });
        });
    }

    /**
     * Removes a command from a streamer
     * @param {TwitchUser} streamer 
     * @param {string} label
     * @return {Promise<TwitchCommand[]>}
     */
    removeStreamerCommand(streamer, label) {
        return new Promise((resolve, reject) => {
            con.query("select id from twitch__command where streamer_id = ? and name = ?;", [streamer.id, label], (err, res) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (res.length === 0) {
                    reject("A command with this label does not exist");
                    return;
                }

                con.query("delete from twitch__command where streamer_id = ? and name = ?;", [streamer.id, label], err => {
                    if (err) {
                        reject(err);
                    } else {
                        this.streamerCommands.remove(streamer.id);
                        this.getStreamerCommands(streamer).then(resolve, reject);
                    }
                });
            });
        });
    }
}

module.exports = Twitch;