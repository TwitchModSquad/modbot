const con = require("../../database");

const listener = {
    name: "updateDeletedMessages",
    eventName: "messageDeleted",
    listener: async (channel, username, deletedMessage, userstate) => {
        let id = userstate["target-msg-id"];
    
        con.query("update twitch__chat set deleted = true where id = ?;", [id]);
    }
};

module.exports = listener;