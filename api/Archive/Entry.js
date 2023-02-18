const {EmbedBuilder, TextChannel, GuildMember, ButtonBuilder, MessageActionRow, MessageSelectMenu, Message} = require("discord.js");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require("fs");
const mime = require("mime-types");
const con = require("../../database");

const DIRECTORY = "./files/";
const TEMP_DIRECTORY = DIRECTORY + "temp/";
const DELETED_DIRECTORY = DIRECTORY + "deleted/";
const DOWNLOADABLE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

const FullIdentity = require("../FullIdentity");

const Identity = require("../Identity");
const TwitchUser = require("../Twitch/TwitchUser");
const DiscordUser = require("../Discord/DiscordUser");

const EntryUser = require("./EntryUser");

const config = require("../../config.json");
const EntryFile = require("./EntryFile");
const FILE_ENDPOINT = config.api_domain + "file/";

const createCrossbanButton = user => {
    const crossbanButton = new ButtonBuilder()
            .setCustomId("cb-" + user.id)
            .setLabel("Crossban " + user.display_name)
            .setStyle("DANGER");

    return crossbanButton;
}

class Entry {
    /**
     * Eight character unique ID for this entry
     * @type {string}
     */
    id;

    /**
     * Owner of the Entry
     * @type {FullIdentity}
     */
    owner;

    /**
     * Short offense description for the entry
     * @type {string}
     */
    offense;

    /**
     * Longer description of the entry
     * @type {string}
     */
    description;

    /**
     * Users attached to this entry
     * @type {EntryUser[]}
     */
    users;

    /**
     * Files attached to this entry
     * @type {EntryFile[]}
     */
    files;

    /**
     * Time that the entry was submitted.
     * @type {number}
     */
    time_submitted;

    /**
     * Constructor for a new Entry
     * @param {string} id 
     * @param {FullIdentity} owner
     * @param {string} offense 
     * @param {string} description 
     * @param {EntryUser[]} users 
     * @param {EntryFile[]} files 
     */
    constructor(id, owner, offense, description, users, files, time_submitted) {
        this.id = id;
        this.owner = owner;
        this.offense = offense;
        this.description = description;
        this.users = users;
        this.files = files;
        this.time_submitted = time_submitted;
    }

    /**
     * Generates a Discord Embed for this entry
     * @returns {Promise<EmbedBuilder>}
     */
    discordEmbed() {
        return new Promise(async (resolve, reject) => {
            let discordAccount;
    
            if (this.owner?.discordAccounts && this.owner.discordAccounts.length > 0) {
                discordAccount = this.owner.discordAccounts[0];
            }

            let users = "";

            for (let i = 0; i < this.users.length; i++) {
                let user = this.users[i];
                if (users !== "") users += "\n";

                let name = user.value;
                let resolved = "";

                if (user.user) {
                    if (user.type === "identity") {
                        try {
                            let identity = await user.resolveUser();
                            name = identity.name;
                            resolved = identity.id;
                        } catch(e) {}
                    } else if (user.type === "twitch") {
                        try {
                            let twitch = await user.resolveUser();
                            name = twitch.display_name;
                            resolved = twitch.id;
                        } catch(e) {}
                    } else if (user.type === "discord") {
                        try {
                            let discord = await user.resolveUser();
                            name = discord.name + "#" + discord.discriminator;
                            resolved = "<@" + discord.id + ">";
                        } catch(e) {}
                    }
                }

                users += `**${user.getType()}:** ${name}${(resolved === "" ? "" : " (" + resolved + ")")}`;
            }

            let files = "";

            for (let i = 0; i < this.files.length; i++) {
                let file = this.files[i];
                if (files !== "") files += "\n";

                let label = file.label ? file.label : file.name;
                if (file.local_path) {
                    files += `[${label}](${FILE_ENDPOINT + file.name})`;
                } else {
                    files += `[${label}](${file.remote_path})`;
                }
            }
            
            const embed = new EmbedBuilder()
                .setColor(0x772ce8)
                .setTitle("Ban Entry")
                .addField("Offense", "```" + this.offense + "```")
                .addField("Description", "```" + this.description + "```")
                .setDescription("**Submitted by " + (this.owner?.name ? this.owner.name : "Unresolvable") + "**" + (discordAccount ? " (<@" + discordAccount.id + ">)" : ""))
                .setTimestamp(this.time_submitted)
                .setFooter({text: "ID: " + this.id, iconURL: "https://tms.to/assets/images/logos/logo.webp"});
        
            if (users !== "") {
                embed.addField("User Accounts", users);
            }

            if (files !== "") {
                embed.addField("Files & Links", files);
            }
            
    
            resolve(embed);
        });
    }

