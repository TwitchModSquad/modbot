const con = require("../database");

const TwitchUser = require("../api/Twitch/TwitchUser");
const {EmbedBuilder, codeBlock} = require("discord.js");

const refreshTokens = require("./RefreshTokens");
const Discord = require("discord.js");

const ACTIVE_CHANNEL_PADDING = 3;

class Formatting {
    /**
     * @param {Number} day - 0-6 as a representation of the day of the week (0 = Sunday)
     * @returns {String} The corresponding day of the week as a 3 character String
    */
    parseDay(day) {
        let result = "";

        switch (day) {
            case 0:
                result = "Sun";
                break;
            case 1:
                result = "Mon";
                break;
            case 2:
                result = "Tue";
                break;
            case 3:
                result = "Wed";
                break;
            case 4:
                result = "Thu";
                break;
            case 5:
                result = "Fri";
                break;
            case 6:
                result = "Sat";
        }

        return result;
    }

    /**
     * Parses date from a timestamp to MM:DD:YY HH:MM:SS
     * @param { Number | String | Date | undefined } timestamp - The timestamp to parse, if provided, otherwise the current time is parsed
     * @returns {String} The parsed Date in the format MM:DD:YY HH:MM:SS
     */
    parseDate(timestamp) {
        let dte = new Date(timestamp);

        let hr = "" + dte.getHours();
        let mn = "" + dte.getMinutes();
        let sc = "" + dte.getSeconds();

        if (hr.length === 1) hr = "0" + hr;
        if (mn.length === 1) mn = "0" + mn;
        if (sc.length === 1) sc = "0" + sc;

        let mo = "" + (dte.getMonth() + 1);
        let dy = "" + dte.getDate();
        let yr = dte.getFullYear();

        if (mo.length === 1) mo = "0" + mo;
        if (dy.length === 1) dy = "0" + dy;

        return `${this.parseDay(dte.getDay())} ${mo}.${dy}.${yr} ${hr}:${mn}:${sc}`;
    }

