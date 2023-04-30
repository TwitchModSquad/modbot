const { ModalSubmitInteraction, EmbedBuilder, codeBlock } = require("discord.js");
const tmi = require('tmi.js');
const api = require("../../../api/");
const con = require("../../../database");
const config = require("../../../config.json");

const {memory} = require("../../commands/connect");
const FullIdentity = require("../../../api/FullIdentity");

const comma = x => {
    if (!x) return "0";
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const CHAT_POPOUT_URI  = "https://www.twitch.tv/popout/{channel}/chat?popout=";

const listener = {
    name: 'connectManager',
    connectingUsers: [],
    /**
     * Verifies a button press should be sent to this listener
     * @param {ModalSubmitInteraction} interaction 
     */
    verify(interaction) {
        return interaction.customId === "connect";
    },
    /**
     * Listener for a button press
     * @param {ModalSubmitInteraction} interaction 
     */
    async listener (interaction) {
        const streamers = interaction.fields.getTextInputValue("streamers");
        const username = interaction.fields.getTextInputValue("username");
        const nickname = interaction.fields.getTextInputValue("nickname");

        let twitchUser = null;
        let userIdentity = null;
        try {
            twitchUser = (await api.Twitch.getUserByName(username, true))[0];
            if (twitchUser.identity.id) {
                userIdentity = await api.getFullIdentity(twitchUser.identity.id);
            }
        } catch(err) {
            interaction.error("Unable to find your twitch username!");
        }

        const splitStreamers = streamers.split("\n");

        let resolvedUsers = [];
        let unresolvedUsers = [];

        await interaction.deferReply({ephemeral: true});

        for (let i = 0; i < splitStreamers.length; i++) {
            try {
                const user = (await api.Twitch.getUserByName(splitStreamers[i], true))[0];
                await user.refreshFollowers();
                resolvedUsers = [
                    ...resolvedUsers,
                    user,
                ];
            } catch(err) {
                api.Logger.warning(err);
                unresolvedUsers = [
                    ...unresolvedUsers,
                    splitStreamers[i],
                ]
            }
        }

        if (unresolvedUsers.length > 0) {
            const embed = new EmbedBuilder()
                .setTitle("Some streamers could not be resolved!")
                .setDescription("Please edit your streamer list and try the command again.")
                .setColor(0x9e392f);

            if (resolvedUsers.length > 0) {
                resolvedUsers.sort((a,b) => a - b);
                let resolvedUserString = "";

                resolvedUsers.forEach(user => {
                    resolvedUserString += `\n${user.display_name} (${comma(user.follower_count)} followers)${user.affiliation === "partner" ? " [partner]" : ""}`
                });

                embed.addFields({
                    name: "Resolved Users",
                    value: codeBlock(resolvedUserString),
                });
            }

            unresolvedUsers.sort();
            embed.addFields({
                name: "Unresolved Users",
                value: codeBlock(unresolvedUsers.join("\n")),
            });

            interaction.editReply({
                embeds: [embed],
                ephemeral: true,
            }).catch(api.Logger.warning);

            memory[interaction.user.id] = {
                streamers: streamers,
                nickname: nickname,
            };

            return;
        }

        let active = false;
        resolvedUsers.forEach(user => {
            if (user.affiliation === "partner" || user.follower_count >= 5000) 
                active = true;
        });

        if (!active) {
            const embed = new EmbedBuilder()
                .setTitle("None of the provided streamers meet TMS requirements")
                .setDescription("Currently, in order to join TMS, you must moderate for at least one streamer that has over 5,000 followers, or is a Twitch partner.")
                .setColor(0x9e392f);

            interaction.editReply({
                embeds: [embed],
                ephemeral: true,
            }).catch(api.Logger.warning);

            memory[interaction.user.id] = {
                streamers: streamers,
                nickname: nickname,
            };

            return;
        }

        for (let i = 0; i < resolvedUsers.length; i++) {
            let user = resolvedUsers[i];
            if (!user.identity?.id) {
                const identity = new FullIdentity(null, user.display_name, false, false, false, [user], []);
                await identity.post();
            }
        }

        await interaction.editReply({content: "Initializing TMI client...", ephemeral: true});

        if (!userIdentity) {
            userIdentity = new FullIdentity(null, twitchUser.display_name, false, false, false, [twitchUser], [await api.Discord.getUserById(interaction.user.id, false, true)])
        }

        if (userIdentity.authenticated) {
            interaction.editReply({content: "You are already authenticated with TMS!"});
            return;
        }

        let confirmedModerator = [];
        let confirmedNotModerator = [];

        let dmMessage = null;
        let authActive = twitchUser.affiliation === "partner" || twitchUser.follower_count >= 5000;

        const updateMessage = () => {
            const embed = new EmbedBuilder()
                .setTitle("Connect Streamers")
                .setDescription(
                    "Verify that you are a moderator in these channels by typing messages in the following channels:\n\n" +
                    resolvedUsers
                        .map(x => `[${x.display_name}](${CHAT_POPOUT_URI.replace("{channel}", x.login)}) (${comma(x.follower_count)} followers)${x.affiliation === "partner" ? " [partner]" : ""}`)
                        .join("\n")
                );

            if (!dmMessage) {
                embed.setFooter({
                    text: "Avoid dismissing this message - it will walk you through the connection process!",
                    iconURL: "https://tms.to/assets/images/logos/logo.webp",
                });
            }
            
            if (confirmedModerator.length > 0) {
                embed.addFields({
                    name: "Confirmed Streamers",
                    value: confirmedModerator
                            .map(x => `[${x.display_name}](${CHAT_POPOUT_URI.replace("{channel}", x.login)}) (${comma(x.follower_count)} followers)${x.affiliation === "partner" ? " [partner]" : ""}`)
                            .join("\n")
                })
            }
        
            if (confirmedNotModerator.length > 0) {
                embed.addFields({
                    name: "Denied Streamers",
                    value: confirmedNotModerator
                            .map(x => `[${x.display_name}](${CHAT_POPOUT_URI.replace("{channel}", x.login)}) (${comma(x.follower_count)} followers)${x.affiliation === "partner" ? " [partner]" : ""}`)
                            .join("\n"),
                })
            }

            if (authActive) {
                embed.addFields({
                    name: "Connect",
                    value: "You have met the requirements to join TMS!\nWhen completed, please follow this link to complete authentication:\n" + config.api_domain + "connect",
                    inline: false,
                })
            }

            const message = {embeds: [embed], ephemeral: true};
            interaction.editReply(message)
                .catch(err => {
                    api.Logger.warning(err)
                    if (dmMessage) {
                        dmMessage.edit(message).catch(api.Logger.severe);
                    } else {
                        interaction.user.send(message).then(message => {
                            dmMessage = message;
                        }).catch(api.Logger.severe);
                    }
                });
        }

        const client = new tmi.Client({
            options: {
                // joinInterval: 5000,
                skipMembership: true,
            },
            connection: { reconnect: true },
            channels: resolvedUsers.map(x => x.login),
            identity: {
                username: config.twitch.username,
                password: config.twitch.oauth,
            },
        });
        
        client.on("message", async (channel, tags, message, self) => {
            const user = await api.Twitch.getUserById(tags["user-id"]);
            if (user.id === twitchUser.id && resolvedUsers.find(x => x.login === channel.replace("#",""))) {
                let streamer = resolvedUsers.find(x => x.login === channel.replace("#", ""));
                if (!streamer) return;
                resolvedUsers = resolvedUsers.filter(x => x.id !== streamer.id);

                if (tags.hasOwnProperty("badges-raw") && tags["badges-raw"].includes("moderator/")) {
                    confirmedModerator = [
                        ...confirmedModerator,
                        streamer,
                    ];

                    if (streamer.affiliation === "partner" || streamer.follower_count >= 5000) {
                        if (!authActive) {
                            authActive = true;
                            listener.connectingUsers.push({
                                identity: userIdentity,
                                twitchAuth: false,
                                connect: async () => {
                                    let roles = [];

                                    if (twitchUser.affiliation === "partner") {
                                        roles = [config.partnered.streamer];
                                    } else if (twitchUser.follower_count >= 5000) {
                                        roles = [config.affiliate.streamer];
                                    }

                                    for (let i = 0; i < confirmedModerator.length; i++) {
                                        let streamer = confirmedModerator[i];

                                        if (streamer.affiliation === "partner") {
                                            roles = [
                                                ...roles,
                                                config.partnered.moderator,
                                            ];
                                        } else if (streamer.follower_count >= 5000) {
                                            roles = [
                                                ...roles,
                                                config.affiliate.moderator,
                                            ];
                                        }

                                        if (streamer.identity?.id) {
                                            try {
                                                await con.pquery("insert into identity__moderator (identity_id, modfor_id, active) values (?, ?, ?);", [userIdentity.id, streamer.identity.id, streamer.affiliation === "partner" || streamer.follower_count >= 5000]);
                                            } catch(err) {
                                                api.Logger.warning(err);
                                            }
                                        }
                                    }
                                    userIdentity.authenticated = true;
                                    await userIdentity.post();

                                    const embed = new EmbedBuilder()
                                        .setTitle("You have been authenticated successfully!")
                                        .setDescription(`Nice to see you, \`${userIdentity.twitchAccounts[0].display_name}\``)
                                        .addFields({
                                            name: "Added Roles",
                                            value: roles.map(x => `<@${x}>`).join(" "),
                                            inline: false,
                                        });

                                    const message = {content: '', embeds: [embed], ephemeral: true};
                                    interaction.editReply(message)
                                        .catch(err => {
                                            api.Logger.warning(err)
                                            if (dmMessage) {
                                                dmMessage.edit(message).catch(api.Logger.severe);
                                            } else {
                                                interaction.user.send(message).then(message => {
                                                    dmMessage = message;
                                                }).catch(api.Logger.severe);
                                            }
                                        });

                                    interaction.member.roles.add(roles).catch(api.Logger.severe);

                                    if (nickname && nickname.length >= 2)
                                        interaction.member.setNickname(`${interaction.member.displayName} (${nickname})`);

                                    await client.disconnect();
                                },
                            });
                        }
                    }
                    
                } else {
                    confirmedNotModerator = [
                        ...confirmedNotModerator,
                        streamer,
                    ];
                }

                updateMessage();
            }
        });

        client.on("connected", () => {
            api.Logger.info(`Connected TMI client for ${twitchUser.display_name}: ${resolvedUsers.length} channel(s)`)

            updateMessage();

            timeout = setTimeout(() => {
                interaction.editReply("Timed out").catch(api.Logger.severe);
                client.disconnect().catch(api.Logger.severe);
            }, 10 * 60 * 1000);
        });

        client.connect().catch(e => {
            api.Logger.severe(e);
            interaction.editReply({content: "Unable to connect to TMI. Please contact an administrator", ephemeral: true});
        });
    }
};

module.exports = listener;