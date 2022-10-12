const con = require("../../database");
const DiscordGuildSetting = require("./DiscordGuildSetting");
const DiscordUser = require("./DiscordUser");
const defaultSettings = require("../../mbm/settings.json");

const settingCommand = require("../../mbm/commands/setting");
const userCommand = require("../../mbm/commands/user");
const chatdumpCommand = require("../../mbm/commands/chatdump");

const config = require("../../config.json");

class DiscordGuild {
    /**
     * The discord ID of the guild that this represents
     * 
     * @type {number}
     */
    id;
    
    /**
     * The identity that the Guild represents
     * 
     * @type {FullIdentity}
     */
    represents;

    /**
     * The discord user of the owner
     * 
     * @type {DiscordUser}
     */
    owner;

    /**
     * Represents the name of the Guild
     * 
     * @type {string}
     */
    name;

    /**
     * Represents settings for this guild
     * 
     * @type {DiscordGuildSetting[]}
     */
    settings;

    /**
     * Removes a setting from the database
     * @param {string} name 
     * @returns {Promise<DiscordGuildSetting[]>}
     */
    removeSetting(setting) {
        return new Promise((resolve, reject) => {
            if (!this.settings) {
                reject("Settings was not retrieved. Call getSettings before using removeSetting");
                return;
            }
            con.query("delete from discord__setting where guild_id = ? and setting = ?;", [
                this.id,
                setting
            ], (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                this.settings = this.settings.filter(x => x.setting !== setting);
                resolve(this.settings);
            });
        });
    }

    /**
     * Sets a setting locally. Does not post
     * @param {string} setting 
     * @param {any} value 
     * @param {string} type
     * @returns {Promise<DiscordGuildSetting[]>}
     */
    setSetting(setting, value, type) {
        return new Promise((resolve, reject) => {
            this.settings = this.settings.filter(x => x.setting !== setting);
            this.settings = [
                ...this.settings,
                new DiscordGuildSetting(setting, value, type),
            ]
            resolve(this.settings);
        });
    }

