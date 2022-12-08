const { MessageEmbed, MessageButton, MessageActionRow, MessageSelectMenu, ThreadChannel, Message } = require("discord.js");
const FullIdentity = require("../FullIdentity");
const TwitchUser = require("../Twitch/TwitchUser");

const con = require("../../database");

const config = require("../../config.json");

class Group {
    /**
     * 8-character unique ID for this group, lowercase
     * @type {string}
     */
    id;

    /**
     * Identity that created this group
     * @type {FullIdentity}
     */
    created_by;

    /**
     * Message ID for this group object
     * @type {string}
     */
    message;

    /**
     * Thread for this group object
     * @type {ThreadChannel}
     */
    thread;

    /**
     * Game being played for this group
     * @type {string}
     */
    game;

    /**
     * Whether the group is currently playing or not
     * @type {boolean}
     */
    active;

    /**
     * Start time for this group
     * @type {Date?}
     */
    starttime;

    /**
     * End time for this group
     * @type {Date?}
     */
    endtime;

    /**
     * Host for this Group
     * @type {TwitchUser}
     */
    host;

    /**
     * Participants in this group
     * @type {TwitchUser[]}
     */
    participants;

    /**
     * 
     * @param {string} id 
     * @param {FullIdentity} created_by
     * @param {string} message 
     * @param {string} game 
     * @param {boolean} active 
     * @param {Date?} starttime 
     * @param {Date?} endtime 
     * @param {TwitchUser} host 
     * @param {TwitchUser[]} participants
     */
    constructor(id, created_by, message, game, active, starttime, endtime, host, participants) {
        this.id = id;
        this.created_by = created_by;
        this.message = message;
        this.game = game;
        this.active = active;
        this.starttime = starttime;
        this.endtime = endtime;
        this.host = host;
        this.participants = participants;
    }

    /**
     * Generates an embed of this Group
     * @type {Promise<MessageEmbed>}
     */
    generateEmbed() {
        return new Promise(async (resolve, reject) => {
            try {
                let hostIdentity = null;
                if (this.host.identity?.id) {
                    hostIdentity = await global.api.getFullIdentity(this.host.identity.id);
                }

                const embed = new MessageEmbed()
                    .setTitle(this.game + " hosted by " + this.host.display_name)
                    .setURL(config.pub_domain + "g/" + this.id)
                    .setAuthor({iconURL: this.host.profile_image_url, name: this.host.display_name})
                    .setColor(0x772ce8)
                    .setFooter({text: "ID: " + this.id, iconURL: "https://tms.to/assets/images/logos/logo.webp"})
                    .addFields([
                        {name: "Host", value: "[" + this.host.display_name + "](https://twitch.tv/" + this.host.display_name.toLowerCase() + ")" + (hostIdentity === null || hostIdentity.discordAccounts.length === 0 ? "" : " [<@" + hostIdentity.discordAccounts[0].id + ">]"), inline: true},
                        {name: "Posted By", value: `<@${this.created_by.discordAccounts[0].id}>`, inline: true},
                    ]);

                let participantList = "";

                for (let i = 0; i < this.participants.length; i++) {
                    let participant = this.participants[i];

                    if (participantList !== "") participantList += "\n";

                    participantList += "**" + (i + 1) + "** - [" + participant.display_name + "](https://twitch.tv/" + participant.display_name.toLowerCase() + ")";

                    if (participant.identity?.id) {
                        let identity = await api.getFullIdentity(participant.identity.id);
                        if (identity.discordAccounts.length > 0) {
                            participantList += " [<@" + identity.discordAccounts[0].id + ">]";
                        }
                    }
                }

                embed.addFields([{name: "Participants", value: participantList, inline: false}]);

                if (this.starttime) {
                    const ts = this.starttime.getTime().toString().substring(0, this.starttime.getTime().toString().length - 3);
                    embed.addFields({name: "Start Time", value: `<t:${ts}:f>\nThis event is/was <t:${ts}:R>`, inline: true});
                    embed.setTimestamp(this.starttime);
                }

                if (this.endtime) {
                    const ts = this.starttime.getTime().toString().substring(0, this.endtime.getTime().toString().length - 3);
                    embed.addFields({name: "End Time", value: `<t:${ts}:f>\nThis event is/was <t:${ts}:R>`, inline: true});
                }
                
                resolve(embed);
            } catch(err) {
                reject(err);
            }
        })
    }

