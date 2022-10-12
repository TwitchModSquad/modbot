const con = require("../database");

module.exports = () => {
    con.query("select discord__user.id, discord__user.name, discord__user.discriminator from discord__user left join discord__username on discord__user.id = discord__username.id and discord__user.name = discord__username.name and discord__user.discriminator = discord__username.discriminator where discord__username.id is null;", (err, res) => {
        if (err) {global.api.Logger.warning(err);return;}

        res.forEach(user => {
            con.query("update discord__username set last_seen = now() where id = ? and last_seen is null;", [user.id], err => {
                if (err) global.api.Logger.warning(err);

                con.query("insert into discord__username (id, name, discriminator) values (?, ?, ?);", [user.id, user.name, user.discriminator]);
            });
        })
    });
};
