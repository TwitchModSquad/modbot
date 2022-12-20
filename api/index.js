const con = require("../database");

const Twitch = require("./Twitch/");
const Discord = require("./Discord/");
const SessionService = require("./Session/");
const Archive = require("./Archive/");
const Authentication = require("./Authentication/");

const Logger = require("./Logger");
const FullIdentity = require("./FullIdentity");

const Group = require("./Group/Group");

const Session = require("./Session");

class API {
    /**
     * Base Twitch API.
     * @type {Twitch}
     */
    Twitch = new Twitch();

    /**
     * Base Discord API
     * @type {Discord}
     */
    Discord = new Discord();

    /**
     * Base Session API
     * @type {SessionService}
     */
    Session = new SessionService();

    /**
     * Base Archive API
     * @type {Archive}
     */
    Archive = new Archive();

    /**
     * Base Authentication API
     * @type {Authentication}
     */
    Authentication = new Authentication();

    /**
     * Logger API
     * @type {Logger}
     */
    Logger = new Logger();

    /**
     * Returns the FullIdentity for an ID
     * @param {number} id 
     * @returns {Promise<FullIdentity>}
     */
    getFullIdentity(id) {
        return new Promise((resolve, reject) => {
            con.query("select * from identity where id = ?;", [id], async (err, res) => {
                if (!err) {
                    if (res.length > 0) {
                        let i_id = res[0].id;
                        let i_name = res[0].name;
                        let i_auth = res[0].authenticated;
                        let i_admin = res[0].admin;
                        let i_mod = res[0].moderator;

                        resolve(new FullIdentity(
                            i_id,
                            i_name,
                            i_auth,
                            i_admin,
                            i_mod,
                            await this.Twitch.getUsersByIdentity(i_id),
                            await this.Discord.getUsersByIdentity(i_id)
                            ));
                    } else {
                        reject("Identity was not found!");
                    }
                } else {
                    reject(err);
                }
            });
        });
    }

    /**
     * Gets a Session object from an ID
     * @param {string} id 
     * @returns {Promise<Session>}
     */
    getSession(id) {
        return new Promise((resolve, reject) => {
            con.query("select * from session where id = ?;", [id], async (err, res) => {
                if (!err) {
                    if (res.length > 0) {
                        let identity = null;

                        if (res[0].identity_id) {
                            identity = await this.getFullIdentity(res[0].identity_id);
                        }

                        resolve(new Session(res[0].id, identity, res[0].created));
                    } else {
                        reject("Session was not found!");
                    }
                } else {
                    reject(err);
                }
            });
        });
    }

    /**
     * Gets a Group object from an ID
     * @param {string} id 
     * @returns {Promise<Group>}
     */
    getGroupById(id) {
        return new Promise((resolve, reject) => {
            con.query("select * from `group` where id = ?;", [id], (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    if (res.length > 0) {
                        let group = res[0];
                        con.query("select user_id, host from group__user where group_id = ?;", [id], async (err, userres) => {
                            if (err) {
                                reject(err);
                            } else {
                                try {
                                    let createdBy = await api.getFullIdentity(group.created_by);

                                    let host = await api.Twitch.getUserById(userres.find(x => x.host == "1").user_id);
                                    
                                    let userRows = userres.filter(x => x.host == "0");
                                    let participants = [];
    
                                    for (let i = 0; i < userRows.length; i++) {
                                        participants = [
                                            ...participants,
                                            await api.Twitch.getUserById(userRows[i].user_id),
                                        ];
                                    }

                                    resolve(new Group(
                                        group.id,
                                        createdBy,
                                        group.message,
                                        group.game,
                                        group.active == "1",
                                        group.starttime ? new Date(group.starttime) : null,
                                        group.endtime ? new Date(group.endtime) : null,
                                        host,
                                        participants
                                    ));
                                } catch(err) {
                                    reject(err);
                                }
                            }
                        });
                    } else {
                        reject("No group found");
                    }
                }
            });
        });
    }

    /**
     * Generates a random string of (length) length.
     * @param {number} length 
     * @returns {string} Generated String
     */
    stringGenerator(length = 32) {
        let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let str = '';
        for (let i = 0; i < length; i++) {
            str += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return str;
    }
}

let api = new API();
global.api = api;
module.exports = api;