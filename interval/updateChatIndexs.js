const con = require("../autodatabase");

module.exports = () => {
    con.query("select streamer_id, count(streamer_id) as chat_count from twitch__chat group by streamer_id;", (err, res) => {
        if (err) global.api.Logger.warning(err);
        
        res.forEach(row => {
            con.query("insert into twitch__chat_streamers (streamer_id, chat_count) values (?, ?) on duplicate key update chat_count = ?;", [row.streamer_id, row.chat_count, row.chat_count], err => {
                if (err) global.api.Logger.warning(err);
            });
        });
    });

    con.query("select user_id, streamer_id, count(streamer_id) as chat_count, max(timesent) as last_active from twitch__chat group by streamer_id, user_id;", (err, res) => {
        if (err) global.api.Logger.warning(err);
        
        res.forEach(row => {
            con.query("insert into twitch__chat_chatters (chatter_id, streamer_id, chat_count, last_active) values (?, ?, ?, ?) on duplicate key update chat_count = ?, last_active = ?;", [row.user_id, row.streamer_id, row.chat_count, row.last_active, row.chat_count, row.last_active], err => {
                if (err) global.api.Logger.warning(err);
            });
        });
    });
};
