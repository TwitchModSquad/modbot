const Discord = require("discord.js");
const api = require("../../api/index");
const {storedCrossBanChannels, storedCrossBanUser} = require("./crossbanManager");

const config = require("../../config.json");
const con = require("../../database");

const listener = {
    name: 'crossbanModalManager',
    eventName: 'modalSubmit',
    eventType: 'on',
    async listener (modal) {
        const handleError = (err, method = "reply") => {
            global.api.Logger.warning(err);
            modal[method]({content: ' ', embeds: [new Discord.MessageEmbed().setTitle("Uh oh!").setDescription(""+err).setColor(0x9e392f)], ephemeral: true})
        }


        let reason = modal.getTextInputValue("reason");
        let thumbprint = modal.getTextInputValue("include-thumbprint");

        if (reason === null) reason = "";
        if (thumbprint) {
            thumbprint = thumbprint.toLowerCase() !== "no"
        } else {
            thumbprint = true;
        }
        
       
        if (modal.customId.startsWith("cb-ban-")) {
            await modal.deferReply({ ephemeral: true });

            let crossBanChannels = storedCrossBanChannels[modal.user.id];
            let twitchId = modal.customId.substring(7);

            let user;
            let userClient = false;
            let modId;
            let accessToken;

            try {
                user = await api.Twitch.getUserById(twitchId, false, true);

                if (thumbprint) {
                    let thumbprintString = "tms#" + user.id;
                    if (reason.length == 0) {
                        reason = thumbprintString;
                    } else {
                        reason += " - " + thumbprintString;
                    }
                }

                if (storedCrossBanUser[modal.user.id]) {
                    let modUser = storedCrossBanUser[modal.user.id];
                    let refreshToken = (await con.pquery("select refresh_token from twitch__user where id = ?;", [modUser.id]))?.[0]?.refresh_token;

                    accessToken = await api.Authentication.Twitch.getAccessToken(refreshToken);

                    userClient = true;
                    modId = modUser.id;
                }
            } catch (err) {
                global.api.Logger.warning(err);
                handleError(err, "editReply");
                return;
            }

            let successes = "";
            let errors = "";

            for (let i = 0; i < crossBanChannels.length; i++) {
                let channel = crossBanChannels[i];
                try {
                    channel = await api.Twitch.getUserById(channel, false, true);

                    if (userClient) {
                        let result = await api.Twitch.TwitchAPI.banUser(channel.id, modId, accessToken, user.id, reason);
                        
                        if (result?.message) {
                            errors += `\n${channel?.display_name ? channel.display_name : channel}: ${result.message}`;
                            continue;
                        }
                    } else {
                        await global.client.ban.ban(channel.display_name.toLowerCase(), user.display_name.toLowerCase(), reason);
                    }

                    successes += `\n${channel.display_name}`;
                } catch(err) {
                    errors += `\n${channel?.display_name ? channel.display_name : channel}: ${err}`;
                }
            }

            let embed = new Discord.MessageEmbed()
                    .setTitle("Crossban Results")
                    .setDescription("Do not forget to dismiss the crossban messages!")
                    .setColor(0x4aab37);

            if (successes !== "") {
                embed.addField("Successful Bans", "```" + successes + "```", true);
            }
            if (errors !== "") {
                embed.addField("Unsuccessful Bans", "```" + errors + "```", true);
            }

            modal.editReply({content: ' ', embeds: [embed], ephemeral: true})
        }
    }
};

module.exports = listener;