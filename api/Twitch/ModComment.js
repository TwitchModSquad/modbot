const Comment = require("./Comment");
const FullIdentity = require("../FullIdentity");
const TwitchUser = require("./TwitchUser");

class ModComment {

    /**
     * Surrogate ID for the comment
     * @type {number}
     */
    id;

    /**
     * TwitchUser which this mod comment is attached to
     * @type {TwitchUser}
     */
    user;

    /**
     * The FullIdentity of the moderator that placed the comment
     * @type {FullIdentity?}
     */
    postedBy;

    /**
     * The FullIdentity of the moderator/admin that deleted the comment
     * If null, the comment has not been deleted
     * @type {FullIdentity?}
     */
    deletedBy;

    /**
     * The comment placed
     * @type {Comment}
     */
    comment;

    /**
     * Constructor for a ModComment
     * @param {number} id
     * @param {TwitchUser} user 
     * @param {Comment} comment 
     * @param {FullIdentity?} postedBy 
     * @param {FullIdentity?} deletedBy 
     */
    constructor(id, user, comment, postedBy = null, deletedBy = null) {
        this.id = id;
        this.user = user;
        this.comment = comment;
        this.postedBy = postedBy;
        this.deletedBy = deletedBy;
    }

    /**
     * Returns true or false on if the comment has been deleted
     * @returns {boolean}
     */
    isDeleted() {
        return this.deletedBy !== null;
    }

}

module.exports = ModComment;