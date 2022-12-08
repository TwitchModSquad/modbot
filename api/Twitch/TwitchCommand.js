class TwitchCommand {

    /**
     * Surrogate ID for this Twitch command
     * @type {number}
     */
    id;

    /**
     * Streamer that this command applies to
     * @type {TwitchUser}
     */
    streamer;

    /**
     * Command in the streamer's channel
     * @type {string}
     */
    command;

    /**
     * TMS command being referenced
     * @type {string}
     */
    referencedCommand;

    /**
     * Constructor for a new TwitchCommand command
     * @param {number} id
     * @param {TwitchUser} streamer 
     * @param {string} command 
     * @param {string} referencedCommand 
     */
    constructor(id, streamer, command, referencedCommand) {
        this.id = id;
        this.streamer = streamer;
        this.command = command;
        this.referencedCommand = referencedCommand;
    }
}

module.exports = TwitchCommand;