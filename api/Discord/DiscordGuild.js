const con = require("../../database");
const DiscordUser = require("./DiscordUser");

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
                await this.#addCommand(guild, userCommand.data);
                await this.#addCommand(guild, chatdumpCommand.data);

                if (guild.commands.cache.find(command => command.name === "register")) {
                    try {
                        await guild.commands.cache.find(command => command.name === "register").delete();
                    } catch(err) {
                        global.api.Logger.warning(err);
                    }
                }
                
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
                    resolve(this);
                    global.api.Discord.guildCache.remove(this.id);
                }
            });
        })
    }
}

module.exports = DiscordGuild;