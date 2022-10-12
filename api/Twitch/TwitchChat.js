const api = require("..");
const con = require("../../database");
const TwitchChatFiller = require("./TwitchChatFiller");
const TwitchChatLog = require("./TwitchChatLog");

class TwitchChat {
    /**
     * Runs a query against Twitch chat logs
     * @param {number=} channel 
     * @param {number=} user 
     * @param {Date=} timeStart 
     * @param {Date=} timeEnd 
     * @param {number=} [limit=200] 
     * @param {number=} [offset=0]
     * @param {boolean=} [includeFillers=true] 
     */
    getLogs(channel = null, user = null, timeStart = null, timeEnd = null, limit = 250, offset = 0, includeFillers = true) {
        return new Promise(async (resolve, reject) => {
            if (channel === null && user === null && timeStart === null) {
                reject("Query must have one of the following parameters: channel, user, timeStart");
                return;
            }

            if (typeof(limit) !== "number" || limit > 250) limit = 250;
            if (typeof(offset) !== "number") offset = 0;

            let buildQuery = "";
            let queryParams = [];

            const addToQuery = (query, value) => {
                if (buildQuery !== "") buildQuery += " and ";
                buildQuery += query;
                queryParams = [
                    ...queryParams,
                    value,
                ];
            }

            if (channel !== null) addToQuery("streamer_id = ?", channel);
            if (user !== null && (channel === null || !includeFillers)) addToQuery("user_id = ?", user);

            if (includeFillers && channel !== null && user !== null) {
                const timeEndQuery = (await con.pquery("select timesent from twitch__chat where streamer_id = ? and user_id = ? order by timesent desc limit 0, 1;", [channel, user]));
                const timeStartQuery = (await con.pquery("select timesent from twitch__chat where streamer_id = ? and user_id = ? order by timesent desc limit 0, ?;", [channel, user, limit]));

                if (timeEndQuery.length > 0 && timeStartQuery.length > 0) {
                    timeStart = timeEndQuery[0].timesent;
                    timeEnd = timeStartQuery[timeStartQuery.length - 1].timesent;
                }

                limit = 1500;
            }

            if (timeStart !== null) addToQuery("timesent <= ?", timeStart);
            if (timeEnd !== null) addToQuery("timesent >= ?", timeEnd);
            
            con.query("select * from twitch__chat where " + buildQuery + " order by timesent desc limit ?, ?;", [...queryParams, offset, limit], async(err, res) => {
                if (err) {
                    reject(err);
                    return;
                }

                let result = [];

                let fillerFrom = null;
                let lastFiller = null;
                let fillerCount = 0;

                res.forEach(chatLog => {
                    if (user === null || chatLog.user_id == user) {
                        if (fillerFrom !== null) {
                            result = [
                                ...result,
                                new TwitchChatFiller(
                                    fillerCount,
                                    fillerFrom,
                                    lastFiller
                                )
                            ];
                            fillerFrom = null;
                            lastFiller = null;
                            fillerCount = 0;
                        }

                        result = [
                            ...result,
                            new TwitchChatLog(
                                chatLog.id,
                                Number(chatLog.streamer_id),
                                Number(chatLog.user_id),
                                chatLog.message,
                                chatLog.deleted == 1,
                                chatLog.color,
                                chatLog.timesent,
                            )
                        ];
                    } else {
                        if (fillerFrom === null) {
                            fillerFrom = chatLog.timesent;
                        }
                        lastFiller = chatLog.timesent;
                        fillerCount++;
                    }
                });

                let userTable = {};

                for (let i = 0; i < result.length; i++) {
                    let chatLog = result[i];
                    if (chatLog.type === "chatlog") {
                        try {
                            if (!userTable[Number(chatLog.streamer_id)]) userTable[Number(chatLog.streamer_id)] = await global.api.Twitch.getUserById(chatLog.streamer_id);

                            if (!userTable[Number(chatLog.user_id)]) userTable[Number(chatLog.user_id)] = await global.api.Twitch.getUserById(chatLog.user_id);
                        } catch (err) {
                            global.api.Logger.warning(err);
                            return;
                        }
                    }
                }

                resolve({log: result, user_table: userTable});
            });
        });
    }

    /**
     * Get overview of where the user has chatted
     * @param {number} user 
     * @param {number} logLimit
     */
    getChatterOverview(user, logLimit = 25) {
        return new Promise((resolve, reject) => {
            con.query("SELECT streamer_id, count(streamer_id) as chat_count FROM twitch__chat where user_id = ? group by streamer_id order by chat_count desc;", [user], async (err, res) => {
                if (err) {
                    reject(err);
                    return;
                }

                let result = {
                    channel_log: [],
                    total: {
                        chats: 0,
                        channels: 0,
                    },
                };

                for (let i = 0; i < res.length; i++) {
                    let log = res[i];
                    if (result.channel_log.length < logLimit) {
                        result.channel_log = [
                            ...result.channel_log,
                            {
                                streamer: await global.api.Twitch.getUserById(log.streamer_id),
                                count: log.chat_count,
                            }
                        ];
                    }
                    result.total.chats += log.chat_count;
                    result.total.channels++;
                }

                resolve(result);
            });
        });
    }

    /**
     * Get overview of users who have chatted in a stream
     * @param {number} user 
     * @param {number} logLimit
     */
    getStreamerOverview(user, logLimit = 6) {
        return new Promise((resolve, reject) => {
            con.query("SELECT user_id, count(user_id) as chat_count FROM twitch__chat where streamer_id = ? group by user_id order by chat_count desc;", [user], async (err, res) => {
                if (err) {
                    reject(err);
                    return;
                }

                let result = {
                    channel_log: [],
                    total: {
                        chats: 0,
                        channels: 0,
                    },
                };

                for (let i = 0; i < res.length; i++) {
                    let log = res[i];
                    if (result.channel_log.length < logLimit) {
                        result.channel_log = [
                            ...result.channel_log,
                            {
                                user: await global.api.Twitch.getUserById(log.user_id),
                                count: log.chat_count,
                            }
                        ];
                    }
                    result.total.chats += log.chat_count;
                    result.total.channels++;
                }

                resolve(result);
            });
        });
    }

    /**
     * Get user overview for a user ID
     * @param {number} user 
     */
    getOverview(user) {
        return new Promise((resolve, reject) => {
            this.getChatterOverview(user).then(chatterOverview => {
                this.getStreamerOverview(user).then(streamerOverview => {
                    resolve({
                        chatter_overview: chatterOverview,
                        streamer_overview: streamerOverview,
                    })
                }, reject);
            }, reject);
        });
    }
}

module.exports = TwitchChat;