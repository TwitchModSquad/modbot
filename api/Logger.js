const con = require("../database");

const SEVERE_CODE = "\x1b[31m[SEVR] %s\x1b[0m";
const WARNING_CODE = "\x1b[33m[WARN] %s\x1b[0m";
const INFO_CODE = "\x1b[2m[INFO] %s\x1b[0m";

class Logger {
    logToDatabase(code, msg) {
        let timesent = Date.now();
        con.query("insert into system__log (timesent, message, type) values (?, ?, ?);", [timesent, ""+msg, code], err => {
            if (err) console.error(err);
        });
    }

    severe(msg) {
        console.log(SEVERE_CODE, msg);
        try {
            this.logToDatabase("SEVERE", msg);
        } catch (err) {}
    }

    warning(msg) {
        console.log(WARNING_CODE, msg);
        try {
            this.logToDatabase("WARNING", msg);
        } catch (err) {}
    }

    info(msg) {
        console.log(INFO_CODE, msg);
        try {
            this.logToDatabase("INFO", msg);
        } catch (err) {}
    }
}

module.exports = Logger;