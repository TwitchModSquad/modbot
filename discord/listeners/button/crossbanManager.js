const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");
const api = require("../../../api/index");
const config = require("../../../config.json");
const con = require("../../../database");

let crossbanable = [];
api.Twitch.getUserById(config.twitch.id, false, true).then(tmsUser => {
    tmsUser.refreshStreamers().then(streamers => {
        streamers.forEach(streamer => {
            crossbanable = [
                ...crossbanable,
                streamer.id
            ];
        });
    }).catch(global.api.Logger.warning);
}).catch(global.api.Logger.warning);

const listener = {
    name: 'crossbanManager',
    /**
     * Verifies a button press should be sent to this listener
     * @param {ButtonInteraction} interaction 
     */
    verify(interaction) {
        return interaction.isButton() && interaction.component.customId.startsWith("cb-");
    },
    storedCrossBanChannels: [],
    storedCrossBanUser: [],
    /**
     * Listener for a button press
     * @param {ButtonInteraction} interaction 
     */
    async listener (interaction) {
        const handleSuccess = message => {
            interaction.reply({embeds: [new EmbedBuilder().setTitle(message).setColor(0x2dad3e)], ephemeral: true})
        }

        const handleError = (err, method = "reply") => {
            global.api.Logger.warning(err);
            interaction[method]({embeds: [new EmbedBuilder().setTitle("Uh oh!").setDescription(err).setColor(0x9e392f)], ephemeral: true})
        }
        
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
                            global.api.Logger.warning(err);
                        }

                        let streamers = (await identity.twitchAccounts[i].getStreamers()).map(x => x.streamer);
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
                        const selectMenu = new StringSelectMenuBuilder()
                            .setCustomId("cbsel-" + twitchId)
                            .addOptions(options)
                            .setPlaceholder("Select streamer channels to carry out the crossban on.")
                            .setMinValues(1)
                            .setMaxValues(options.length);

                        const row = new ActionRowBuilder()
                                .addComponents(selectMenu);

                        const embed = new EmbedBuilder()
                                .setTitle("Select the streamers you'd like to crossban for.")
                                .setColor(0xe83b3b)
                                .setDescription("This list is a list of users you mod for that have TwitchModSquad authenticated. It may take several hours for a channel to show up if it recently met these requirements.");

                        interaction.reply({embeds: [embed], components: [row], ephemeral: true});
                    } else {
                        handleError("No streamers you mod for have TwitchModSquad added as a moderator.");
                    }
                }).catch(err => handleError(err + ""));
            } else {
                handleError("You must link your account with TMS before you can use Crossban functions!\nAsk a user for an invite link.");
            }
        }).catch(handleError);
    }
};

module.exports = listener;