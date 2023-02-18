const Discord = require("discord.js");
const api = require("../../api/index");
const formatting = require("../../twitch/Formatting");

const config = require("../../config.json");
const con = require("../../database");

const listener = {
    name: 'reinstateBanButton',
    eventName: 'interactionCreate',
    eventType: 'on',
    async listener (interaction) {
        if (interaction.isButton() && !interaction.component?.customId) return;

        const handleSuccess = message => {
            interaction.reply({embeds: [new Discord.EmbedBuilder().setTitle(message).setColor(0x2dad3e)], ephemeral: true})
        }

        const handleError = (err, method = "reply") => {
            global.api.Logger.warning(err);
            interaction[method]({embeds: [new Discord.EmbedBuilder().setTitle("Uh oh!").setDescription(""+err).setColor(0x9e392f)], ephemeral: true})
        }

        if (interaction.isButton() && interaction.component.customId === "reinstate-ban") {
            con.query("select streamer_id, user_id, timebanned from twitch__ban where discord_message = ?;", [interaction.message.id], async (err, res) => {
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
                let errorInfo = "You are not an administrator or moderator";
                if (interaction.member.roles.cache.find(x => x.id === config.roles.administrator || x.id === config.roles.moderator)) {
                    auth = true;
                }
    
                if (!auth) {
                    handleError("You don't have permission to use this command!\n**Error information:** " + errorInfo)
                    return;
                }

                const banEmbed = await formatting.parseBanEmbed(streamer, chatter, null, timebanned);

                const crossbanButton = new Discord.ButtonBuilder()
                        .setCustomId("cb-" + chatter.id)
                        .setLabel("Crossban")
                        .setStyle("DANGER");
        
                const hideButton = new Discord.ButtonBuilder()
                        .setCustomId("hide-ban")
                        .setLabel("Hide Ban")
                        .setStyle("SECONDARY");
                
                const row = new Discord.MessageActionRow()
                        .addComponents(crossbanButton, hideButton)

                let oldMessageId = interaction.message.id;
                // Retrieve hidden ban channel
                interaction.member.guild.channels.fetch(config.liveban_channel).then(banChannel => {
                    // Hide ban
                    interaction.message.delete().then(() => {
                        banChannel.send({embeds: [banEmbed], components: [row]}).then(message => {
                            con.query("update twitch__ban set discord_message = ?, hide_reason = null where discord_message = ?;", [message.id, oldMessageId], err => {
                                if (err) {
                                    handleError(err);
                                } else {
                                    handleSuccess(`Successfully reinstated ban: '${chatter.display_name}' from '${streamer.display_name}'`)
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