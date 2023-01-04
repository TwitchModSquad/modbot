const con = require("../../database");

const Group = require("./Group");
const Cache = require("../Cache/Cache");

class GroupService {

    /**
     * Holds a cache of all groups
     * @type {Cache}
     */
    groupCache = new Cache(0);

    constructor() {
        con.query("select id from `group` where active;", (err, res) => {
            if (err) {
                global.api.Logger.severe(err);
            } else {
                res.forEach(row => {
                    this.getGroupById(row.id);
                });
                global.api.Logger.info("Loaded " + res.length + " active groups");
            }
        });
    }

    /**
     * Gets a Group object from an ID
     * @param {string} id 
     * @returns {Promise<Group>}
     */
    getGroupById(id) {
        return this.groupCache.get(id, (resolve, reject) => {
            con.query("select * from `group` where id = ?;", [id], (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    if (res.length > 0) {
                        let group = res[0];
                        con.query("select user_id, host from group__user where group_id = ?;", [id], async (err, userres) => {
                            if (err) {
                                reject(err);
                            } else {
                                try {
                                    let createdBy = await global.api.getFullIdentity(group.created_by);

                                    let host = await global.api.Twitch.getUserById(userres.find(x => x.host == "1").user_id);
                                    
                                    let userRows = userres.filter(x => x.host == "0");
                                    let participants = [];
    
                                    for (let i = 0; i < userRows.length; i++) {
                                        participants = [
                                            ...participants,
                                            await global.api.Twitch.getUserById(userRows[i].user_id),
                                        ];
                                    }

                                    resolve(new Group(
                                        group.id,
                                        createdBy,
                                        group.message,
                                        group.game,
                                        group.active == "1",
                                        group.starttime ? new Date(group.starttime) : null,
                                        group.endtime ? new Date(group.endtime) : null,
                                        host,
                                        participants
                                    ));
                                } catch(err) {
                                    reject(err);
                                }
                            }
                        });
                    } else {
                        reject("No group found");
                    }
                }
            });
        }, false, false);
    }

    /**
     * Retrieves all loaded groups from the cache. This WILL NOT be complete
     * @returns {Group[]}
     */
    getGroups() {
        let result = [];
        for (const id in this.groupCache.objectStore) {
            result = [
                ...result,
                this.groupCache.objectStore[id],
            ];
        }
        return result;
    }

    /**
     * Retrieves all loaded active groups from the cache. This should be complete
     * @returns {Group[]}
     */
    getActiveGroups() {
        let result = this.getGroups().filter(x => x.active);
        return result;
    }
    
}

module.exports = GroupService;