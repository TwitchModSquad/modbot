const con = require("../../database");

const Identity = require("../Identity");
const DiscordUser = require("./DiscordUser");
const DiscordGuild = require("./DiscordGuild");

const Cache = require("../Cache/Cache");
const AssumedDiscordUser = require("./AssumedDiscordUser");
const Assumption = require("../Assumption");
const DiscordListener = require("./DiscordListener");

const sleep = ms => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Utility class for Discord services
 */
class Discord {

    /**
     * Discord user cache (ID)
     * 
     * @type {Cache}
     */
    userCache = new Cache(600000);

    /**
     * Discord guild cache (ID)
     * 
     * @type {Cache}
     */
    guildCache = new Cache();

    /**
     * Whether or not listeners have loaded in or not
     * @type {boolean}
     */
    listenersInitialized = false;

    /**
     * Represents all listeners for all guilds
     * 
     * @type {DiscordListener[]}
     */
    listeners = [];

    /**
     * Init discord guild listeners
     */
    init() {
        console.log("init");
        con.query("select * from discord__listener;", async (err, res) => {
            console.log("init got");
            if (!err) { 
                for (let i = 0; i < res.length; i++) {
                    let listener = res[i];
                    this.listeners = [
                        ...this.listeners,
                        new DiscordListener(
                            listener.id,
                            await global.client.mbm.guilds.fetch(listener.guild),
                            await global.client.mbm.channels.fetch(listener.channel),
                            listener.event,
                            listener.data
                        )
                    ];
                }
                this.listenersInitialized = true;
                global.api.Logger.info("Loaded " + this.listeners.length + " listener(s)");
            } else global.api.Logger.severe(err);
        });
    }

    /**
     * Internal method for retrieving a user if it is not present in the database
     * @param {number} id 
     */
    getUserByIdByForce(id) {
        return new Promise((resolve, reject) => {
            global.client.mbm.users.fetch(id).then(async user => {
                let discordUser = new DiscordUser(user.id, null, user.username, user.discriminator, user.avatar);
                await discordUser.post();
                resolve(discordUser);
            }, reject);
        });
    }

    /**
     * Gets a user based on a Discord user ID.
     * @param {number} id 
     * @param {?boolean} overrideCache
     * @param {?boolean} requestIfUnavailable
     * 
     * @returns {Promise<DiscordUser>}
     */
    getUserById(id, overrideCache = false, requestIfUnavailable = false) {
        return this.userCache.get(id, (resolve, reject) => {
            con.query("select discord__user.*, identity.name as identity_name, identity.authenticated, identity.admin, identity.moderator from discord__user left join identity on discord__user.identity_id = identity.id where discord__user.id = ?;", [id], (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    if (res.length > 0) {
                        let row = res[0];
                        resolve(new DiscordUser(
                            row.id,
                            row.identity_id === null ? null : new Identity(row.identity_id, row.identity_name, row.authenticated, row.admin, row.mod),
                            row.name,
                            row.discriminator,
                            row.avatar
                        ));
                    } else {
                        if (requestIfUnavailable) {
                            this.getUserByIdByForce(id).then(resolve, reject);
                        } else
                            reject("User was not found!");
                    }
                }
            });
        }, overrideCache);
    }


    /**
     * Gets a list of users which have/have had a specific name.
     * @param {string} name 
     * @returns {Promise<AssumedDiscordUser[]>}
     */
    getUserByName(name) {
        return new Promise((resolve, reject) => {
            con.query("select id from discord__username where name = ?;", [name], async (err, res) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (res.length > 0) {
                    let result = [];
                    for (let i = 0; i < res.length; i++) {
                        let row = res[i];
                        try {
                            let user = await this.getUserById(row.id);
                            result = [
                                ...result,
                                new AssumedDiscordUser(user, [new Assumption("name", name, user.name)]),
                            ];
                        } catch (e) {
                            global.api.Logger.warning(e);
                        }
                    }
                    resolve(result);
                } else {
                    reject("No users were found!");
                }
            });
        });
    }


    /**
     * Gets a list of users which have/have had a specific name and discriminator.
     * @param {string} name 
     * @param {string} discriminator
     * @param {boolean} overrideCache 
     * @returns {Promise<AssumedDiscordUser[]>}
     */
    getUserByTag(name, discriminator, overrideCache = false) {
        return new Promise((resolve, reject) => {
            con.query("select id from discord__username where name = ? and discriminator = ?;", [name, discriminator], async (err, res) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (res.length > 0) {
                    let result = [];
                    for (let i = 0; i < res.length; i++) {
                        let row = res[i];
                        try {
                            let user = await this.getUserById(row.id);
                            result = [
                                ...result,
                                new AssumedDiscordUser(user, [new Assumption("name", name, user.name), new Assumption("discriminator", discriminator, user.discriminator)]),
                            ];
                        } catch (e) {
                            global.api.Logger.warning(e);
                        }
                    }
                    resolve(result);
                } else {
                    reject("No users were found!");
                }
            });
        });
    }

    /**
     * Gets a list of users based on an identity
     * @param {number} id
     * @returns {Promise<DiscordUser[]>}
     */
    getUsersByIdentity(id) {
        return new Promise((resolve, reject) => {
            con.query("select id from discord__user where identity_id = ?;", [id], async (err, res) => {
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
     * Returns the DiscordGuild via an ID
     * @param {number} id 
     * @param {boolean} overrideCache
     * @returns {Promise<DiscordGuild>}
     */
    getGuild(id, overrideCache) {
        return this.guildCache.get(id, async (resolve, reject) => {
            while (!this.listenersInitialized) {
                global.api.Logger.warning("Guild requested without listeners intialized");
                await sleep(250);
            }

            con.query("select * from discord__guild where id = ?;", [id], async (err, res) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (res.length === 1) {
                    let row = res[0];

                    let guild = new DiscordGuild(
                        row.id,
                        await global.api.getFullIdentity(row.represents_id),
                        await this.getUserById(row.owner_id),
                        row.name,
                        this.listeners.filter(x => x.guild.id === id)
                    );

                    resolve(guild);
                } else {
                    reject("No guild was found!");
                }
            });
        }, overrideCache);
    }
}

module.exports = Discord;