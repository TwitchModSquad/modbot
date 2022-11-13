const Discord = require("discord.js");
const api = require("../../api/index");
const formatting = require("../../twitch/Formatting");

const config = require("../../config.json");
const con = require("../../database");

const listener = {
    name: 'hideBanModal',
    eventName: 'modalSubmit',
    eventType: 'on',
    async listener (modal) {
        const handleSuccess = message => {
            modal.reply({content: ' ', embeds: [new Discord.MessageEmbed().setTitle(message).setColor(0x2dad3e)], ephemeral: true})
        }

        const handleError = (err, method = "reply") => {
            global.api.Logger.warning(err);
            modal[method]({content: ' ', embeds: [new Discord.MessageEmbed().setTitle("Uh oh!").setDescription(""+err).setColor(0x9e392f)], ephemeral: true})
        }

        let reason = modal.getTextInputValue("reason");

        if (reason === null) reason = "";
       
        if (modal.customId === "hide-ban") {
            con.query("select streamer_id, user_id, timebanned from twitch__ban where discord_message = ?;", [modal.message.id], async (err, res) => {
                // Get streamer & chatter users
                let streamer = null;
                let chatter = null;
                let timebanned = null;
                if (!err) {
                    if (res.length > 0) {
                        try {
                            streamer = await api.Twitch.getUserById(res[0].streamer_id);
                            chatter = await api.Twitch.getUserById(res[0].user_id);
                            timebanned = res[0].timebanned;
                        } catch (err) {
                            api.Logger.warning(err);
                        }
                    }
                } else {
                    api.Logger.warning(err);
                }

                // Authenticate
                let auth = false;
                let errorInfo = "Your Discord account is not linked to TMS";
                if (modal.member.roles.cache.find(x => x.id === config.roles.administrator || x.id === config.roles.moderator)) {
                    auth = true;
                }
    
                if (!auth && streamer) {
                    try {
                        const discordUser = await api.Discord.getUserById(modal.member.id);
                        if (discordUser.identity?.id) {
                            const identity = await api.getFullIdentity(discordUser.identity.id);
                            let channels = await identity.getActiveModeratorChannels();
                            if (identity.twitchAccounts.find(x => x.id === streamer.id) || channels.find(x => x.modForIdentity.twitchAccounts.find(y => y.id === streamer.id))) {
                                auth = true;
                            } else {
                                let channelsStr = "";

                                identity.twitchAccounts.forEach(twitchAccount => {
                                    if (twitchAccount.affiliation === "partner" || twitchAccount.follower_count >= 5000) {
                                        channelsStr += "\n" + twitchAccount.display_name;
                                    }
                                });

                                channels.forEach(link => {
                                    link.modForIdentity.twitchAccounts.forEach(twitchAccount => {
                                        channelsStr += "\n" + twitchAccount.display_name;
                                    });
                                });

                                if (channelsStr === "") channelsStr = "No authorized channels found.";

                                errorInfo = `Your account is not authorized to modify ban data under \`${streamer.display_name}\`.\n\n**Authorized channels:**\`\`\`${channelsStr}\`\`\``;
                            }
                        }
                    } catch (err) {
                        errorInfo = "An unknown error occurred: " + err;
                        api.Logger.warning(err);
                    }
                }
    
                if (!auth) {
                    handleError("You don't have permission to use this command!\n**Error information:** " + errorInfo)
                    return;
                }

                const banEmbed = await formatting.parseBanEmbed(streamer, chatter, null, timebanned);
                const hiddenEmbed = new Discord.MessageEmbed()
                    .setTitle("Hidden Ban Log")
                    .setDescription(`This record was hidden by ${modal.member} on \`${formatting.parseDate(Date.now())}\``)
                    .setColor(0xfa4b3e)
                    .addField("Hide Reason", "```" + reason + "```");

                const reinstateButton = new Discord.MessageButton()
                        .setCustomId("reinstate-ban")
                        .setLabel("Reinstate Ban")
                        .setStyle("PRIMARY");
                const row = new Discord.MessageActionRow()
                        .setComponents(reinstateButton);

                let oldMessageId = modal.message.id;
                // Retrieve hidden ban channel
                modal.member.guild.channels.fetch(config.hiddenban_channel).then(hiddenBanChannel => {
                    // Hide ban
                    modal.message.delete().then(() => {
                        hiddenBanChannel.send({content: ' ', embeds: [banEmbed, hiddenEmbed], components: [row]}).then(message => {
                            con.query("update twitch__ban set discord_message = ?, hide_reason = ? where discord_message = ?;", [message.id, reason, oldMessageId], err => {
                                if (err) {
                                    handleError(err);
                                } else {
                                    handleSuccess(`Successfully hid ban: '${chatter.display_name}' from '${streamer.display_name}'`)
                                }
                            });
                        }, handleError)
                    }, handleError);
                }, handleError)
            });
        }
    }
};

module.exports = listener;