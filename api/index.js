const con = require("../database");

const Twitch = require("./Twitch/");
const Discord = require("./Discord/");
const SessionService = require("./Session/");
const GroupService = require("./Group/");
const Archive = require("./Archive/");
const Authentication = require("./Authentication/");
const TokenManager = require("./Token/");

const Logger = require("./Logger");
const FullIdentity = require("./FullIdentity");

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
     * Base Group API
     * @type {GroupService}
     */
    Group = new GroupService();

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
     * Token manager
     * @type {TokenManager}
     */
    Token = new TokenManager();

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

    /**
     * Generates a table-like format from tabular rows
     * @param {[...[...string]]} rows 
     * @param {number} padding
     * @param {number} minimumWidth
     * @param {boolean} alignRight
     * @returns {string}
     */
    stringTable(rows, padding = 3, minimumWidth = 5, alignRight = false) {
        let cellWidth = [];
        
        rows.forEach(row => {
            row.forEach((cell, cellNum) => {
                if (!cellWidth[cellNum]) cellWidth[cellNum] = minimumWidth;
                if (cellWidth[cellNum] < cell.length + padding) cellWidth[cellNum] = String(cell).length + padding;
            });
        });
        
        let result = "";

        rows.forEach(row => {
            if (result !== "") result += "\n";

            row.forEach((cell, cellNum) => {
                if (!alignRight) result += " ".repeat(Math.max(cellWidth[cellNum] - cell.length), 0);
                
                result += cell;

                if (alignRight) result += " ".repeat(Math.max(cellWidth[cellNum] - cell.length), 0);
            })
        });

        return result;
    }
}

let api = new API();
global.api = api;
module.exports = api;