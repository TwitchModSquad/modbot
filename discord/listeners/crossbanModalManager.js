const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const Discord = require("discord.js");
const api = require("../../api/index");
const {storedCrossBanChannels, storedCrossBanUser} = require("./crossbanManager");

const config = require("../../config.json");
const con = require("../../database");

const refreshToken = refresh_token => {
    return new Promise(async (resolve, reject) => {
        const oauthResult = await fetch("https://id.twitch.tv/oauth2/token", {
            method: 'POST',
            body: new URLSearchParams({
                client_id: config.twitch.client_id,
                client_secret: config.twitch.client_secret,
                refresh_token: refresh_token,
                grant_type: "refresh_token",
            }),
        });
    
        oauthResult.json().then(resolve, reject);
    });
}

const addBan = (broadcaster_id, moderator_id, access_token, user_id, reason) => {
    return new Promise(async (resolve, reject) => {
        const oauthResult = await fetch(`https://api.twitch.tv/helix/moderation/bans?broadcaster_id=${encodeURIComponent(broadcaster_id)}&moderator_id=${encodeURIComponent(moderator_id)}`, {
            method: 'POST',
            headers: {
                Authorization: "Bearer " + access_token,
                "Client-Id": config.twitch.client_id,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({data:{user_id: user_id, reason: reason}}),
        });
    
        oauthResult.json().then(resolve, reject);
    });
}

const listener = {
    name: 'crossbanModalManager',
    eventName: 'modalSubmit',
    eventType: 'on',
    async listener (modal) {
        const handleError = (err, method = "reply") => {
            console.error(err);
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
                    let refresh_token = (await con.pquery("select refresh_token from twitch__user where id = ?;", [modUser.id]))?.[0]?.refresh_token;

                    const oauthData = await refreshToken(refresh_token);

                    if (oauthData?.access_token) {
                        userClient = true;
                        modId = modUser.id;
                        accessToken = oauthData.access_token;
                    }
                }
            } catch (err) {
                console.error(err);
                handleError(err, "editReply");
                return;
            }

            console.log(reason);

            let successes = "";
            let errors = "";

            for (let i = 0; i < crossBanChannels.length; i++) {
                let channel = crossBanChannels[i];
                try {
                    channel = await api.Twitch.getUserById(channel, false, true);

                    if (userClient) {
                        let result = await addBan(channel.id, modId, accessToken, user.id, reason);

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