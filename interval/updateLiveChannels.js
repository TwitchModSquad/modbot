const con = require("../database");
const config = require("../config.json");

const {EmbedBuilder} = require("discord.js");

const api = require("../api/index");

const client = require("../discord/discord");

const getLiveChannel = () => {
    return new Promise((resolve, reject) => {
        global.client.discord.guilds.fetch(config.modsquad_discord).then(guild => {
            guild.channels.fetch(config.live_channel).then(channel => {
                resolve(channel);
            }, reject);
        }, reject);
    });
}

let count = 0;

const ACTIVITY_UPDATE_PER_HOUR = 10;
global.activeStreams = [];
let interval = {
    interval: () => {
        count++;
        con.query("select distinct tu.id from identity__moderator as im join twitch__user as tu on tu.identity_id = im.modfor_id where im.active = true;", async (err, res) => {
            if (err) {
                global.api.Logger.warning(err); return;
            }

            let channel = await getLiveChannel();

            let userList = [];

            let streams = [];

            const getStreams = async () => {
                try {
                    const retrievedStreams = await api.Twitch.Direct.helix.streams.getStreams({
                        limit: 100,
                        userId: userList,
                    });

                    streams = [
                        ...streams,
                        ...retrievedStreams.data,
                    ];

                    userList = [];
                } catch (err) {
                    api.Logger.severe(err);
                }
            }

            for (let i = 0; i < res.length; i++) {
                userList = [
                    ...userList,
                    res[i].id
                ];

                if (userList.length === 100) await getStreams();
            }

            if (userList.length > 0) await getStreams();

            con.query("select id, identity_id from live where end_time is null;", async (errl, resl) => {
                if (errl) {
                    global.api.Logger.warning(errl);
                    return;
                }

                let activeStreams = [];

                resl.forEach(liveChannel => {
                    activeStreams = [
                        ...activeStreams,
                        liveChannel,
                    ]
                });
            
                let newActiveStreams = [];
                for (let si = 0; si < streams.length; si++) {
                    let stream = streams[si];
                    let user = await api.Twitch.getUserById(stream.userId);
        
                    if (user.identity?.id) {
                        let identity = await api.getFullIdentity(user.identity.id);

                        newActiveStreams.push({
                            identity: identity,
                            viewers: stream.viewers,
                            game: stream.gameName,
                        });
        
                        if (!activeStreams.find(x => x.identity_id === identity.id)) {
                            con.query("insert into live (identity_id) values (?);", [identity.id], async err => {
                                if (err) global.api.Logger.warning(err);

                                const embed = new EmbedBuilder()
                                    .setAuthor({name: `🔴 ${user.display_name} is now live!`})
                                    .setTitle(stream.title)
                                    .setColor(0x7d3bdc)
                                    .setURL("https://twitch.tv/" + user.login)
                                    .setImage(stream.getThumbnailUrl(256, 144))
                                    .addFields(
                                        {
                                            name: "Game",
                                            value: stream.gameName,
                                            inline: true,
                                        },
                                        {
                                            name: "Viewer Count",
                                            value: String(stream.viewers),
                                            inline: true,
                                        }
                                    )
                                    .setTimestamp(stream.startDate)
                                    .setFooter({text: `${user.display_name} : Live 🔴`, iconURL: user.profile_image_url});
                    
                                channel.send({embeds: [embed]});

                                api.Discord.listeners.filter(x => x.event === "live").forEach(listener => {
                                    if (!listener.data) return;

                                    let streamers = listener.data.split(",");
                                    if (streamers.includes(String(user.id))) {
                                        listener.channel.send({embeds: [embed]}).catch(api.Logger.warning);
                                    }
                                });
                            });
                        } else {
                            let activeStream = activeStreams.find(x => x.identity_id === identity.id);

                            if (count % Math.floor(240 / ACTIVITY_UPDATE_PER_HOUR) === 1) {
                                con.query("insert into live__activity (live_id, game_name, viewers) values (?, ?, ?);", [
                                    activeStream.id,
                                    stream.gameName,
                                    stream.viewers,
                                ], err => {
                                    if (err) api.Logger.warning(err);
                                });
                            }
                            activeStreams = activeStreams.filter(x => x.identity_id != identity.id);
                        }
                    }
                }
                global.activeStreams = newActiveStreams;
                global.activeStreams.sort((a, b) => b.viewers - a.viewers);

                activeStreams.forEach(async activeStream => {
                    let identity = await api.getFullIdentity(activeStream.identity_id);

                    con.query("update live set end_time = now() where identity_id = ?;", [identity.id], err => {
                        if (err) {
                            global.api.Logger.warning(err);
                            return;
                        }

                        let user = identity.twitchAccounts[0];

                        const embed = new EmbedBuilder()
                            .setTitle(`${user.display_name} has gone offline!`)
                            .setColor(0x451b7f)
                            .setURL("https://twitch.tv/" + user.login)
                            .setTimestamp(new Date())
                            .setFooter({text: `${user.display_name} : Offline`, iconURL: user.profile_image_url});
            
                        channel.send({embeds: [embed]});
                    });
                });
            });
        });
    },
}

module.exports = interval;
