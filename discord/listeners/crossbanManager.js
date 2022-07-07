const {Modal, TextInputComponent, SelectMenuComponent, showModal} = require("discord-modals");
const Discord = require("discord.js");
const api = require("../../api/index");
const config = require("../../config.json");
const con = require("../../database");

let crossbanable = [];
api.Twitch.getUserById(config.twitch.id, false, true).then(tmsUser => {
    tmsUser.refreshStreamers().then(streamers => {
        streamers.forEach(streamer => {
            crossbanable = [
                ...crossbanable,
                streamer.id
            ];
        });
    }).catch(console.error);
}).catch(console.error);

const listener = {
    name: 'crossbanManager',
    eventName: 'interactionCreate',
    eventType: 'on',
    storedCrossBanChannels: [],
    storedCrossBanUser: [],
    async listener (interaction) {
        const handleSuccess = message => {
            interaction.reply({content: ' ', embeds: [new Discord.MessageEmbed().setTitle(message).setColor(0x2dad3e)], ephemeral: true})
        }

        const handleError = (err, method = "reply") => {
            console.error(err);
            interaction[method]({content: ' ', embeds: [new Discord.MessageEmbed().setTitle("Uh oh!").setDescription(err).setColor(0x9e392f)], ephemeral: true})
        }

        if (interaction.isButton() && !interaction.component?.customId) return;

        if (interaction.isButton() && interaction.component.customId.startsWith("cb-")) {
            let twitchId = interaction.component.customId.substring(3);

            api.Discord.getUserById(interaction.member.id, false, true).then(user => {
                if (user.identity?.id) {
                    api.getFullIdentity(user.identity.id).then(async identity => {
                        let options = [];
                        
                        for (let i = 0; i < identity.twitchAccounts.length; i++) {
                            let refreshToken;
                            try {
                                refreshToken = (await con.pquery("select refresh_token from twitch__user where id = ?;", [identity.twitchAccounts[i].id]))?.[0]?.refresh_token;
                                listener.storedCrossBanUser[interaction.member.id] = identity.twitchAccounts[i];
                            } catch(err) {
                                console.error(err);
                            }

                            let streamers = await identity.twitchAccounts[i].getStreamers();
                            for (let s = 0; s < streamers.length; s++) {
                                if (refreshToken || crossbanable.indexOf(streamers[s].id) !== -1) {
                                    options = [
                                        ...options,
                                        {
                                            value: streamers[s].id + "",
                                            label: streamers[s].display_name,
                                        }
                                    ];
                                }
                            }
                        }

                        if (options.length > 0) {
                            const selectMenu = new Discord.MessageSelectMenu()
                                .setCustomId("cbsel-" + twitchId)
                                .addOptions(options)
                                .setPlaceholder("Select streamer channels to carry out the crossban on.")
                                .setMinValues(1)
                                .setMaxValues(options.length);

                            const row = new Discord.MessageActionRow()
                                    .addComponents(selectMenu);

                            const embed = new Discord.MessageEmbed()
                                    .setTitle("Select the streamers you'd like to crossban for.")
                                    .setColor(0xe83b3b)
                                    .setDescription("This list is a list of users you mod for that have TwitchModSquad authenticated. It may take several hours for a channel to show up if it recently met these requirements.");

                            interaction.reply({content: ' ', embeds: [embed], components: [row], ephemeral: true});
                        } else {
                            handleError("No streamers you mod for have TwitchModSquad added as a moderator.");
                        }
                    }).catch(err => handleError(err + ""));
                } else {
                    handleError("You must link your account with TMS before you can use Crossban functions!\nAsk a user for an invite link.");
                }
            }).catch(handleError);
        } else if (interaction.isSelectMenu() && interaction.component.customId.startsWith("cbsel-")) {
            let twitchId = interaction.component.customId.substring(6);
            listener.storedCrossBanChannels[interaction.member.id] = interaction.values;

            api.Twitch.getUserById(twitchId).then(async user => {
                const modal = new Modal()
                .setCustomId("cb-ban-" + user.id)
                .setTitle("Ban User " + user.display_name)
                .addComponents(
                    new TextInputComponent()
                        .setCustomId("reason")
                        .setLabel("Ban Reason")
                        .setPlaceholder("This reason is sent to Twitch and is viewable by the user")
                        .setStyle("SHORT")
                        .setMinLength(3)
                        .setMaxLength(64)
                        .setRequired(false),
                    new TextInputComponent()
                        .setCustomId("include-thumbprint")
                        .setLabel("Include Thumbprint (yes/no)")
                        .setDefaultValue("Yes")
                        .setStyle("SHORT")
                        .setMinLength(2)
                        .setMaxLength(3)
                        .setRequired(false)
                );
    
                showModal(modal, {
                    client: global.client.discord,
                    interaction: interaction,
                });
            }, err => {
                handleError(err);
            });
        }
    }
};

module.exports = listener;