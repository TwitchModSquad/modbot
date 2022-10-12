const con = require("../database");
const config = require("../config.json");

const {MessageEmbed} = require("discord.js");

const api = require("../api/index");

const getLiveChannel = () => {
    return new Promise((resolve, reject) => {
        global.client.discord.guilds.fetch(config.modsquad_discord).then(guild => {
            guild.channels.fetch(config.live_channel).then(channel => {
                resolve(channel);
            }, reject);
        }, reject);
    });
}

module.exports = () => {
    con.query("select distinct tu.id from identity__moderator as im join twitch__user as tu on tu.identity_id = im.modfor_id where im.active = true;", async (err, res) => {
        if (err) {
            global.api.Logger.warning(err); return;
        }

        let channel = await getLiveChannel();

        let userList = [];

        let streams = [];

        const getStreams = async () => {
            const retrievedStreams = await api.Twitch.Direct.helix.streams.getStreams({
                limit: 100,
                userId: userList,
            });

            streams = [
                ...streams,
                ...retrievedStreams.data,
            ];

            userList = [];
        }

        for (let i = 0; i < res.length; i++) {
            userList = [
                ...userList,
                res[i].id
            ];

            if (userList.length === 100) await getStreams();
        }

        if (userList.length > 0) await getStreams();

        con.query("select identity_id from live where end_time is null;", async (errl, resl) => {
            if (errl) {
                global.api.Logger.warning(errl);
                return;
            }

            let activeStreams = [];

            resl.forEach(liveChannel => {
                activeStreams = [
                    ...activeStreams,
                    liveChannel.identity_id,
                ]
            });
        
            for (let si = 0; si < streams.length; si++) {
                let stream = streams[si];
                let user = await api.Twitch.getUserById(stream.userId);
    
                if (user.identity?.id) {
                    let identity = await api.getFullIdentity(user.identity.id);
    
                    if (!activeStreams.includes(identity.id)) {
                        con.query("insert into live (identity_id) values (?);", [identity.id], async err => {
                            if (err) global.api.Logger.warning(err);

                            const embed = new MessageEmbed()
                                .setAuthor({name: `🔴 ${user.display_name} is now live!`})
                                .setTitle(stream.title)
                                .setColor(0x7d3bdc)
                                .setURL("https://twitch.tv/" + user.display_name.toLowerCase())
                                .setImage(stream.getThumbnailUrl(256, 144))
                                .addField("Game", stream.gameName, true)
                                .addField("Viewer Count", ""+stream.viewers, true)
                                .setTimestamp(stream.startDate)
                                .setFooter({text: `${user.display_name} : Live 🔴`, iconURL: user.profile_image_url});
                
                            channel.send({content: ' ', embeds: [embed]});

                            con.query("select id from discord__guild where represents_id = ?;", [identity.id], (err, res) => {
                                if (!err) {
                                    res.forEach(guildres => {
                                        api.Discord.getGuild(guildres.id).then(guild => {
                                            guild.getSetting("lv-channel", "channel").then(async channel => {
                                                if (channel) {
                                                    let mentionEveryone = false;

                                                    try {
                                                        mentionEveryone = await guild.getSetting("lv-everyone", "boolean");
                                                    }catch (err) {global.api.Logger.warning(err)}

                                                    channel.send({content: mentionEveryone ? '@everyone' : ' ', embeds: [embed]});
                                                }
                                            }).catch(global.api.Logger.warning);
                                        }).catch(global.api.Logger.warning);
                                    });
                                } else global.api.Logger.warning(err);
                            });
                        });
                    } else {
                        activeStreams = activeStreams.filter(x => x != identity.id);
                    }
                }
            }

            activeStreams.forEach(async activeStream => {
                let identity = await api.getFullIdentity(activeStream);

                con.query("update live set end_time = now() where identity_id = ?;", [identity.id], err => {
                    if (err) {
                        global.api.Logger.warning();
                        return;
                    }

                    let user = identity.twitchAccounts[0];

                    const embed = new MessageEmbed()
                        .setTitle(`${user.display_name} has gone offline!`)
                        .setColor(0x451b7f)
                        .setURL("https://twitch.tv/" + user.display_name.toLowerCase())
                        .setTimestamp(new Date())
                        .setFooter({text: `${user.display_name} : Offline`, iconURL: user.profile_image_url});
        
                    channel.send({content: ' ', embeds: [embed]});
                });
            });
        });
    });
};