    /**
     * Generates a crossban button row for this entry
     * @returns {Promise<MessageActionRow>}
     */
    createCrossbanRow() {
        return new Promise(async (resolve, reject) => {
            let row = new MessageActionRow();
            
            for (let i = 0; i < this.users.length; i++) {
                let user = this.users[i];

                try {
                    if (user.type === "twitch" && user.user) {
                        row.addComponents(createCrossbanButton(await user.resolveUser()));
                    } else if (user.type === "identity") {
                        const identity = await user.resolveUser();
                        if (identity) {
                            identity.twitchUsers.forEach(tuser => {
                                row.addComponents(createCrossbanButton(tuser));
                            })
                        }
                    }
                } catch (err) {
                    global.api.Logger.warning(err);
                }
            }

            resolve(row);
        });
    }

    /**
     * Edits all messages attached to this Entry with any new information received.
     * @returns {Promise<void>}
     */
    refreshMessages() {
        return new Promise((resolve, reject) => {
            con.query("select * from archive__messages where archive_id = ? and reason <> 'update';", [this.id], async (err, res) => {
                if (err) {
                    reject(err);
                    return;
                }
    
                let newEmbed = await this.discordEmbed();
                let editMessage = await this.parseEditMessage();
    
                res.forEach(messageObj => {
                    if (messageObj.reason === "receipt") {
                        global.client.discord.users.fetch(messageObj.channel_id).then(user => {
                            user.createDM().then(channel => {
                                channel.messages.fetch(messageObj.id).then(async message => {
                                    let content = ((message.content && message.content.length > 0) ? message.content : " ");
                                    message.edit({content: content, embeds: [newEmbed]}).then(() => {}, global.api.Logger.warning);
                                }, global.api.Logger.warning);
                            }, global.api.Logger.warning);
                        });
                    } else if (messageObj.reason === "edit") {
                        global.client.discord.users.fetch(messageObj.channel_id).then(user => {
                            user.createDM().then(channel => {
                                channel.messages.fetch(messageObj.id).then(async message => {
                                    message.edit(editMessage).then(() => {}, global.api.Logger.warning);
                                }, global.api.Logger.warning);
                            }, global.api.Logger.warning);
                        });
                    } else {
                        global.client.discord.channels.fetch(messageObj.channel_id).then(channel => {
                            channel.messages.fetch(messageObj.id).then(async message => {
                                let content = ((message.content && message.content.length > 0) ? message.content : " ");
                                let msg = {content: content, embeds: [newEmbed]};
                                const row = await this.createCrossbanRow();
                                if (row.components.length > 0)
                                    msg.components = [row];

                                message.edit(msg).then(() => {}, global.api.Logger.warning);
                            }, global.api.Logger.warning);
                        });
                    }
                });
                resolve();
            });
        });
    }

    /**
     * Returns the pulic record Discord message for this archive entry
     * @returns {Promise<Message>}
     */
     getPublicRecordMessage() {
        return new Promise((resolve, reject) => {
            con.query("select id, channel_id from archive__messages where archive_id = ? and reason = 'public-record';", [this.id], (err, res) => {
                if (!err) {
                    if (res.length > 0) {
                        let row = res[0];
                        global.client.discord.channels.fetch(row.channel_id).then(channel => {
                            channel.messages.fetch(row.id).then(message => {
                                resolve(message);
                            }, reject)
                        }, reject);
                    } else {
                        reject("No public record found for this archive entry!");
                    }
                } else {
                    reject(err);
                }
            });
        });
    }