    /**
     * Generates the MessageActionRow for this group
     * @type {Promise<MessageActionRow>}
     */
    generateComponents() {
        return new Promise((resolve, reject) => {
            const editButton = new MessageButton()
                .setCustomId("edit-group")
                .setLabel("Edit")
                .setStyle("SECONDARY");

            const startButton = new MessageButton()
                .setCustomId("start-group")
                .setLabel("Start Event")
                .setStyle("SUCCESS");

            const row = new MessageActionRow()
                .addComponents(editButton);

            if (this.active) {
                const stopButton = new MessageButton()
                    .setCustomId("stop-group")
                    .setLabel("Stop Event")
                    .setStyle("DANGER");

                const setGroupCommand = new MessageButton()
                    .setCustomId("set-command")
                    .setLabel("Set Group Command")
                    .setStyle("PRIMARY");

                row.addComponents(stopButton, setGroupCommand);
            } else
                row.addComponents(startButton);

            resolve(row);
        });
    }

    /**
     * Generates the edit message for this group
     * @param {boolean} showDelete 
     * @param {FullIdentity} executor 
     * @returns {Promise<{content:string,embeds:MessageEmbed[],components:MessageActionRow[],ephemeral:boolean}>}
     */
    generateEditMessage(showDelete = false, executor = null) {
        return new Promise((resolve, reject) => {
            let token = global.api.stringGenerator(32);
            con.query("update `group` set token = ?, token_identity = ? where id = ?;", [token, executor?.id, this.id], (err) => {
                if (err) global.api.Logger.severe(err);
            });

            const embed = new MessageEmbed()
                .setTitle("Edit Group")
                .setColor(0x772ce8)
                .setDescription(`\`${this.game}\` hosted by [${this.host.display_name}](https://twitch.tv/${this.host.display_name.toLowerCase()})`)
                .setFooter({text: "ID: " + this.id, iconURL: "https://tms.to/assets/images/logos/logo.webp"});

            const setStartTime = new MessageButton()
                .setLabel("Set Start Time")
                .setStyle("LINK")
                .setURL(`${config.pub_domain}g/${token}/settime`);

            const setGame = new MessageButton()
                .setCustomId("group-setgame-" + this.id)
                .setLabel("Set Game")
                .setStyle("SECONDARY");

            const addParticipant = new MessageButton()
                .setCustomId("group-addpartic-" + this.id)
                .setLabel("Add Participant")
                .setStyle("PRIMARY");

            const removeParticipants = new MessageSelectMenu()
                .setCustomId("group-rempartic-" + this.id)
                .setMinValues(1)
                .setMaxValues(this.participants.length)
                .setPlaceholder("Remove Participants");

            removeParticipants.addOptions(this.participants.map(x => {return {value: ""+x.id, label: x.display_name}}))

            const buttonRow = new MessageActionRow()
                .addComponents(setStartTime, setGame, addParticipant);

            const removeParticipantsRow = new MessageActionRow()
                .addComponents(removeParticipants);

            resolve({content: ' ', embeds: [embed], components: [buttonRow, removeParticipantsRow], ephemeral: true});
        });
    }

    /**
     * Updates the Discord message for this group
     * @returns {Promise<void>}
     */
    updateMessage() {
        return new Promise((resolve, reject) => {
            global.client.discord.channels.fetch(config.groups_channel).then(channel => {
                channel.messages.fetch(this.message).then(async message => {
                    message.edit({content: ' ', embeds: [await this.generateEmbed()], components: [await this.generateComponents()]}).then(resolve, reject);
                }, reject);
            }, reject)
        });
    }

