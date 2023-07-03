const con = require("../database");

con.query("select id from modbomb order by id desc limit 1;", (err, res) => {
    if (err) {
        console.error(err);
        return;
    }
    if (res.length === 0) {
        console.error("No events returned");
        return;
    }
    con.query("select tu.display_name, i.name from modbomb__submission as mbs join twitch__user as tu on mbs.streamer_id = tu.id join identity as i on mbs.identity_id = i.id where modbomb_id = ? and type = 'small' order by rand() limit 1;", [
        res[0].id
    ], (err, res) => {
        if (err) {
            console.error(err);
            return;
        }
        if (res.length === 0) {
            console.log("No streamer returned");
            return;
        }
        console.log("SMALL BOMB: " + res[0].display_name + " Submitted by " + res[0].name);
    });
    con.query("select tu.display_name, i.name from modbomb__submission as mbs join twitch__user as tu on mbs.streamer_id = tu.id join identity as i on mbs.identity_id = i.id where modbomb_id = ? and type = 'big' order by rand() limit 1;", [
        res[0].id
    ], (err, res) => {
        if (err) {
            console.error(err);
            return;
        }
        if (res.length === 0) {
            console.log("No streamer returned");
            return;
        }
        console.log("BIG BOMB: " + res[0].display_name + " Submitted by " + res[0].name);
    });
});