    /**
     * Sets a new owner for this entry.
     * @param {Identity} newOwner 
     * @param {FullIdentity} executor 
     * @returns {Promise<void>}
     */
    setOwner(newOwner, executor = null) {
        return new Promise(async (resolve, reject) => {
            let oldOwnerId = this.owner?.id;
            this.owner = await global.api.getFullIdentity(newOwner.id);
            con.query("update archive set owner_id = ? where id = ?;", [this.owner.id, this.id], err => {
                if (err) {
                    reject(err);
                    return;
                }
                this.refreshMessages();
                con.query("insert into archive__logs (archive_id, action, initiated_by, old_value, new_value) values (?, 'set-owner', ?, ?, ?);", [this.id, executor?.id, oldOwnerId, this.owner.id], err => {
                    if (err) {
                        reject(err);
                    } else resolve();
                });
            });
        });
    }

    /**
     * Sets a new offense for this entry
     * @param {string} offense 
     * @param {FullIdentity} executor 
     * @returns {Promise<void>}
     */
    setOffense(offense, executor = null) {
        return new Promise((resolve, reject) => {
            let old = this.offense;
            con.query("update archive set offense = ? where id = ?;", [offense, this.id], err => {
                if (err) {
                    reject(err);
                    return;
                }
                this.offense = offense;
                this.refreshMessages();
                con.query("insert into archive__logs (archive_id, action, initiated_by, old_value, new_value) values (?, 'set-offense', ?, ?, ?);", [this.id, executor?.id, old, this.offense], err => {
                    if (err) {
                        reject(err);
                    } else resolve();
                });
            });
        });
    }

    /**
     * Sets a new description for this entry
     * @param {string} description 
     * @param {FullIdentity} executor 
     * @returns {Promise<void>}
     */
    setDescription(description, executor = null) {
        return new Promise((resolve, reject) => {
            let old = this.description;
            con.query("update archive set description = ? where id = ?;", [description, this.id], err => {
                if (err) {
                    reject(err);
                    return;
                }
    
                this.description = description;
                this.refreshMessages();
    
                con.query("insert into archive__logs (archive_id, action, initiated_by, old_value, new_value) values (?, 'set-description', ?, ?, ?);", [this.id, executor?.id, old, this.description], err => {
                    if (err) {
                        reject(err);
                    } else resolve(); 
                });
            });
        });
    }

    /**
     * Removes a user from this entry
     * @param {number} userId 
     * @param {FullIdentity} executor 
     * @returns {Promise<void>}
     */
    removeUser(userId, executor = null) {
        return new Promise((resolve, reject) => {
            con.query("delete from archive__users where id = ? and archive_id = ?;", [userId, this.id], err => {
                if (err) {
                    reject(err);
                    return;
                }
    
                let removedUser = this.users.find(x => x.id == userId);
                this.users = this.users.filter(x => x.id != userId);
                this.refreshMessages();
    
                con.query("insert into archive__logs (archive_id, action, initiated_by, old_value) values (?, 'remove-user', ?, ?);", [this.id, executor?.id, removedUser?.value], err => {
                    if (err) {
                        reject(err);
                    } else resolve();
                });
            });
        });
    }

    /**
     * Removes a file from this entry
     * @param {number} fileId 
     * @param {FullIdentity} executor 
     * @returns {Promise<void>}
     */
    removeFile(fileId, executor = null) {
        return new Promise((resolve, reject) => {
            con.query("delete from archive__files where id = ? and archive_id = ?;", [fileId, this.id], err => {
                if (err) {
                    reject(err);
                    return;
                }
    
                let removedFile = this.files.find(x => x.id == fileId);
                this.files = this.files.filter(x => x.id != fileId);
                this.refreshMessages();

                if (removedFile?.local_path) {
                    try {
                        fs.renameSync(removedFile.local_path, DELETED_DIRECTORY + removedFile.name);
                    } catch (e) {}
                }
    
                con.query("insert into archive__logs (archive_id, action, initiated_by, old_value) values (?, 'remove-file', ?, ?);", [this.id, executor?.id, removedFile?.remote_path], err => {
                    if (err) {
                        reject(err);
                    } else resolve();
                });
            });
        });
    }

