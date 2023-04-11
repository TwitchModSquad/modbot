class Comment {

    /**
     * Surrogate ID for the comment. If null, it's a custom comment
     * @type {number?}
     */
    id;

    /**
     * The string comment
     * @type {string}
     */
    comment;

    /**
     * The emoji for the comment, if available
     * @type {string?}
     */
    emoji;

    /**
     * Constructor for a Comment
     * @param {number?} id 
     * @param {string} comment 
     * @param {string?} emoji
     */
    constructor(id, comment, emoji = null) {
        this.id = id;
        this.comment = comment;
        this.emoji = emoji;
    }

}

module.exports = Comment;
