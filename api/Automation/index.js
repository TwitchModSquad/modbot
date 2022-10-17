const con = require("../../database");

const Identity = require("../Identity");

const BanAutomation = require("./BanAutomation/");

class Automation {
    
    /**
     * Creates a new Ban Automation
     * @param {Identity} identity 
     * @param {string} name 
     * @return {Promise<BanAutomation>}
     */
    createBanAutomation(identity, name) {
        return new Promise((resolve, reject) => {
            con.query("insert into twitch__ban__automation (creator_id, name) values (?, ?);", [identity.id, name], err => {
                if (err) {
                    reject(err);
                } else {
                    con.query("select id, name from twitch__ban__automation where creator_id = ? and name = ? order by id desc limit 1;", [identity.id, name], (err, res) => {
                        if (err) {
                            reject(err);
                        } else {
                            if (res.length > 0) {
                                return new BanAutomation(res[0].id, res[0].name, [], []);
                            } else {
                                reject("Unable to retrieve created automation. This is embarrassing");
                            }
                        }
                    });
                }
            });
        });
    }

    /**
     * Retrieves an existing ban automation by ID
     * @param {number} id
     * @return {Promise<BanAutomation>}
     */
    getBanAutomation(id) {
        return new Promise((resolve, reject) => {

        });
    }

}

module.exports = Automation;