const FullIdentity = require("../../FullIdentity");
const TwitchUser = require("../../Twitch/TwitchUser");
const Rule = require("./Rule");

const con = require("../../../database");

class BanAutomation {
    /**
     * Ban automation ID
     * @type {number}
     */
    id;

    /**
     * Ban automation name
     * @type {string}
     */
    name;

    /**
     * Ban automation creator
     * @type {FullIdentity}
     */
    creator;

    /**
     * Twitch user channel targets
     * @type {TwitchUser[]}
     */
    targets;

    /**
     * Ban automation rules
     * @type {Rule[]}
     */
    rules;

    /**
     * Constructor for a BanAutomation object
     * @param {number} id 
     * @param {string} name 
     * @param {FullIdentity} creator 
     * @param {TwitchUser[]} targets
     * @param {Rule[]} rules
     */
    constructor(id, name, creator, targets, rules) {
        this.id = id;
        this.name = name;
        this.creator = creator;
        this.targets = targets;
        this.rules = rules;
    }

    /**
     * Adds a target to this ban automation
     * @param {TwitchUser} user 
     * @returns {Promise<void>}
     */
    addTarget(user) {
        return new Promise((resolve, reject) => {
            con.query("insert into twitch__ban__automation_rules (automation_id, type, value) values (?, 'target', ?);", [this.id, user.id], err => {
                if (err) {
                    reject(err);
                } else {
                    this.targets = [
                        ...this.targets,
                        user,
                    ]
                    resolve();
                }
            });
        });
    }

    /**
     * Adds a new "streamer" rule
     * @param {TwitchUser} user 
     * @returns {Promise<Rule>}
     */
    addRuleStreamer(user) {
        return new Promise((resolve, reject) => {
            con.query("insert into twitch__ban__automation_rules (automation_id, type, value) values (?, 'streamer', ?);", [this.id, user.id], err => {
                if (err) {
                    reject(err);
                } else {
                    let rule = new Rule("streamer", user.id, user);
                    this.rules = [
                        ...this.rules,
                        rule,
                    ]
                    resolve(rule);
                }
            });
        });
    }

    /**
     * Adds a new "moderator" rule
     * @param {TwitchUser} user 
     * @returns {Promise<Rule>}
     */
    addRuleModerator(user) {
        return new Promise((resolve, reject) => {
            con.query("insert into twitch__ban__automation_rules (automation_id, type, value) values (?, 'moderator', ?);", [this.id, user.id], err => {
                if (err) {
                    reject(err);
                } else {
                    let rule = new Rule("moderator", user.id, user);
                    this.rules = [
                        ...this.rules,
                        rule,
                    ]
                    resolve(rule);
                }
            });
        });
    }

    /**
     * Adds a new "chat log" rule
     * @param {string} value 
     * @returns {Promise<Rule>}
     */
    addRuleChatLog(value) {
        return new Promise((resolve, reject) => {
            con.query("insert into twitch__ban__automation_rules (automation_id, type, value) values (?, 'chatlog', ?);", [this.id, value], err => {
                if (err) {
                    reject(err);
                } else {
                    let rule = new Rule("chatlog", value);
                    this.rules = [
                        ...this.rules,
                        rule,
                    ]
                    resolve(rule);
                }
            });
        });
    }

    /**
     * Adds a new "reason" rule
     * @param {string} value 
     * @returns {Promise<Rule>}
     */
    addRuleReason(value) {
        return new Promise((resolve, reject) => {
            con.query("insert into twitch__ban__automation_rules (automation_id, type, value) values (?, 'reason', ?);", [this.id, value], err => {
                if (err) {
                    reject(err);
                } else {
                    let rule = new Rule("reason", value);
                    this.rules = [
                        ...this.rules,
                        rule,
                    ]
                    resolve(rule);
                }
            });
        });
    }
}

module.exports = BanAutomation;