    /**
     * Returns the thread for this group
     * @returns {Promise<ThreadChannel>}
     */
    getThread() {
        return new Promise((resolve, reject) => {
            if (this.thread) {
                resolve(this.thread);
            } else {
                con.query("select thread from `group` where id = ?;", [this.id], (err, res) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (res.length > 0 && res[0].thread) {
                            global.client.discord.channels.fetch(res[0].thread).then(thread => {
                                this.thread = thread;
                                resolve(thread);
                            }, reject)
                        } else {
                            global.client.discord.channels.fetch(config.groups_channel).then(channel => {
                                channel.threads.create({
                                    name: `${this.game} game by ${this.host.display_name} [${this.id}]`,
                                    reason: this.id,
                                    autoArchiveDuration: 60,
                                    startMessage: this.message,
                                }).then(thread => {
                                    con.query("update `group` set thread = ? where id = ?;", [thread.id, this.id], err => {
                                        if (err) global.api.Logger.severe(err);
                                    });
                                    this.thread = thread;
                                    resolve(thread);
                                }, reject);
                            }, reject)
                        }
                    }
                });
            }
        });
    }

    /**
     * Returns the base update embed for Group updates
     * @returns {MessageEmbed}
     */
    getUpdate() {
        return new MessageEmbed()
            .setTitle("Group Update")
            .setColor(0x4d8ef7)
            .setFooter({text: "ID: " + this.id, iconURL: "https://tms.to/assets/images/logos/logo.webp"});
    }

    /**
     * Sends the update embed into the thread channel
     * @param {MessageEmbed} embed
     * @param {FullIdentity} executor 
     * @returns {Promise<Message>}
     */
    sendUpdate(embed, executor) {
        return new Promise((resolve, reject) => {
            embed.setAuthor({name: executor.name, iconURL: executor.avatar_url});
            this.getThread().then(thread => {
                thread.send({content: ' ', embeds: [embed]}).then(resolve, reject);
            }, reject);
        });
    }

    /**
     * Sets a new game for this group
     * @param {string} game 
     * @param {FullIdentity} executor 
     * @returns {Promise<void>} 
     */
    setGame(game, executor = null) {
        return new Promise((resolve, reject) => {
            con.query("update `group` set game = ? where id = ?;", [game, this.id], err => {
                if (err) {
                    reject(err);
                } else {
                    if (executor) this.sendUpdate(this.getUpdate()
                        .addFields([
                            {name: "Old Game", value: "`"+this.game+"`", inline: true},
                            {name: "New Game", value: "`"+game+"`", inline: true},
                        ]), executor).catch(global.api.Logger.warning);
                    this.game = game;
                    this.updateMessage().then(resolve, reject);
                }
            });
        });
    }

    /**
     * Sets a new start time for this group
     * @param {Date} time 
     * @param {FullIdentity} executor
     * @returns {Promise<void>}
     */
    setStartTime(time, executor = null) {
        return new Promise((resolve, reject) => {
            con.query("update `group` set starttime = ?, token = null where id = ?;", [time.getTime(), this.id], err => {
                if (err) {
                    reject(err);
                } else {
                    if (executor) this.sendUpdate(this.getUpdate()
                        .addFields([
                            {name: "Old Start Time", value: this.starttime ? "<t:" + this.starttime.getTime().toString().substring(0, this.starttime.getTime().toString().length - 3) + ":f>" : "Unset", inline: true},
                            {name: "New Start Time", value: "<t:" + time.getTime().toString().substring(0, time.getTime().toString().length - 3) + ":f>", inline: true},
                        ]), executor).catch(global.api.Logger.warning);
                    this.starttime = time;
                    this.updateMessage().then(resolve, reject);
                }
            });
        });
    }

    /**
     * Sets a new end time for this group
     * @param {Date} time 
     * @param {FullIdentity} executor
     * @returns {Promise<void>}
     */
    setEndTime(time, executor = null) {
        return new Promise((resolve, reject) => {
            con.query("update `group` set endtime = ? where id = ?;", [time.getTime(), this.id], err => {
                if (err) {
                    reject(err);
                } else {
                    if (executor) this.sendUpdate(this.getUpdate()
                        .addFields([
                            {name: "Old End Time", value: this.endtime ? "<t:" + this.endtime.getTime().toString().substring(0, this.endtime.getTime().toString().length - 3) + ":f>" : "Unset", inline: true},
                            {name: "New End Time", value: "<t:" + time.getTime().toString().substring(0, time.getTime().toString().length - 3) + ":f>", inline: true},
                        ]), executor).catch(global.api.Logger.warning);
                    this.endtime = time;
                    this.updateMessage().then(resolve, reject);
                }
            });
        });
    }

    /**
     * Sets a user as the host for this Group
     * @param {TwitchUser} user 
     * @param {FullIdentity} executor 
     * @returns {Promise<void>}
     */
    setHost(user, executor = null) {
        return new Promise((resolve, reject) => {
            con.query("insert into group__user (group_id, user_id, host) values (?, ?, true) on duplicate key update host = true;", [this.id, user.id], err => {
                if (err) {
                    reject(err);
                } else {
                    if (executor) this.sendUpdate(this.getUpdate()
                        .addFields([
                            {name: "Old Host", value: `[${this.host.display_name}](https://twitch.tv/${this.host.display_name.toLowerCase()})`, inline: true},
                            {name: "New Host", value: `[${user.display_name}](https://twitch.tv/${user.display_name.toLowerCase()})`, inline: true},
                        ]), executor).catch(global.api.Logger.warning);
                    this.host = user;
                    this.participants = this.participants.filter(x => x.id !== user.id);
                    this.updateMessage().then(resolve, reject);
                }
            });
        });
    }

    /**
     * Remove participants from this group
     * @param {TwitchUser} participant 
     * @param {FullIdentity} executor 
     * @returns {Promise<void>}
     */
    addParticipant(participant, executor = null) {
        return new Promise(async (resolve, reject) => {
            if (!this.participants.find(x => x.id === participant.id)) {
                con.query("insert into group__user (group_id, user_id) values (?, ?) on duplicate key update host = false;", [this.id, participant.id], err => {
                    if (err) {
                        reject(err);
                    } else {
                        if (executor) this.sendUpdate(this.getUpdate()
                            .addFields([
                                {name: "New Participant", value: `[${participant.display_name}](https://twitch.tv/${participant.display_name.toLowerCase()})`, inline: true},
                            ]), executor).catch(global.api.Logger.warning);
                        this.participants = [
                            ...this.participants,
                            participant,
                        ]
                        this.updateMessage().then(resolve, reject);
                    }
                })
            } else {
                resolve();
            }
        });
    }

    /**
     * Remove participants from this group
     * @param {TwitchUser[]} participants 
     * @param {FullIdentity} executor 
     * @returns {Promise<void>}
     */
    removeParticipants(participants, executor = null) {
        return new Promise(async (resolve, reject) => {
            try {
                let participantString = "";
                
                for (let i = 0; i < participants.length; i++) {
                    let participant = participants[i];
                    if (participant.id !== this.host.id) {
                        if (participantString !== "") participantString += "\n";
                        participantString += `[${participant.display_name}](https://twitch.tv/${participant.display_name.toLowerCase()})`;
                        await con.pquery("delete from group__user where group_id = ? and user_id = ? and host = false;", [this.id, participant.id]);
                        this.participants = this.participants.filter(x => x.id !== participant.id);
                    }
                }

                if (executor) this.sendUpdate(this.getUpdate()
                    .setColor(0x9e392f)
                    .addFields([
                        {name: "Removed Participants", value: participantString, inline: true},
                    ]), executor).catch(global.api.Logger.warning);
                this.updateMessage().then(resolve, reject);
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Starts this event
     * @param {FullIdentity} executor 
     * @returns {Promise<void>}
     */
    start(executor = null) {
        return new Promise((resolve, reject) => {
            con.query("update `group` set active = true where id = ?;", [this.id], err => {
                if (err) {
                    reject(err);
                } else {
                    this.setStartTime(new Date(), executor).then(resolve, reject);
                }
            });
        });
    }

    /**
     * Generates a group string based on the active streamer
     * @param {TwitchUser} streamer 
     * @return {string}
     */
    generateGroupString(streamer = null) {
        let participants = streamer ? this.participants.filter(x => x.id !== streamer.id) : this.participants;
        let groupString = "";

        participants.forEach((participant, i) => {
            if (i + 1 === participants.length && groupString !== "") {
                groupString += " and ";
            } else if (groupString !== "") {
                groupString += ", ";
            }
            groupString += participant.display_name;
        });

        return (streamer ? streamer.display_name : "*Streamer*") + " is playing " + this.game + " with " + groupString;
    }

    /**
     * Generates a multitwitch link for the group
     * @return {string}
     */
    generateMultiLink(host) {
        let groupString = host;

        this.participants.forEach((participant, i) => {
            groupString += "/" + encodeURI(participant.display_name.toLowerCase());
        });

        return groupString;
    }
}

module.exports = Group;