    /**
     * Internal command to match a value to a specific type
     * @param {any} value 
     * @param {string} type 
     * @returns {Promise<string|number|boolean|Channel|User|Role>}
     */
    #typeMatchSetting(value, type) {
        return new Promise((resolve, reject) => {
            if (value === undefined || value === null) {
                resolve(null)
                return;
            }
            if (type === "string") {
                resolve(value);
            } else if (type === "boolean") {
                resolve(value == 1);
            } else if (type === "user") {
                global.client.mbm.users.fetch(value).then(resolve, () => reject("Discord user was not found!"));
            } else if (type === "channel") {
                global.client.mbm.channels.fetch(value).then(resolve, () => reject("Discord channel was not found!"));
            } else if (type === "role") {
                global.client.mbm.guilds.fetch(this.id).then(guild => {
                    guild.roles.fetch(value).then(resolve, () => reject("Discord role was not found!"));
                }, () => reject("Could not find Discord guild!"));
            } else if (type === "number") {
                try {
                    resolve(Number(value));
                } catch(err) {
                    reject(err);
                }
            } else {
                reject("Unknown type " + type);
            }
        });
    }

    /**
     * Gets a setting
     * @param {string} setting
     * @param {string} expectedType
     * @returns {Promise<string|number|boolean|Channel|User|Role>} Returns value of the setting
     */
    getSetting(setting, expectedType) {
        return new Promise((resolve, reject) => {
            if (!this.settings) {
                reject("Settings was not retrieved. Call getSettings before using getSetting");
                return;
            }
            let guildSetting = this.settings.find(x => x.setting === setting);

            if (guildSetting) {
                if (guildSetting.type !== expectedType) {
                    reject(`Type mismatch: Expected ${expectedType} got ${guildSetting.type}`);
                    return;
                }

                this.#typeMatchSetting(guildSetting.value, guildSetting.type).then(resolve, reject);
            } else {
                let defaultSetting = defaultSettings.find(x => x.value === setting);

                if (defaultSetting) {
                    if (defaultSetting.type !== expectedType) {
                        reject(`Type mismatch: Expected ${expectedType} got ${defaultSetting.type}`);
                        return;
                    }

                    this.#typeMatchSetting(defaultSetting.default, defaultSetting.type).then(resolve, reject);
                } else {
                    reject("Setting was not found");
                }
            }
        });
    }

    /**
     * Grabs settings from the database.
     * @returns {Promise<DiscordGuildSetting[]}
     */
    getSettings() {
        return new Promise((resolve, reject) => {
            con.query("select * from discord__setting where guild_id = ?;", [this.id], (err, res) => {
                if (err) {
                    reject(err);
                    return;
                }

                let settings = [];

                res.forEach(setting => {
                    settings = [
                        ...settings,
                        new DiscordGuildSetting(setting.setting, setting.value, setting.type),
                    ]
                });

                this.settings = settings;

                resolve(settings);
            });
        });
    }

    /**
     * Add a punishment for a user
     * @param {"kick"|"ban"} punishmentType
     * @param {DiscordUser} user 
     * @param {string?} reason
     * @param {DiscordUser?} executor
     * @returns {Promise<void>}
     */
    #addUserPunishment(punishmentType, user, reason, executor) {
        return new Promise((resolve, reject) => {
            con.query("insert into discord__" + punishmentType + " (guild_id, user_id, reason, executor) values (?, ?, ?, ?);", [
                this.id,
                user.id,
                reason,
                executor?.id ? executor.id : null
            ], err => {
                if (!err) {
                    resolve();
                } else
                    reject(err);
            });
        });
    }

    /**
     * Adds a user to display as a member of a guild
     * @param {DiscordUser} user 
     * @returns {DiscordGuild}
     */
    addUser(user) {
        return new Promise((resolve, reject) => {
            con.query("insert into discord__guild_user (guild_id, user_id) values (?, ?) on duplicate key update guild_id = ?;", [this.id, user.id, this.id], err => {
                if (err) {
                    global.api.Logger.warning(err);
                    reject(err);
                } else resolve(this);
            });
        });
    }

    /**
     * Removes a user from a guild
     * @param {DiscordUser} user 
     * @returns {DiscordGuild}
     */
    removeUser(user) {
        return new Promise((resolve, reject) => {
            con.query("delete from discord__guild_user where guild_id = ? and user_id = ?;", [this.id, user.id], err => {
                if (err) {
                    global.api.Logger.warning(err);
                    reject(err);
                } else resolve(this);
            });
        });
    }

    /**
     * Add a ban for a user
     * @param {DiscordUser} user 
     * @param {string?} reason
     * @param {DiscordUser?} executor
     * @returns {Promise<void>}
     */
    addUserBan(user, reason, executor) {
        return this.#addUserPunishment("ban", user, reason, executor);
    }

    /**
     * Add a kick for a user
     * @param {DiscordUser} user 
     * @param {string?} reason
     * @param {DiscordUser?} executor
     * @returns {Promise<void>}
     */
    addUserKick(user, reason, executor) {
        return this.#addUserPunishment("kick", user, reason, executor);
    }

    /**
     * Removes a ban for a user
     * @param {DiscordUser} user 
     * @returns {Promise<undefined>}
     */
    removeUserBan(user) {
        return new Promise((resolve, reject) => {
            con.query("update discord__ban set active = false where user_id = ? and guild_id = ?;", [
                user.id,
                this.id
            ], err => {
                if (!err) {
                    resolve();
                } else
                    reject(err);
            });
        });
    }

    /**
     * Add the command
     * @param {Guild} guild 
     * @param {object} commandData 
     * @param {boolean} modRole 
     * @returns {Promise<any>}
     */
    #addCommand(guild, commandData, modRole = false) {
        return new Promise(async (resolve, reject) => {
            const commands = guild.commands.cache;
            let command = commands.find(x => commandData.name === x.name);

            if (config.force_command_push) {
                await command.delete();
                command = null;
            }
            
            if (!command) {
                try {
                    command = await guild.commands.create(commandData);
                } catch (err) {
                    reject(err);
                    return;
                }
            }
            resolve();
        });
    }

    /**
     * Adds all MBM commands to a guild.
     * @param {Guild} guild 
     * @returns {Promise<void>}
     */
    addCommands(guild) {
        return new Promise(async (resolve, reject) => {
            try {
                await this.#addCommand(guild, settingCommand.data);
                await this.#addCommand(guild, userCommand.data);
                await this.#addCommand(guild, chatdumpCommand.data);
                
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Constructor for a DiscordGuild
     * @param {number} id 
     * @param {FullIdentity} represents 
     * @param {DiscordUser} owner 
     * @param {string} name 
     */
    constructor(id, represents, owner, name) {
        this.id = id;
        this.represents = represents;
        this.owner = owner;
        this.name = name;
    }

    /**
     * Updates or creates the guild with the information in this Object
     * 
     * @returns {Promise<DiscordGuild>}
     */
    post() {
        return new Promise(async (resolve, reject) => {
            this.represents = await this.represents.post();
            this.owner = await this.owner.post();
            con.query("insert into discord__guild (id, represents_id, owner_id, name) values (?, ?, ?, ?) on duplicate key update represents_id = ?, owner_id = ?, name = ?;", [
                this.id,
                this.represents.id,
                this.owner.id,
                this.name,
                this.represents.id,
                this.owner.id,
                this.name
            ], err => {
                if (err) {
                    reject(err);
                } else {
                    this.settings.forEach(setting => {
                        con.query("insert into discord__setting (guild_id, setting, value, type) values (?, ?, ?, ?) on duplicate key update value = ?, type = ?;", [
                            this.id,
                            setting.setting,
                            setting.value,
                            setting.type,
                            setting.value,
                            setting.type,
                        ], (err) => {if (err) global.api.Logger.warning(err);});
                    })
                    resolve(this);
                    global.api.Discord.guildCache.remove(this.id);
                }
            });
        })
    }
}

module.exports = DiscordGuild;