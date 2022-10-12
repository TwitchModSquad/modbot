const express = require("express");
const router = express.Router();

const con = require("../../../../database");

function parseDate(date) {
    let mon = date.getMonth() + "";
    let day = date.getDate() + "";
    let yer = (date.getFullYear() - (Math.floor(date.getFullYear()/100)*100)) + "";

    let hor = date.getHours() + "";
    let min = date.getMinutes() + "";
    let sec = date.getSeconds() + "";

    if (mon.length == 1) mon = "0" + mon;
    if (day.length == 1) day = "0" + day;
    if (yer.length == 1) yer = "0" + yer;

    if (hor.length == 1) hor = "0" + hor;
    if (min.length == 1) min = "0" + min;
    if (sec.length == 1) sec = "0" + sec;

    return `${mon}/${day}/${yer}&nbsp;${hor}:${min}:${sec}`;
}

router.use("/", (req, res) => {
    let data = {
        logs: [],
        session: req.session,
    };

    con.query("select * from system__log order by timesent desc limit 500;", (err, result) => {
        if (err) {
            global.api.Logger.severe(err);
            return;
        }

        result.forEach(log => {
            log.message = log.message
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("&lt;3", "<3"); // hack to reverse <3 to &lt;3

            data.logs = [
                ...data.logs,
                {
                    id: log.id,
                    type: log.type,
                    timestamp: parseDate(new Date(log.timesent)),
                    message: log.message,
                }
            ]
        });

        res.render("pages/panel/moderator/logs", data);
    });
});

module.exports = router;