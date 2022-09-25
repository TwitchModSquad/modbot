const express = require("express");
const router = express.Router();

const con = require("../../../database");
const api = require("../../../api/");

const EMOTE_URL = "https://static-cdn.jtvnw.net/emoticons/v1/{{id}}/1.0";

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
        chat: [],
        users: {},
    };

    try {
        if (data.selectedChatter) {
            data.streamers = await con.pquery("select twitch__chat_chatters.*, twitch__user.display_name from twitch__chat_chatters join twitch__user on twitch__user.id = twitch__chat_chatters.streamer_id where chatter_id = ? order by chat_count desc;", [data.selectedChatter]);
        } else
            data.streamers = await con.pquery("select twitch__chat_streamers.*, twitch__user.display_name from twitch__chat_streamers join twitch__user on twitch__user.id = twitch__chat_streamers.streamer_id order by chat_count desc;");
        
        if (data.selectedStreamer) {
            data.chatters = await con.pquery("select chatter_id, chat_count, twitch__user.display_name from twitch__chat_chatters join twitch__user on twitch__user.id = twitch__chat_chatters.chatter_id where streamer_id = ? order by chat_count desc;", [data.selectedStreamer]);
        } else
            data.chatters = await con.pquery("select chatter_id, sum(chat_count) as chat_count, twitch__user.display_name from twitch__chat_chatters join twitch__user on twitch__user.id = twitch__chat_chatters.chatter_id group by chatter_id order by chat_count desc;");
    } catch (err) {
        console.error(err);
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

        const chat = await con.pquery(`select * from twitch__chat${query} order by timesent desc limit 500;`, vars);
        
        async function addUser(id) {
            if (!data.users.hasOwnProperty(id)) {
                data.users[id] = await api.Twitch.getUserById(id);
            }
        }

        for (let i = 0; chat.length > i; i++) {
            let chatLog = chat[i];
            await addUser(chatLog.streamer_id);
            await addUser(chatLog.user_id);

            chatLog.message = chatLog.message
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("&lt;3", "<3"); // hack to reverse <3 to &lt;3

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
                            html: `<img src="${EMOTE_URL.replace("{{id}}", emoteId)}" alt="emote" />`,
                        },
                    ]
                })

                replacements.forEach(replacement => {
                    chatLog.message = chatLog.message.split(replacement.emoteString).join(replacement.html);
                })
            }

            data.chat = [
                ...data.chat,
                {
                    id: chatLog.id,
                    streamer_id: chatLog.streamer_id,
                    chatter_id: chatLog.user_id,
                    message: chatLog.message,
                    deleted: chatLog.deleted == 1,
                    color: chatLog.color,
                    timesent: parseDate(new Date(chatLog.timesent)),
                },
            ]
        }
    } catch(err) {
        console.error(err);
    }

    res.render("pages/panel/chathistory", data);
});

module.exports = router;