    /**
     * Adds a user to the Entry.
     * Including a type is always recommended, however it will be overwritten based on the type of the Value.
     * @param {string|Identity|TwitchUser|DiscordUser} value
     * @param {"identity"|"twitch"|"discord"} type
     * @param {FullIdentity} executor
     * @returns {Promise<void>}
     */
    addUser(value, type = null, executor = null) {
        return new Promise((resolve, reject) => {
            let user = false;

            if (typeof(value) === "string" && type === null) {
                reject("A type must be provided if the value is a string!");
            }

            if (value instanceof Identity
            || value instanceof TwitchUser
            || value instanceof DiscordUser) {
                user = true;
                value = value.id;
            }

            if (value instanceof Identity) {
                type = "identity";
            } else if (value instanceof TwitchUser) {
                type = "twitch";
            } else if (value instanceof DiscordUser) {
                type = "discord";
            }

            con.query("insert into archive__users (archive_id, type, user, value) values (?, ?, ?, ?);", [this.id, type, user, value], err => {
                if (err) {
                    reject(err);
                    return;
                }
                con.query("select id from archive__users where archive_id = ? and type = ? and user = ? and value = ?;", [this.id, type, user, value], (err, res) => {
                    if (err) {
                        global.api.Logger.warning(err);
                        reject(err);
                        return;
                    }

                    if (res.length > 0) {
                        this.users = [
                            ...this.users,
                            new EntryUser(res[0].id, type, user, value),
                        ];
                        this.refreshMessages();
                        con.query("insert into archive__logs (archive_id, action, initiated_by, new_value) values (?, 'add-user', ?, ?);", [this.id, executor?.id, value], err => {
                            if (err) {
                                reject(err);
                            } else resolve();
                        });
                    } else {
                        reject("Unable to retrieve added user! I'm not sure how this happened");
                    }
                });
            });
        });
    }

    /**
     * Retrieves information from the URL and downloads it for the archive entry
     * @param {URL} url 
     * @param {string} label 
     * @param {FullIdentity} executor
     * @returns {Promise<void>}
     */
    addFile(url, label = null, executor = null) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await fetch(url);
        
                let content_type = result.headers.get("Content-Type").toLowerCase();
                let name = url.toString();
                let remote_path = url.toString();
                let local_path = null;

                if (DOWNLOADABLE_TYPES.includes(content_type)) {
                    name = api.stringGenerator(32) + (mime.extension(content_type) ? "." + mime.extension(content_type) : "");
                
                    local_path = DIRECTORY + name;
                    
                    result.body.pipe(fs.createWriteStream(local_path));
                }

