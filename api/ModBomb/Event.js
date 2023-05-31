const con = require("../../database");

const Identity = require("../Identity");
const TwitchUser = require("../Twitch/TwitchUser");

const Bomb = require("./Bomb");
const Vote = require("./Vote");

class Event {
    
    /**
     * Surrogate ID for the event
     * @type {number}
     */
    id;

    /**
     * Start time for the event
     * @type {Date}
     */
    startTime;

    /**
     * End time for the event
     * @type {Date}
     */
    endTime;

    /**
     * Number of small bombs per user
     * @type {number}
     */
    smallBombs;

    /**
     * Number of big bombs per user
     * @type {number}
     */
    bigBombs;

    /**
     * Submissions for this event
     * @type {Bomb[]}
     */
    bombs = [];

    /**
     * Updates all bombs for this Event
     * @returns {Promise<Bomb[]>}
     */
    updateBombs() {
        return new Promise(async (resolve, reject) => {
            try {
                let bombs = [];
                
                const submissions = await con.pquery("select id, identity_id, streamer_id, submitted from modbomb__submission where modbomb_id = ?;", [this.id]);
                for (let i = 0; i < submissions.length; i++) {
                    try {
                        const submission = submissions[i];
                        const identity = await global.api.getFullIdentity(submission.identity_id);
                        const foundBomb = bombs.find(x => x.identity.id === submission.identity_id);
                        if (!foundBomb) {
                            bombs.push(new Bomb(
                                identity,
                                [new Vote(
                                    identity,
                                    await global.api.Twitch.getUserById(submission.streamer_id),
                                    new Date(submission.submitted)
                                )]
                            ));
                        } else {
                            foundBomb.votes.push(new Vote(
                                identity,
                                await global.api.Twitch.getUserById(submission.streamer_id),
                                new Date(submission.submitted)
                            ));
                        }
                    } catch(err) {
                        global.api.Logger.severe(err);
                    }
                }

                this.bombs = bombs;
                resolve(bombs);
            } catch(err) {
                reject(err);
            }
        });
    }

    /**
     * Constructor for an Event
     * @param {number} id 
     * @param {Date} startTime 
     * @param {Date} endTime 
     * @param {number} smallBombs 
     * @param {number} bigBombs 
     */
    constructor(id, startTime, endTime, smallBombs, bigBombs) {
        this.id = id;
        this.startTime = startTime;
        this.endTime = endTime;
        this.smallBombs = smallBombs;
        this.bigBombs = bigBombs;
    }

    /**
     * Returns "true" or "false" based on if the user has already submitted a vote to this event
     * @param {Identity} identity
     * @returns {boolean}
     */
    hasUserSubmitted(identity) {
        if (this.bombs.find(x => x.identity.id === identity.id)) {
            return true;
        } else return false;
    }

    /**
     * Executes a vote for Identity with the vote table provided
     * @param {Identity} identity 
     * @param {{user: TwitchUser, votes: number}[]} votes 
     * @returns {Promise<Bomb>}
     */
    vote(identity, votes) {
        return new Promise(async (resolve, reject) => {
            if (this.hasUserSubmitted(identity)) {
                reject(`${identity.name} has already voted on this event!`);
                return;
            }

            let smallBombs = [];
            let bigBombs = [];

            for (let i = 0; i < votes.length; i++) {
                const vote = votes[i];
                if (vote.user.affiliation === "partner" || vote.user.follower_count >= 5000) {
                    for (let v = 0; v < vote.votes; v++) {
                        bigBombs.push(vote.user);
                    }
                } else {
                    for (let v = 0; v < vote.votes; v++) {
                        smallBombs.push(vote.user);
                    }
                }
            }

            if (smallBombs.length !== this.smallBombs) {
                reject(`Invalid number of Big Bombs! ${smallBombs.length} were sent, ${this.smallBombs} expected`);
                return;
            }

            if (bigBombs.length !== this.bigBombs) {
                reject(`Invalid number of Big Bombs! ${bigBombs.length} were sent, ${this.bigBombs} expected`);
                return;
            }

            try {
                const bomb = new Bomb(identity, []);
                for (let i = 0; i < smallBombs.length; i++) {
                    const streamer = smallBombs[i];
                    await con.pquery("insert into modbomb__submission (modbomb_id, identity_id, streamer_id, type) values (?, ?, ?, 'small');", [
                        this.id,
                        identity.id,
                        streamer.id,
                    ]);
                    bomb.votes.push(new Vote(
                        bomb.identity.id,
                        streamer,
                        "small",
                        new Date(),
                    ));
                }
                for (let i = 0; i < bigBombs.length; i++) {
                    const streamer = bigBombs[i];
                    await con.pquery("insert into modbomb__submission (modbomb_id, identity_id, streamer_id, type) values (?, ?, ?, 'big');", [
                        this.id,
                        identity.id,
                        streamer.id,
                    ]);
                    bomb.votes.push(new Vote(
                        bomb.identity.id,
                        streamer,
                        "big",
                        new Date(),
                    ));
                }
                this.bombs.push(bomb);
                resolve(bomb);
            } catch(err) {
                reject(err);
            }
        });
    }
}

module.exports = Event;
