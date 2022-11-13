const {Modal, TextInputComponent, showModal} = require("discord-modals");
const Discord = require("discord.js");
const api = require("../../api/");
const config = require("../../config.json");
const con = require("../../database");

const listener = {
    name: 'hideBanButton',
    eventName: 'interactionCreate',
    eventType: 'on',
    async listener (interaction) {
        if (interaction.isButton() && !interaction.component?.customId) return;

        const handleError = (err, method = "reply") => {
            interaction[method]({content: ' ', embeds: [new Discord.MessageEmbed().setTitle("Uh oh!").setDescription(err).setColor(0x9e392f)], ephemeral: true})
        }

        if (interaction.isButton() && interaction.component.customId === "hide-ban") {

            con.query("select streamer_id, user_id from twitch__ban where discord_message = ?;", [interaction.message.id], async (err, res) => {
                // Get streamer & chatter users
                let streamer = null;
                let chatter = null;
                if (!err) {
                    if (res.length > 0) {
                        try {
                            streamer = await api.Twitch.getUserById(res[0].streamer_id);
                            chatter = await api.Twitch.getUserById(res[0].user_id);
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
                if (interaction.member.roles.cache.find(x => x.id === config.roles.administrator || x.id === config.roles.moderator)) {
                    auth = true;
                }
    
                if (!auth && streamer) {
                    try {
                        const discordUser = await api.Discord.getUserById(interaction.member.id);
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

                // Send embed
                let title = "Hide Ban";

                if (streamer && chatter) title = `Hide ban: '${chatter.display_name}' in '${streamer.display_name}'`;

                const modal = new Modal()
                    .setCustomId("hide-ban")
                    .setTitle(title)
                    .addComponents(
                        new TextInputComponent()
                            .setCustomId("reason")
                            .setLabel("Hide Reason")
                            .setPlaceholder("Why is this ban being hidden?")
                            .setStyle("SHORT")
                            .setMinLength(3)
                            .setMaxLength(64)
                            .setRequired(true)
                    );
        
                showModal(modal, {
                    client: global.client.discord,
                    interaction: interaction,
                });
            });
        }
    }
};

module.exports = listener;