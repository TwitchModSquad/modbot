const api = require("..");
const con = require("../../database");

const Cache = require("../Cache/Cache");

const Identity = require("../Identity");

const BanAutomation = require("./BanAutomation/");
const Rule = require("./BanAutomation/Rule");

class Automation {

    /**
     * Ban automation cache
     * @type {Cache}
     */
    banAutomationCache = new Cache(600000);

    /**
     * Constructor for Automation API endpoints. Will automatically load all ban automations into cache.
     */
    constructor() {
        con.query("select id from twitch__ban__automation;", (err, res) => {
            if (err) api.Logger.warning(err);

            res.forEach(row => {
                this.getBanAutomation(row.id); // nasty way of loading automations, but it is what it is
            });
        });
    }

    /**
     * Creates a new Ban Automation
     * @param {Identity} identity 
     * @param {string} name 
     * @return {Promise<BanAutomation>}
     */
    createBanAutomation(identity, name) {
        return new Promise((resolve, reject) => {
            con.query("insert into twitch__ban__automation (creator_id, name) values (?, ?);", [identity.id, name], err => {
                if (err) {
                    reject(err);
                } else {
                    con.query("select id, name from twitch__ban__automation where creator_id = ? and name = ? order by id desc limit 1;", [identity.id, name], async (err, res) => {
                        if (err) {
                            reject(err);
                        } else {
                            if (res.length > 0) {
                                let automation = new BanAutomation(res[0].id, res[0].name, await global.api.getFullIdentity(identity.id), [], []);
                                this.banAutomationCache.put(res[0].id, automation);
                                resolve(automation);
                            } else {
                                reject("Unable to retrieve created automation. This is embarrassing");
                            }
                        }
                    });
                }
            });
        });
    }

    /**
     * Retrieves an existing ban automation by ID
     * @param {number} id
     * @return {Promise<BanAutomation>}
     */
    getBanAutomation(id) {
        return this.banAutomationCache.get(id, (resolve, reject) => {
            con.query("select id, name, creator_id from twitch__ban__automation where id = ?;", [id], (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    if (res.length > 0) {
                        con.query("select * from twitch__ban__automation_rules where automation_id = ?;", [id], async (err, rulres) => {
                            if (err) {
                                reject(err);
                            } else {
                                let targets = [];
                                let rules = [];

                                for (let i = 0; i < rulres.length; i++) {
                                    let rul = rulres[i];
                                    if (rul.type === "target") {
                                        targets = [
                                            ...targets,
                                            await global.api.Twitch.getUserById(rul.value),
                                        ]
                                    } else {
                                        rules = [
                                            ...rules,
                                            new Rule(rul.type, rul.value),
                                        ]
                                    }
                                }

                                resolve(new BanAutomation(res[0].id, res[0].name, await global.api.getFullIdentity(res[0].creator_id), targets, rules));
                            }
                        });
                    } else {
                        reject("Ban automation not found");
                    }
                }
            });
        });
    }

    /**
     * Retrieves existing ban automations by identity ID
     * @param {number} identityId
     * @return {Promise<BanAutomation[]>}
     */
    getBanAutomationsByCreator(identityId) {
        return new Promise((resolve, reject) => {
            con.query("select id from twitch__ban__automation where creator_id = ?;", [identityId], async (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    let automations = [];

                    try {
                        for (let i = 0; i < res.length; i++) {
                            automations = [
                                ...automations,
                                await this.getBanAutomation(res[i].id),
                            ]
                        }

                        resolve(automations);
                    } catch (err) {
                        reject(err);
                    }
                }
            });
        });
    }

    /**
     * Retrieves all ban automations from the cache
     * @returns {BanAutomation[]}
     */
    getBanAutomations() {
        return Array.from(this.banAutomationCache.objectStore.entries());
    }

}

module.exports = Automation;