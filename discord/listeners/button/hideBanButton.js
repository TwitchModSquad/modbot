const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const api = require("../../../api");
const config = require("../../../config.json");
const con = require("../../../database");

const listener = {
    name: 'hideBanButton',
    /**
     * Verifies a button press should be sent to this listener
     * @param {ButtonInteraction} interaction 
     */
    verify(interaction) {
        return interaction.component.customId === "hide-ban";
    },
    /**
     * Listener for a button press
     * @param {ButtonInteraction} interaction 
     */
    async listener (interaction) {
        
        const handleError = (err, method = "reply") => {
            interaction[method]({embeds: [new EmbedBuilder().setTitle("Uh oh!").setDescription(err).setColor(0x9e392f)], ephemeral: true})
        }

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
            let title = "Hide ban";

            if (streamer && chatter) title = `Hide ban: '${chatter.display_name}' in '${streamer.display_name}'`;

            if (title.length > 45) title = "Hide ban: " + chatter.display_name;

            const reason = new TextInputBuilder()
                .setCustomId("reason")
                .setLabel("Hide Reason")
                .setPlaceholder("Why is this ban being hidden?")
                .setStyle(TextInputStyle.Short)
                .setMinLength(3)
                .setMaxLength(64)
                .setRequired(true);

            const modal = new ModalBuilder()
                .setCustomId("hide-ban")
                .setTitle(title)
                .addComponents(
                        new ActionRowBuilder().addComponents(reason)
                    );
    
            interaction.showModal(modal);
        });
    }
};

module.exports = listener;