                con.query("insert into archive__files (archive_id, local_path, remote_path, name, label, content_type) values (?, ?, ?, ?, ?, ?);", [this.id, local_path, remote_path, name, label, content_type], err => {
                    if (err) {
                        global.api.Logger.warning(err);
                        reject(err);
                        return;
                    }

                    con.query("select id from archive__files where archive_id = ? and local_path = ? and remote_path = ? and name = ? and label = ? and content_type = ?;", [this.id, local_path, remote_path, name, label, content_type], (err, res) => {
                        if (err) {
                            global.api.Logger.warning(err);
                            reject(err);
                            return;
                        }
    
                        if (res.length > 0) {
                            let file = new EntryFile(res[0].id, local_path, remote_path, name, label, content_type);
                            this.files = [
                                ...this.files,
                                file,
                            ];
                            this.refreshMessages();
                            con.query("insert into archive__logs (archive_id, action, initiated_by, new_value) values (?, 'add-file', ?, ?);", [this.id, executor?.id, remote_path], err => {
                                if (err) {
                                    reject(err);
                                } else resolve(file);
                            });
                        } else {
                            reject("Unable to retrieve added file! I'm not sure how this happened");
                        }
                    });
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Command used to parse the edit message for this Entry. Allows easy edit to Entry edit messages.
     */
    async parseEditMessage() {
        const editEmbed = new EmbedBuilder()
            .setTitle("Edit this entry!")
            .setDescription("Utilize the buttons below to make edits to this entry.")
            .setColor(0xab5df5);

        const editOffense = new ButtonBuilder()
            .setCustomId("edit-offense")
            .setLabel("Edit Offense")
            .setStyle("PRIMARY");

        const editDescription = new ButtonBuilder()
            .setCustomId("edit-description")
            .setLabel("Edit Description")
            .setStyle("SECONDARY");

        const row1 = new MessageActionRow()
            .addComponents(editOffense, editDescription);

        const removeUsers = new MessageSelectMenu()
            .setCustomId("remove-users")
            .setMinValues(1)
            .setPlaceholder("Remove Users");
        
        for (let u = 0; u < this.users.length; u ++) {
            let user = this.users[u];
            removeUsers.addOptions({label: user.getType() + ": " + (user.user ? await user.resolveName() : user.value), value: ""+user.id});
        }
        
        const row2 = new MessageActionRow()
            .addComponents(removeUsers);

        const addTwitchUser = new ButtonBuilder()
            .setCustomId("add-twitch-user")
            .setLabel("Add Twitch User")
            .setStyle("PRIMARY");

        const addDiscordUser = new ButtonBuilder()
            .setCustomId("add-discord-user")
            .setLabel("Add Discord User")
            .setStyle("SECONDARY");

        const row3 = new MessageActionRow()
            .addComponents(addTwitchUser, addDiscordUser);

        const removeFiles = new MessageSelectMenu()
            .setCustomId("remove-files")
            .setMinValues(1)
            .setPlaceholder("Remove Files");
        
        for (let f = 0; f < this.files.length; f ++) {
            let file = this.files[f];
            removeFiles.addOptions({label: file.label ? file.label : file.remote_path, value: ""+file.id, description: file.content_type});
        }
        
        const row4 = new MessageActionRow()
            .addComponents(removeFiles);

        const addFile = new ButtonBuilder()
            .setCustomId("add-file")
            .setLabel("Add File")
            .setStyle("SECONDARY");

        const cancelButton = new ButtonBuilder()
            .setCustomId("cancel-edit")
            .setLabel("Cancel")
            .setStyle("DANGER");

        const row5 = new MessageActionRow()
            .addComponents(addFile, cancelButton);

        let components = [row1, row2, row3];
        if (this.files.length > 0) {
            components = [...components, row4];
        }
        components = [...components, row5];
        

        return {embeds: [await this.discordEmbed(), editEmbed], components: components};
    }

    /**
     * Opens the edit menu to edit this Entry
     * @param {GuildMember} discordMember
     * 
     * @returns {Promise<Message>}
     */
    openEdit(discordMember) {
        return new Promise(async (resolve, reject) => {
            discordMember.send(await this.parseEditMessage()).then(message => {
                con.query("insert into archive__messages (id, guild_id, channel_id, archive_id, reason) values (?, ?, ?, ?, 'edit');", [message.id, discordMember.guild.id, discordMember.id, this.id], err => {
                    if (err) reject(err);
                    resolve(message);
                });
            }, reject);
        });
    }

    /**
     * Deletes all data related to this entry, including all messages regarding it
     * 
     * @param {FullIdentity} executor 
     */
    delete(executor = null) {
        this.files.forEach(file => {
            if (file.local_path) {
                try {
                fs.renameSync(file.local_path, DELETED_DIRECTORY + file.name);
                } catch (e) {}
            }
        });

        con.query("select id, channel_id, reason from archive__messages where archive_id = ?;", [this.id], (err, res) => {
            if (err) {global.api.Logger.warning(err);return;}

            res.forEach(messageObj => {
                if (messageObj.reason === "receipt" || messageObj.reason === "update") {
                    global.client.discord.users.fetch(messageObj.channel_id).then(user => {
                        user.createDM().then(channel => {
                            channel.messages.fetch(messageObj.id).then(async message => {
                                if (messageObj.reason === "receipt") {
                                    message.edit({content: '***This archive entry has been deleted.***', embeds: [await this.discordEmbed()]}).then(() => {}, global.api.Logger.warning);
                                } else {
                                    message.delete().then(() => {}, global.api.Logger.warning);
                                }
                            }, global.api.Logger.warning);
                        }, global.api.Logger.warning);
                    });
                } else {
                    global.client.discord.channels.fetch(messageObj.channel_id).then(channel => {
                        channel.messages.fetch(messageObj.id).then(async message => {
                            message.delete().then(() => {}, global.api.Logger.warning);
                        }, global.api.Logger.warning);
                    });
                }
            });

            con.query("delete from archive__messages where archive_id = ?;", [this.id]);
            con.query("delete from archive__files where archive_id = ?;", [this.id]);
            con.query("delete from archive__users where archive_id = ?;", [this.id]);
            con.query("delete from archive where id = ?;", [this.id]);
            con.query("insert into archive__logs (archive_id, initiated_by, action) values (?, ?, 'delete');", [this.id, executor?.id]);
        });
    }

    /**
     * Moves the public record to a new channel.
     * @param {TextChannel} channel
     * @param {FullIdentity} executor 
     */
    move(channel, executor = null) {
        // Attempt to remove any public records that currently exist.

        con.query("select * from archive__messages where archive_id = ? and (reason = 'public-record' or reason = 'sort');", [this.id], async (err, res) => {
            if (err) {global.api.Logger.warning(err);return;}

            let oldChannel = null;

            for (let i = 0; i < res.length; i++) {
                let messageObj = res[i];
                try {
                    const channel = await global.client.discord.channels.fetch(messageObj.channel_id);
                    oldChannel = channel;
                    channel.messages.fetch(messageObj.id).then(message => {
                        message.delete();
                    }, global.api.Logger.warning);
                } catch (e) {
                    global.api.Logger.warning(e);
                }
            }

            con.query("delete from archive__messages where archive_id = ? and (reason = 'public-record' or reason = 'sort');", [this.id], async err => {
                if (err) {global.api.Logger.warning(err);return;}

                let msg = {embeds: [await this.discordEmbed()]};
                const row = await this.createCrossbanRow();
                if (row.components.length > 0) 
                    msg.components = [row];

                channel.send(msg).then(message => {

                    con.query("insert into archive__logs (archive_id, initiated_by, old_value, new_value, action) values (?, ?, ?, ?, 'move');", [
                        this.id,
                        executor?.id,
                        oldChannel?.id,
                        channel.id,
                    ], err => {
                        if (err) global.api.Logger.warning(err);
                    });

                    con.query("insert into archive__messages (id, guild_id, channel_id, archive_id, reason) values (?, ?, ?, ?, 'public-record');", [message.id, message.guild.id, message.channel.id, this.id], async err => {
                        if (err) global.api.Logger.warning(err);

                        if (this.owner?.discordAccounts.length > 0) {
                            let receiptMessage = null;
                            try {
                                receiptMessage = await con.pquery("select id from archive__messages where archive_id = ? and reason = 'receipt';", [this.id]);
                                if (receiptMessage && receiptMessage.length > 0) {
                                    receiptMessage = receiptMessage[0].id;
                                } else {
                                    receiptMessage = null;
                                }
                            }catch(e) {}

                            this.owner.discordAccounts.forEach(discordAccount => {
                                global.client.discord.users.fetch(discordAccount.id).then(discordUser => {
                                    discordUser.createDM().then(async dmChannel => {
                                        let executorString = "Someone";

                                        if (executor && executor?.discordAccounts?.length > 0) {
                                            executorString = "<@" + executor.discordAccounts[0].id + ">";
                                        }
                                        
                                        let from = "";

                                        if (oldChannel?.name) {
                                            from = " from #" + oldChannel.name;
                                        }

                                        const embed = new EmbedBuilder()
                                            .setTitle("Archive entry was moved!")
                                            .setDescription(executorString + " moved archive entry `" + this.id + "`" + from + " to [#" + message.channel.name + "](" + message.url + ")")
                                            .setColor(0x772ce8)
                                            .setTimestamp(Date.now())
                                            .setFooter({text: "Archive Entry Update", iconURL: "https://tms.to/assets/images/logos/logo.webp"});

                                        const addMessage = updateMessage => {
                                            con.query("insert into archive__messages (id, guild_id, channel_id, archive_id, reason) values (?, ?, ?, ?, 'update');", [updateMessage.id, message.guild.id, discordUser.id, this.id], err => {
                                                if (err) global.api.Logger.warning(err);
                                            });
                                        }

                                        const fallbackFunc = () => {
                                            dmChannel.send({embeds: [embed]}).then(addMessage, global.api.Logger.warning);
                                        }

                                        if (receiptMessage) {
                                            try {
                                                receiptMessage = await dmChannel.messages.fetch(receiptMessage);
                                                receiptMessage.reply({embeds: [embed]}).then(addMessage, fallbackFunc);
                                            } catch (e) {
                                                fallbackFunc();
                                            }
                                        } else {
                                            fallbackFunc();
                                        }
                                    }, global.api.Logger.warning);
                                }, global.api.Logger.warning);
                            });
                        }
                    });
                }, global.api.Logger.warning);
            });
        });
    }
}

module.exports = Entry;