    /**
     * Parses a ban embed for a specified user and channel
     * @param {TwitchUser} streamer
     * @param {TwitchUser} chatter
     * @param {number} bpm
     * @param {number} timebanned 
     * @returns {Promise<EmbedBuilder>}
     */
    parseBanEmbed(streamer, chatter, bpm, timebanned) {
        return new Promise((resolve, reject) => {
            con.query("select twitch__user.display_name, message, deleted, timesent from twitch__chat join twitch__user on twitch__user.id = twitch__chat.user_id where streamer_id = ? and user_id = ? order by timesent desc limit 10;",[
                streamer.id,
                chatter.id
            ], async (err, res) => {
                // Build the skeleton embed for the ban message 
                const embed = new Discord.EmbedBuilder()
                        .setTitle(`User was Banned!`)
                        .setURL(chatter.getShortlink())
                        .setAuthor({name: streamer.display_name, iconURL: streamer.profile_image_url, url: "https://twitch.tv/" + streamer.login})
                        .setDescription(`User \`${chatter.display_name}\` was banned from channel \`${streamer.display_name}\``)
                        .setColor(0xe83b3b);

                if (bpm) embed.setFooter({text: "Bans per Minute: " + bpm})

                // Utilize the streamer refresh token to get the ban reason and moderator name
                if (refreshTokens.hasStreamerToken(streamer.id)) {
                    try {
                        let accessToken = await api.Authentication.Twitch.getAccessToken(refreshTokens.getStreamerToken(streamer.id));
                        let bans = await api.Twitch.TwitchAPI.getBans(streamer.id, chatter.id, accessToken);

                        let ban = null;
                        let banDiff = 2500;

                        bans.forEach(cban => {
                            let timeDiff = Math.abs(timebanned - (new Date(cban.created_at)).getTime());
                            if (banDiff > timeDiff) {
                                ban = cban;
                                banDiff = timeDiff;
                            }
                        });
                        
                        if (ban) {
                            let moderator = await api.Twitch.getUserById(ban.moderator_id);

                            let reason = "No reason provided";

                            if (ban.reason && ban.reason.length > 0)
                                reason = ban.reason;

                            embed.addFields(
                                {
                                    name: "Moderator",
                                    value: codeBlock(moderator.display_name),
                                    inline: true,
                                },
                                {
                                    name: "Reason",
                                    value: codeBlock(reason),
                                    inline: true,
                                }
                            );
                            
                            con.query("update twitch__ban set moderator_id = ?, reason = ? where timebanned = ? and streamer_id = ? and user_id = ?;", [
                                moderator.id,
                                ban.reason,
                                timebanned,
                                streamer.id,
                                chatter.id,
                            ]);
                        }
                    } catch (err) {
                        api.Logger.warning(err);
                    }
                }
                
                // If the query returns results, parse the results and add them to the embed.
                if (typeof(res) === "object") {
                    let logs = "";

                    res = res.reverse();

                    res.forEach(log => {
                        let date = new Date(log.timesent);

                        let hor = date.getHours() + "";
                        let min = date.getMinutes() + "";
                        let sec = date.getSeconds() + "";

                        if (hor.length == 1) hor = "0" + hor;
                        if (min.length == 1) min = "0" + min;
                        if (sec.length == 1) sec = "0" + sec;

                        logs += `\n${hor}:${min}:${sec} [${log.display_name}]: ${log.message}${log.deleted == 1 ? " [❌ deleted]" : ""}`;
                    });

                    if (logs == "") logs = "There are no logs in this channel from this user!";

                    embed.addFields({
                        name: `Chat Log in \`${streamer.display_name}\``,
                        value: codeBlock(logs),
                        inline: false,
                    });
                }

                const lares = await con.pquery("select streamer.display_name as channel, max(timesent) as lastactive from twitch__chat join twitch__user as streamer on twitch__chat.streamer_id = streamer.id where user_id = ? group by streamer.display_name;", [chatter.id]);

                let bannedChannels = [];

                // Get a list of all the channels the user is banned from
                try {
                    let gbcRes = await con.pquery("select distinct tu.display_name as channel from twitch__ban as tb join twitch__user as tu on tb.streamer_id = tu.id where tb.user_id = ? and active = true;", [chatter.id]);

                    gbcRes.forEach(bc => {
                        bannedChannels = [
                            ...bannedChannels,
                            bc.channel
                        ];
                    });
                } catch (err) {
                    global.api.Logger.warning(err);
                }

                let longestChannelName = 7;
                let activeChannels = "";

                // Calculate longest channel name
                lares.forEach(xchnl => {
                    if (xchnl.channel.length > longestChannelName) longestChannelName = xchnl.channel.length;
                });

                bannedChannels.forEach(chnl => {
                    if (chnl.length > longestChannelName) longestChannelName = chnl.length;
                });

                // Assemble active channels
                lares.forEach(xchnl => {
                    activeChannels += "\n" + xchnl.channel + (' '.repeat(Math.max(1, longestChannelName + ACTIVE_CHANNEL_PADDING - xchnl.channel.length))) + this.parseDate(parseInt(xchnl.lastactive)) + (bannedChannels.includes(xchnl.channel) || xchnl.channel.toLowerCase() === streamer.login ? ' [❌ banned]' : '');

                    bannedChannels.splice(bannedChannels.indexOf(xchnl.channel), 1);
                });

                // Assemble "also banned in" section
                if (bannedChannels.length > 0) {
                    activeChannels += "\nAlso banned in:";
                }

                bannedChannels.forEach(chnl => {
                    activeChannels += "\n" + chnl + (' '.repeat(Math.max(1, longestChannelName + ACTIVE_CHANNEL_PADDING - chnl.length))) + "Never Active" + (' '.repeat(12)) + '[❌ banned]';
                });

                // Add the field, if any active channels were found (which should pretty much always be true)
                if (activeChannels !== "")
                    embed.addFields({
                        name: "Active in Channels:",
                        value: codeBlock(`Channel${' '.repeat(longestChannelName + ACTIVE_CHANNEL_PADDING - 7)}Last Active${activeChannels}`),
                        inline: false,
                    });
                
                resolve(embed);
            });
        });
    }
}

module.exports = new Formatting();