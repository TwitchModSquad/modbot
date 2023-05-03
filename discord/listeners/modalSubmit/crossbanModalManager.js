const Discord = require("discord.js");
const api = require("../../../api/index");
const {storedCrossBanChannels, storedCrossBanUser} = require("../button/crossbanManager");

const config = require("../../../config.json");
const con = require("../../../database");
const { codeBlock } = require("discord.js");

const listener = {
    name: 'crossbanModalManager',
    /**
     * Verifies a button press should be sent to this listener
     * @param {ModalSubmitInteraction} interaction 
     */
    verify(interaction) {
        return interaction.customId.startsWith("cb-ban-");
    },
    /**
     * Listener for a button press
     * @param {ModalSubmitInteraction} interaction 
     */
    async listener (interaction) {
        const handleError = (err, method = "reply") => {
            global.api.Logger.warning(err);
            interaction[method]({embeds: [new Discord.EmbedBuilder().setTitle("Uh oh!").setDescription(""+err).setColor(0x9e392f)], ephemeral: true})
        }


        let reason = interaction.fields.getTextInputValue("reason");
        let thumbprint = interaction.fields.getTextInputValue("include-thumbprint");

        if (reason === null) reason = "";
        if (thumbprint) {
            thumbprint = thumbprint.toLowerCase() !== "no"
        } else {
            thumbprint = true;
        }
        
        await interaction.deferReply({ ephemeral: true });

        let crossBanChannels = storedCrossBanChannels[interaction.user.id];
        let twitchId = interaction.customId.substring(7);

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

            if (storedCrossBanUser[interaction.user.id]) {
                let modUser = storedCrossBanUser[interaction.user.id];
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
                    await global.client.ban.ban(channel.login, user.login, reason);
                }

                successes += `\n${channel.display_name}`;
            } catch(err) {
                errors += `\n${channel?.display_name ? channel.display_name : channel}: ${err}`;
            }
        }

        let embed = new Discord.EmbedBuilder()
                .setTitle("Crossban Results")
                .setDescription("Do not forget to dismiss the crossban messages!")
                .setColor(0x4aab37);

        if (successes !== "") {
            embed.addFields({
                name: "Successful Bans",
                value: codeBlock(successes),
                inline: true,
            })
        }
        if (errors !== "") {
            embed.addFields({
                name: "Unsuccessful Bans",
                value: codeBlock(errors),
                inline: true,
            })
        }

        interaction.editReply({embeds: [embed], ephemeral: true})
    }
};

module.exports = listener;