const { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
const api = require("../../api/index");
const con = require("../../database");

const config = require("../../config.json");

const command = {
    data: {
        name: 'group'
        , description: 'Create, modify and view TMS groups'
        , options: [
            {
                type: 1,
                name: "create",
                description: "Create a new group",
                options: [
                    {
                        type: 3,
                        name: "game",
                        description: "Hosted game for this group",
                        required: true,
                    },
                    {
                        type: 3,
                        name: "twitch-name-host",
                        description: "Add a Twitch username to this group",
                        required: true,
                        autocomplete: true,
                    },
                    {
                        type: 3,
                        name: "twitch-name-2",
                        description: "Add a Twitch username to this group",
                        required: false,
                        autocomplete: true,
                    },
                    {
                        type: 3,
                        name: "twitch-name-3",
                        description: "Add a Twitch username to this group",
                        required: false,
                        autocomplete: true,
                    },
                    {
                        type: 3,
                        name: "twitch-name-4",
                        description: "Add a Twitch username to this group",
                        required: false,
                        autocomplete: true,
                    },
                    {
                        type: 3,
                        name: "twitch-name-5",
                        description: "Add a Twitch username to this group",
                        required: false,
                        autocomplete: true,
                    },
                    {
                        type: 3,
                        name: "twitch-name-6",
                        description: "Add a Twitch username to this group",
                        required: false,
                        autocomplete: true,
                    },
                    {
                        type: 3,
                        name: "twitch-name-7",
                        description: "Add a Twitch username to this group",
                        required: false,
                        autocomplete: true,
                    },
                    {
                        type: 3,
                        name: "twitch-name-8",
                        description: "Add a Twitch username to this group",
                        required: false,
                        autocomplete: true,
                    },
                    {
                        type: 3,
                        name: "twitch-name-9",
                        description: "Add a Twitch username to this group",
                        required: false,
                        autocomplete: true,
                    },
                    {
                        type: 3,
                        name: "twitch-name-10",
                        description: "Add a Twitch username to this group",
                        required: false,
                        autocomplete: true,
                    },
                    {
                        type: 3,
                        name: "twitch-name-11",
                        description: "Add a Twitch username to this group",
                        required: false,
                        autocomplete: true,
                    },
                    {
                        type: 3,
                        name: "twitch-name-12",
                        description: "Add a Twitch username to this group",
                        required: false,
                        autocomplete: true,
                    },
                    {
                        type: 3,
                        name: "twitch-name-13",
                        description: "Add a Twitch username to this group",
                        required: false,
                        autocomplete: true,
                    },
                    {
                        type: 3,
                        name: "twitch-name-14",
                        description: "Add a Twitch username to this group",
                        required: false,
                        autocomplete: true,
                    },
                    {
                        type: 3,
                        name: "twitch-name-15",
                        description: "Add a Twitch username to this group",
                        required: false,
                        autocomplete: true,
                    },
                    {
                        type: 3,
                        name: "twitch-name-16",
                        description: "Add a Twitch username to this group",
                        required: false,
                        autocomplete: true,
                    },
                    {
                        type: 3,
                        name: "twitch-name-17",
                        description: "Add a Twitch username to this group",
                        required: false,
                        autocomplete: true,
                    },
                    {
                        type: 3,
                        name: "twitch-name-18",
                        description: "Add a Twitch username to this group",
                        required: false,
                        autocomplete: true,
                    },
                    {
                        type: 3,
                        name: "twitch-name-19",
                        description: "Add a Twitch username to this group",
                        required: false,
                        autocomplete: true,
                    },
                    {
                        type: 3,
                        name: "twitch-name-20",
                        description: "Add a Twitch username to this group",
                        required: false,
                        autocomplete: true,
                    },
                ],
            },
        ]
    },
    async execute(interaction) {
        let subcommand = interaction.options.getSubcommand();

        if (subcommand === "create") {
            api.Discord.getUserById(interaction.member.id).then(async user => {
                if (user.identity?.id) {
                    let game = interaction.options.getString("game");
                    
                    let host = null;
                    let users = [];
                    
                    let twitchUser = interaction.options.getString("twitch-name-host");
                    if (twitchUser) {
                        try {
                            host = (await api.Twitch.getUserByName(twitchUser, true))[0];
                        } catch (err) {
                            interaction.error(`Failed to parse user \`host\`: \`${twitchUser}\``);
                            return;
                        }
                    }

                    for (let i = 2; i < 20; i++) {
                        twitchUser = interaction.options.getString("twitch-name-" + i);
                        if (twitchUser) {
                            try {
                                users = [
                                    ...users,
                                    (await api.Twitch.getUserByName(twitchUser, true))[0],
                                ];
                            } catch (err) {
                                interaction.error(`Failed to parse user \`#${i}\`: \`${twitchUser}\``);
                                return;
                            }
                        }
                    }

                    if (game.length < 3 || game.length > 64) {
                        interaction.error("Game length must be between `3-64` characters.");
                        return;
                    }

                    if (!host) {
                        interaction.error("Host not found");
                        return;
                    }

                    if (users.length === 0) {
                        interaction.error("No users found");
                        return;
                    }

                    let hostIdentity = null;
                    if (host.identity?.id) {
                        hostIdentity = await api.getFullIdentity(host.identity.id);
                    }
                    
                    const embed = new MessageEmbed()
                        .setTitle(game + " hosted by " + host.display_name)
                        .setAuthor({iconURL: host.profile_image_url, name: host.display_name})
                        .setColor(0x772ce8)
                        .addFields([
                            {name: "Host", value: "[" + host.display_name + "](https://twitch.tv/" + host.display_name.toLowerCase() + ")" + (hostIdentity === null || hostIdentity.discordAccounts.length === 0 ? "" : " [<@" + hostIdentity.discordAccounts[0].id + ">]"), inline: true},
                            {name: "Posted By", value: interaction.member.toString(), inline: true},
                        ]);

                    let participantList = "";

                    for (let i = 0; i < users.length; i++) {
                        let user = users[i];

                        if (participantList !== "") participantList += "\n";

                        participantList += "**" + (i + 1) + "** - [" + user.display_name + "](https://twitch.tv/" + user.display_name.toLowerCase() + ")";

                        if (user.identity?.id) {
                            let identity = await api.getFullIdentity(user.identity.id);
                            if (identity.discordAccounts.length > 0) {
                                participantList += " [<@" + identity.discordAccounts[0].id + ">]";
                            }
                        }
                    }

                    const editButton = new MessageButton()
                        .setCustomId("edit-group")
                        .setLabel("Edit")
                        .setStyle("SECONDARY");

                    const startButton = new MessageButton()
                        .setCustomId("start-group")
                        .setLabel("Start Event")
                        .setStyle("SUCCESS");

                    const setGroupCommand = new MessageButton()
                        .setCustomId("set-command")
                        .setLabel("Set Group Command")
                        .setStyle("PRIMARY");

                    const row = new MessageActionRow()
                        .addComponents(editButton, startButton, setGroupCommand);

                    embed.addFields([{name: "Participants", value: participantList, inline: false}]);
                        
                    interaction.reply({content: ' ', embeds: [embed], components: [row], fetchReply: true}).then(message => {
                        const postWithId = id => {
                            con.query("select * from `group` where id = ?;", [id], (err, res) => {
                                if (err) {
                                    api.Logger.severe(err);
                                } else {
                                    if (res.length === 0) {
                                        embed.setURL(config.pub_domain + "g/" + id);
                                        embed.setFooter({text: "ID: " + id, iconURL: "https://tms.to/assets/images/logos/logo.webp"});
                                        message.edit({content: ' ', embeds: [embed], components: [row]}).then(() => {}, api.Logger.warning);
                                        con.query("insert into `group` (id, message, created_by, game) values (?, ?, ?, ?);", [id, message.id, user.identity.id, game], err => {
                                            if (err) {
                                                api.Logger.severe(err);
                                            } else {
                                                con.query("insert into group__user (group_id, user_id, host) values (?, ?, true);", [id, host.id], err => {
                                                    if (err) api.Logger.warning(err);
                                                });
                                                users.forEach(user => {
                                                    con.query("insert into group__user (group_id, user_id, host) values (?, ?, false);", [id, user.id], err => {
                                                        if (err) api.Logger.warning(err);
                                                    });
                                                });
                                                api.getGroupById(id).then(group => {
                                                    group.getThread().catch(api.Logger.warning);
                                                }, api.Logger.severe)
                                            }
                                        });
                                    } else {
                                        postWithId(api.stringGenerator(8).toLowerCase());
                                    }
                                }
                            });
                        }
    
                        postWithId(api.stringGenerator(8).toLowerCase());
                    }, api.Logger.severe);
                } else {
                    interaction.error("Your account isn't properly linked to TMS. Contact <@267380687345025025>");
                }
            }, error => {
                interaction.error(error);
            });
        }
    }
};

module.exports = command;