const express = require("express");
const router = express.Router();

const con = require("../../../database");
const api = require("../../../api/");
const config = require("../../../config.json");

const EMOTE_URL = "https://static-cdn.jtvnw.net/emoticons/v1/{{id}}/1.0";

const BADGES_URL = "/assets/images/badges/";
const TWITCH_BADGES_URL = BADGES_URL + "twitch/";
const TMS_BADGES_URL = BADGES_URL + "tms/";

const TWITCH_USER_REGEX = /@(\w{4,})/g;
const URL_REGEX = /(https?:\/\/)?(\w+(\.[a-zA-Z]\w+)+\/?[0-9A-Za-z-_~:/#\[\]@!$&?'()*+,;%=]*)/g;

let cachedChatters = [];
let cachedStreamers = [];

const updateCache = () => {
    con.query("select chatter_id, sum(chat_count) as chat_count, twitch__user.display_name from twitch__chat_chatters join twitch__user on twitch__user.id = twitch__chat_chatters.chatter_id group by chatter_id order by chat_count desc limit 100;", (err, res) => {
        if (err) {
            api.Logger.severe(err);
        } else {
            cachedChatters = res;
        }
    });

    con.query("select twitch__chat_streamers.*, twitch__user.display_name from twitch__chat_streamers join twitch__user on twitch__user.id = twitch__chat_streamers.streamer_id order by chat_count desc;", (err, res) => {
        if (err) {
            api.Logger.severe(err);
        } else {
            cachedStreamers = res;
        }
    });
}

setInterval(updateCache, 600000);
updateCache();

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

router.get("/", async (req, res) => {
    let data = {
        streamers: [],
        selectedStreamer: req.query?.streamer,
        chatters: [],
        selectedChatter: req.query?.chatter,
        endtime: req.query?.endtime,
        starttime: req.query?.starttime,
        chat: [],
        users: {},
        session: req.session,
    };

    try {
        if (data.selectedChatter) {
            data.streamers = await con.pquery("select twitch__chat_chatters.*, twitch__user.display_name from twitch__chat_chatters join twitch__user on twitch__user.id = twitch__chat_chatters.streamer_id where chatter_id = ? order by chat_count desc;", [data.selectedChatter]);
        } else
            data.streamers = cachedStreamers;
        
        if (data.selectedStreamer) {
            data.chatters = await con.pquery("select chatter_id, chat_count, twitch__user.display_name from twitch__chat_chatters join twitch__user on twitch__user.id = twitch__chat_chatters.chatter_id where streamer_id = ? order by chat_count desc limit 100;", [data.selectedStreamer]);
        } else 
            data.chatters = cachedChatters;

        if (data.selectedChatter && !data.chatters.find(x => x.chatter_id == data.selectedChatter)) {
            let extended;
            if (data.selectedStreamer) {
                extended = await con.pquery("select chatter_id, chat_count, twitch__user.display_name from twitch__chat_chatters join twitch__user on twitch__user.id = twitch__chat_chatters.chatter_id where streamer_id = ? and chatter_id = ? order by chat_count desc limit 1;", [data.selectedStreamer, data.selectedChatter]);
            } else
                extended = await con.pquery("select chatter_id, sum(chat_count) as chat_count, twitch__user.display_name from twitch__chat_chatters join twitch__user on twitch__user.id = twitch__chat_chatters.chatter_id where chatter_id = ? limit 1;", [data.selectedChatter]);

            data.chatters = [
                ...data.chatters,
                ...extended
            ]
        }
    } catch (err) {
        global.api.Logger.warning(err);
    }

    try {
        let query = "";
        let vars = [];

        if (data.selectedStreamer) {
            query = " where streamer_id = ?";
            vars = [
                ...vars,
                data.selectedStreamer,
            ]
        }
        if (data.selectedChatter) {
            query += (query === "" ? " where " : " and ") + "user_id = ?";
            vars = [
                ...vars,
                data.selectedChatter,
            ]
        }
        if (data.endtime) {
            query += (query === "" ? " where " : " and ") + "timesent <= ?";
            vars = [
                ...vars,
                data.endtime,
            ]
        }
        if (data.starttime) {
            query += (query === "" ? " where " : " and ") + "timesent >= ?";
            vars = [
                ...vars,
                data.starttime,
            ]
        }

        const chat = await con.pquery(`select * from twitch__chat${query} order by timesent desc limit 100;`, vars);
        
        async function addUser(id) {
            if (!data.users.hasOwnProperty(id)) {
                data.users[id] = await api.Twitch.getUserById(id);
            }
            return data.users[id];
        }

        for (let i = 0; chat.length > i; i++) {
            let chatLog = chat[i];
            await addUser(chatLog.streamer_id);
            let user = await addUser(chatLog.user_id);

            chatLog.message = chatLog.message
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("&lt;3", "<3")
                .replace(URL_REGEX, `<a href="https://$2" target="__blank" onclick="return confirm('This is an external link and can\\'t be protected by TMS. Are you sure you want to continue?');">$&</a>`); // hack to reverse <3 from &lt;3

            if (chatLog.emotes) {
                let replacements = [];
                chatLog.emotes.split("/").forEach(emote => {
                    let [emoteId, positions] = emote.split(":");
                    let [start, end] = positions.split(",")[0].split("-");
                    let emoteString = chatLog.message.substring(parseInt(start, 10), parseInt(end, 10) + 1)
                    replacements = [
                        ...replacements,
                        {
                            emoteString: emoteString,
                            html: `<img src="${EMOTE_URL.replace("{{id}}", emoteId)}" alt="${emoteString}" />`,
                        },
                    ]
                })

                replacements.forEach(replacement => {
                    chatLog.message = chatLog.message.split(replacement.emoteString).join(replacement.html);
                })
            }

            chatLog.message = chatLog.message
                .replace(TWITCH_USER_REGEX, `<a href="${config.pub_domain}panel/user/$1" target="__blank">$&</a>`);

            let badges = "";

            function addBadge(badgeURL, alt, title) {
                if (badges !== "") badges += "&nbsp;";
                badges += `<img class="chat-badge" src="${badgeURL}" alt="${alt} badge" title="${title}" />`;
            }

            if (chatLog.badges) {
                if (chatLog.badges.includes("broadcaster")) {
                    addBadge(TWITCH_BADGES_URL + "broadcaster.png", "broadcaster", "Broadcaster");
                }
                if (chatLog.badges.includes("moderator")) {
                    addBadge(TWITCH_BADGES_URL + "moderator.png", "moderator", "Channel Moderator");
                }
                if (chatLog.badges.includes("vip")) {
                    addBadge(TWITCH_BADGES_URL + "vip.png", "vip", "Channel VIP");
                }
                if (chatLog.badges.includes("partner")) {
                    addBadge(TWITCH_BADGES_URL + "partner.png", "partner", "Twitch Partner");
                }
                if (chatLog.badges.includes("subscriber")) {
                    addBadge(TWITCH_BADGES_URL + "subscriber.png", "subscriber", "Channel Subscriber");
                }
            }

            if (user.identity?.admin) {
                addBadge(TMS_BADGES_URL + "admin.png", "tms admin", "TMS Administrator");
            } else if (user.identity?.mod) {
                addBadge(TMS_BADGES_URL + "mod.png", "tms mod", "TMS Moderator");
            } else if (user.identity?.authenticated) {
                addBadge(TMS_BADGES_URL + "tms.png", "tms member", "TMS Member");
            }

            data.chat = [
                ...data.chat,
                {
                    id: chatLog.id,
                    streamer_id: chatLog.streamer_id,
                    chatter_id: chatLog.user_id,
                    message: chatLog.message,
                    badges: badges,
                    deleted: chatLog.deleted == 1,
                    color: chatLog.color,
                    timesent: parseDate(new Date(chatLog.timesent)),
                },
            ]
        }
    } catch(err) {
        global.api.Logger.warning(err);
    }

    res.render("pages/panel/chathistory", data);
});

module.exports = router;