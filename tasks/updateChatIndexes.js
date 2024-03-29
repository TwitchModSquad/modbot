const con = require("../database");

con.query("select streamer_id, count(streamer_id) as chat_count from twitch__chat group by streamer_id;", async (err, res) => {
    if (err) console.warn(err);
    
    for (let i = 0; i < res.length; i++) {
        let row = res[i];
        try {
            await con.pquery("insert into twitch__chat_streamers (streamer_id, chat_count) values (?, ?) on duplicate key update chat_count = ?;", [row.streamer_id, row.chat_count, row.chat_count]);
            console.log(row.streamer_id + " " + row.chat_count);
        } catch(err) {
            console.warn(err);
        }
    }

    console.log("Completed twitch__chat_streamers index");

    con.query("select user_id, streamer_id, count(streamer_id) as chat_count, max(timesent) as last_active from twitch__chat group by streamer_id, user_id;", async (err, res) => {
        if (err) console.warn(err);
        
        for (let i = 0; i < res.length; i++) {
            let row = res[i];
            try {
                await con.pquery("insert into twitch__chat_chatters (chatter_id, streamer_id, chat_count, last_active) values (?, ?, ?, ?) on duplicate key update chat_count = ?, last_active = ?;", [row.user_id, row.streamer_id, row.chat_count, row.last_active, row.chat_count, row.last_active]);
                console.log(row.user_id + " " + row.streamer_id + " " + row.chat_count);
            } catch(err) {
                console.warn(err);
            }
        }
    
        console.log("Completed twitch__chat_chatters index");
    });
});
