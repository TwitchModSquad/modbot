const api = require("../api/");
const con = require("../database");

module.exports = () => {
    con.query("select value, type from archive__users where user = ? and (type = 'discord' or type = 'twitch');", async (err, res) => {
        if (err) {
            console.error(err);
            return;
        }

        let helixUsers = [];
        let twitchIds = [];

        res.forEach(row => {
            if (row.type === "twitch") {
                
            } else {

            }
        });
    });
};
