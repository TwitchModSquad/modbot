const con = require("../../database");

const listener = {
    name: 'archiveMessageDelete',
    eventName: 'messageDelete',
    eventType: 'on',
    listener (message) {
        if (message.author.bot) {
            con.query("delete from archive__messages where id = ?;", [message.id], err => {
                if (err) global.api.Logger.warning(err);
            });
        }
    }
};

module.exports = listener;