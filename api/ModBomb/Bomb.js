const FullIdentity = require("../FullIdentity");
const Vote = require("./Vote");

class Bomb {

    /**
     * The identity that submitted the Bomb
     * @type {FullIdentity}
     */
    identity;

    /**
     * Votes for this user
     * @type {Vote[]}
     */
    votes;

    /**
     * Constructor for a Bomb
     * @param {FullIdentity} identity 
     * @param {Vote[]} votes 
     */
    constructor(identity, votes) {
        this.identity = identity;
        this.votes = votes;
    }

}

module.exports = Bomb;
