const TwitchUser = require("../../Twitch/TwitchUser");
const Rule = require("./Rule");

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
     * @param {TwitchUser[]} targets
     * @param {Rule[]} rules
     */
    constructor(id, name, targets, rules) {
        this.id = id;
        this.name = name;
        this.targets = targets;
        this.rules = rules;
    }
}

module.exports = BanAutomation;