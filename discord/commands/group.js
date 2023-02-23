const { ChatInputCommandInteraction, ActionRowBuilder, SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder, EmbedBuilder, ButtonStyle } = require("discord.js");
const api = require("../../api/index");
const con = require("../../database");

const config = require("../../config.json");

const createSubcommand = new SlashCommandSubcommandBuilder()
    .setName("create")
    .setDescription("Create a new group")
    .addStringOption(
        new SlashCommandStringOption()
            .setName("game")
            .setDescription("Hosted game for this group")
            .setRequired(true)
    )
    .addStringOption(
        new SlashCommandStringOption()
            .setName("twitch-name-host")
            .setDescription("Add a Twitch username to this group")
            .setRequired(true)
    );

for (let i = 2; i <= 20; i++) {
    createSubcommand.addStringOption(
        new SlashCommandStringOption()
            .setName("twitch-name-" + i)
            .setDescription("Add a Twitch username to this group")
    );
}

const cmdData = new SlashCommandBuilder()
    .setName("group")
    .setDescription("Create, modify and view TMS groups")
    .addSubcommand(createSubcommand)
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName("refresh")
            .setDescription("Refreshes group embeds")
            .addStringOption(
                new SlashCommandStringOption()
                    .setName("id")
                    .setDescription("Group ID")
                    .setRequired(true)
            )
    )
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName("setnickname")
            .setDescription("Sets a streamer's nickname for use in group commands")
            .addStringOption(
                new SlashCommandStringOption()
                    .setName("streamer")
                    .setDescription("Streamer's twitch name to set")
                    .setRequired(true)
                    .setAutocomplete(true)
            )
            .addStringOption(
                new SlashCommandStringOption()
                    .setName("nickname")
                    .setDescription("New nickname for this streamer. Omit this option to unset the nickname")
            )
    );

const command = {
    data: cmdData,
    /**
     * Execution function for this command
     * @param {ChatInputCommandInteraction} interaction 
     */
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
                    
                    const embed = new EmbedBuilder()
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

                    const editButton = new ButtonBuilder()
                        .setCustomId("edit-group")
                        .setLabel("Edit")
                        .setStyle(ButtonStyle.Secondary);

                    const startButton = new ButtonBuilder()
                        .setCustomId("start-group")
                        .setLabel("Start Event")
                        .setStyle(ButtonStyle.Success);

                    const setGroupCommand = new ButtonBuilder()
                        .setCustomId("set-command")
                        .setLabel("Set Group Command")
                        .setStyle(ButtonStyle.Primary);

                    const row = new ActionRowBuilder()
                        .addComponents(editButton, startButton, setGroupCommand);

                    embed.addFields([{name: "Participants", value: participantList, inline: false}]);
                        
                    interaction.reply({embeds: [embed], components: [row], fetchReply: true}).then(message => {
                        const postWithId = id => {
                            con.query("select * from `group` where id = ?;", [id], (err, res) => {
                                if (err) {
                                    api.Logger.severe(err);
                                } else {
                                    if (res.length === 0) {
                                        embed.setURL(config.pub_domain + "g/" + id);
                                        embed.setFooter({text: "ID: " + id, iconURL: "https://tms.to/assets/images/logos/logo.webp"});
                                        message.edit({embeds: [embed], components: [row]}).then(() => {}, api.Logger.warning);
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
                                                api.Group.getGroupById(id).then(group => {
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
        } else if (subcommand === "refresh") {
            let id = interaction.options.getString("id", true);

            api.Group.getGroupById(id).then(group => {
                group.updateMessage().then(() => {
                    interaction.success(`Group embed for \`${group.id}\` has been updated!`);
                }, err => {
                    interaction.error("An error occurred! " + err);
                })
            }, err => {
                interaction.error("An error occurred! " + err);
            })
        } else if (subcommand === "setnickname") {
            let streamer = interaction.options.getString("streamer", true);
            let nickname = interaction.options.getString("nickname");

            api.Twitch.getUserByName(streamer).then(users => {
                let streamer = users[0];

                if (nickname) {
                    con.query("insert into group__streamer (streamer_id, nickname) values (?, ?) on duplicate key update nickname = ?;", [streamer.id, nickname, nickname], err => {
                        if (err) {
                            interaction.error("An error occurred! " + err);
                        } else {
                            interaction.success(`Nickname for \`${streamer.display_name}\` set! Streamer will be displayed as:\`\`\`\n${streamer.display_name} (${nickname})\`\`\``)
                        }
                    });
                } else {
                    con.query("update group__streamer set nickname = null where streamer_id = ?;", [streamer.id], err => {
                        if (err) {
                            interaction.error("An error occurred! " + err);
                        } else {
                            interaction.success(`Nickname for \`${streamer.display_name}\` has been unset! Streamer will be displayed as:\`\`\`\n${streamer.display_name}\`\`\``)
                        }
                    });
                }
            }, err => {
                interaction.error("An error occurred! " + err);
            });
        }
    }
};

module.exports = command;