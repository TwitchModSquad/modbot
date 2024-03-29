const {EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandStringOption, SlashCommandUserOption, ModalBuilder, TextInputBuilder, TextInputStyle} = require("discord.js");
const api = require("../../api/index");
const con = require("../../database");

const config = require("../../config.json");

let moveChoices = config.channels.archive_sort_targets.map(x => {
    return {
        name: x.label,
        value: x.value,
    };
});

const vd = () => {};

const command = {
    cache: {},
    temporaryMessage (obj, method, message, timeout = 5000, description = null) {
        const embed = new EmbedBuilder()
            .setTitle(message)
            .setFooter({text: `Information message. This message will expire in ${(timeout/1000)} second${timeout === 1000 ? "" : "s"}.`, iconURL: "https://tms.to/assets/images/logos/logo.webp"});

        if (description !== null) embed.setDescription(description);

        obj[method]({embeds: [embed]}).then(messObj => {
            setTimeout(() => {
                try {
                    if (method === "reply") {
                        obj.deleteReply().then(vd, vd);
                    } else {
                        messObj.delete().then(vd, vd);
                    }
                } catch (e) {}
            }, timeout);
        }, global.api.Logger.warning);
    },
    data: new SlashCommandBuilder()
        .setName("archive")
        .setDescription("Create or edit Archive submissions!")
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName("search")
                .setDescription("Search for a user in the Archive database")
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("query")
                        .setDescription("Search query. Twitch ID/Name or Discord ID/Name")
                        .setRequired(true)
                )
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName("create")
                .setDescription("Create a new Archive submission")
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("twitch-name-1")
                        .setDescription("Add a Twitch username to this archive submission")
                        .setRequired(false)
                        .setAutocomplete(true)
                )
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("twitch-name-2")
                        .setDescription("Add a Twitch username to this archive submission")
                        .setRequired(false)
                        .setAutocomplete(true)
                )
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("twitch-name-3")
                        .setDescription("Add a Twitch username to this archive submission")
                        .setRequired(false)
                        .setAutocomplete(true)
                )
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("twitch-name-4")
                        .setDescription("Add a Twitch username to this archive submission")
                        .setRequired(false)
                        .setAutocomplete(true)
                )
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("twitch-name-5")
                        .setDescription("Add a Twitch username to this archive submission")
                        .setRequired(false)
                        .setAutocomplete(true)
                )
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("discord-id-1")
                        .setDescription("Add a Discord ID to this archive submission")
                        .setRequired(false)
                )
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("discord-id-2")
                        .setDescription("Add a Discord ID to this archive submission")
                        .setRequired(false)
                )
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("discord-id-3")
                        .setDescription("Add a Discord ID to this archive submission")
                        .setRequired(false)
                )
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("discord-id-4")
                        .setDescription("Add a Discord ID to this archive submission")
                        .setRequired(false)
                )
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("discord-id-5")
                        .setDescription("Add a Discord ID to this archive submission")
                        .setRequired(false)
                )
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName("refresh")
                .setDescription("Refresh an Archive submission")
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("id")
                        .setDescription("ID of the archive entry. 8 character string")
                        .setRequired(true)
                )
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName("edit")
                .setDescription("Edit an Archive submission")
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("id")
                        .setDescription("ID of the archive entry. 8 character string")
                        .setRequired(true)
                )
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName("delete")
                .setDescription("Delete an Archive submission. Must be your submission")
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("id")
                        .setDescription("ID of the archive entry. 8 character string")
                        .setRequired(true)
                )
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName("setowner")
                .setDescription("Sets the owner of an Archive submission. Administrator only")
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("id")
                        .setDescription("ID of the archive entry. 8 character string")
                        .setRequired(true)
                )
                .addUserOption(
                    new SlashCommandUserOption()
                        .setName("owner")
                        .setDescription("The new owner for this Archive entry")
                        .setRequired(true)
                )
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName("move")
                .setDescription("Move an Archive submission. Administrator only")
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("id")
                        .setDescription("ID of the archive entry. 8 character string")
                        .setRequired(true)
                )
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("channel")
                        .setDescription("Channel to move the archive entry to")
                        .setRequired(true)
                        .setChoices(...moveChoices)
                )
        )
        .setDMPermission(false),
    /**
     * Execution function for this command
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        let subcommand = interaction.options.getSubcommand();

        if (subcommand === "create") {
            api.Discord.getUserById(interaction.member.id).then(user => {
                if (user.identity?.id) {
                    let twitch = [];
                    let discord = [];
                    let identity = [];

                    for (let i = 1; i < 6; i++) {
                        let twitchUser = interaction.options.getString("twitch-name-" + i);
                        if (twitchUser) twitch = [...twitch, twitchUser];

                        let discordUser = interaction.options.getString("discord-id-" + i);
                        if (discordUser) discord = [...discord, discordUser];

                        let identityId = interaction.options.getString("identity-id-" + i);
                        if (identityId) identity = [...identity, identityId];
                    }

                    command.cache[user.identity.id] = {
                        twitch: twitch,
                        discord: discord,
                        identity: identity,
                        channel: interaction.channel,
                    };

                    const offense = new TextInputBuilder()
                        .setCustomId("offense")
                        .setLabel("Offense")
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(3)
                        .setMaxLength(256)
                        .setPlaceholder("Write something like 'Harrassment' or 'Unsolicted Pictures' (Note: Don't put links here!)")
                        .setRequired(true);
                    
                    const description = new TextInputBuilder()
                        .setCustomId("description")
                        .setLabel("Description")
                        .setStyle(TextInputStyle.Paragraph)
                        .setMinLength(32)
                        .setMaxLength(2048)
                        .setPlaceholder("Go into more detail!")
                        .setRequired(true);

                    const modal = new ModalBuilder()
                        .setCustomId("archive-create")
                        .setTitle("Create an Archive Entry")
                        .addComponents(
                            new ActionRowBuilder().addComponents(offense),
                            new ActionRowBuilder().addComponents(description)
                        );

                    interaction.showModal(modal).catch(api.Logger.severe);
                } else {
                    interaction.error("Your account isn't properly linked to TMS. Contact <@267380687345025025>");
                }
            }, error => {
                interaction.error(error);
            });
        } else if (subcommand === "refresh") {
            api.Discord.getUserById(interaction.member.id).then(user => {
                api.Archive.getEntryById(interaction.options.getString("id", true)).then(entry => {
                    if (interaction.level === 2 || entry.owner.id === user.identity?.id) {
                        entry.refreshMessages();
                        interaction.success("Successfully updated all entry messages!");
                    } else {
                        interaction.error("**You don't have permission!**\nYou must be an administrator to use this command.");
                    }
                }, error => {
                    interaction.error(error);
                });
            }, error => {
                interaction.error(error);
            });
        } else if (subcommand === "edit") {
            api.Discord.getUserById(interaction.member.id).then(user => {
                api.Archive.getEntryById(interaction.options.getString("id", true)).then(entry => {
                    if (interaction.level === 2 || entry.owner.id === user.identity?.id) {
                        entry.openEdit(interaction.member).then(message => {
                            interaction.success("Edit menu is opened! [View it here](" + message.url + ")")
                        }, err => {
                            interaction.error("Error: " + err);
                        });
                    } else {
                        interaction.error("**You don't have permission!**\nYou must be an administrator to use this command.");
                    }
                }, error => {
                    interaction.error(error);
                });
            }, error => {
                interaction.error(error);
            });
        } else if (subcommand === "setowner") {
            if (interaction.level === 2) {
                let newOwner = interaction.options.getUser("owner", true);
                api.Discord.getUserById(interaction.member.id).then(curUser => {
                    api.Archive.getEntryById(interaction.options.getString("id", true)).then(entry => {
                        api.Discord.getUserById(newOwner.id).then(user => {
                            if (user.identity?.id) {
                                entry.setOwner(user.identity, curUser.identity);
                                interaction.success(`New owner has been set!\nNew owner: \`#${user.identity.id} ${user.identity.name}\` <@${user.id}>`);
                            } else {
                                interaction.error("Target user is not properly authenticated to TMS.");
                            }
                        }, error => {
                            interaction.error("Target user is not properly linked to TMS.");
                        })
                    }, error => {
                        interaction.error("Error: " + error);
                    });
                }, error => {
                    interaction.error("You are not properly linked to TMS.");
                });
            } else {
                interaction.error("**You don't have permission!**\nYou must be an administrator to use this command.");
            }
        } else if (subcommand === "move") {
            if (interaction.level === 2) {
                api.Discord.getUserById(interaction.member.id).then(user => {
                    if (user.identity?.id) {
                        api.Archive.getEntryById(interaction.options.getString("id", true)).then(entry => {
                            api.getFullIdentity(user.identity.id).then(identity => {
                                global.client.discord.channels.fetch(interaction.options.getString("channel", true)).then(channel => {
                                    entry.move(channel, identity);
                                    interaction.success("Entry was successfully moved!");
                                }, error => {
                                    interaction.error("Unable to get target channel");
                                });
                            }, error => {
                                interaction.error(error);
                            })
                        }, error => {
                            interaction.error(error);
                        });
                    } else {
                        interaction.error("You're not properly linked to TMS. That's a you problem");
                    }
                }, error => {
                    interaction.error(error);
                });
            } else {
                interaction.error("**You don't have permission!**\nYou must be an administrator to use this command.");
            }
        } else if (subcommand === "delete") {
            api.Discord.getUserById(interaction.member.id).then(user => {
                api.Archive.getEntryById(interaction.options.getString("id", true)).then(entry => {
                    if (interaction.level === 2 || entry.owner.id === user.identity?.id) {
                        entry.delete(user.identity);
                        interaction.success("Archive entry was successfully deleted!");
                    } else {
                        interaction.error("**You don't have permission!**\nYou must be an administrator to use this command.");
                    }
                }, error => {
                    interaction.error(error);
                });
            }, error => {
                interaction.error(error);
            });
        } else if (subcommand === "search") {
            await interaction.deferReply({ephemeral: interaction.channel.id !== config.channels.archive_name_checker});

            let query = interaction.options.getString("query", true);

            let entries = [];
            let bans = [];

            const directTwitchQuery = await con.pquery("select id from twitch__user where id = ? or display_name = ?;", [query, query]);
            let fuzzyTwitchQuery = [];

            const directDiscordQuery = await con.pquery("select id from discord__user where id = ? or name = ?;", [query, query]);
            let fuzzyDiscordQuery = [];

            const directRawQuery = await con.pquery("select value from archive__users where value = ?;", query);
            let fuzzyRawQuery = [];
            
            if (query.length > 3) {
                fuzzyTwitchQuery = await con.pquery("select id from twitch__user where soundex(display_name) = soundex(?) or display_name like ? limit 20;", [query, query + "%"]);
                fuzzyDiscordQuery = await con.pquery("select id from discord__user where soundex(name) = soundex(?) or name like ? limit 20;", [query, query + "%"]);
                fuzzyRawQuery = await con.pquery("select value from archive__users where value = ?;", query);
            }

            let twitchQueries = directTwitchQuery.map(x => x.id);
            let discordQueries = directDiscordQuery.map(x => x.id);
            let rawQueries = [];

            fuzzyTwitchQuery.forEach(q => {
                if (!twitchQueries.includes(q.id)) {
                    twitchQueries = [
                        ...twitchQueries,
                        q.id
                    ]
                }
            });

            fuzzyDiscordQuery.forEach(q => {
                if (!discordQueries.includes(q.id)) {
                    discordQueries = [
                        ...discordQueries,
                        q.id
                    ]
                }
            });


            const iterateRaw = q => {
                if (!rawQueries.includes(q.value)) {
                    rawQueries = [
                        ...rawQueries,
                        q.value
                    ]
                }
            }

            directRawQuery.forEach(iterateRaw);
            fuzzyRawQuery.forEach(iterateRaw);

            let twitchUsers = [];
            for (let ti = 0; ti < twitchQueries.length; ti++) {
                const id = twitchQueries[ti];
                try {
                    const user = await api.Twitch.getUserById(id);
                    twitchUsers = [...twitchUsers, user];
                    const twitchEntries = await con.pquery("select archive_id from archive__users where type = 'twitch' and user and value = ?;", [id]);

                    bans = [
                        ...bans,
                        ...(await user.getBans()),
                    ];

                    for (let ei = 0; ei < twitchEntries.length; ei++) {
                        const archiveId = twitchEntries[ei].archive_id;
                        if (!entries.find(e => e.id === archiveId)) {
                            entries = [
                                ...entries,
                                await api.Archive.getEntryById(archiveId),
                            ];
                        }
                    }
                } catch (e) {
                    global.api.Logger.warning(e);
                }
            }

            let discordUsers = [];
            for (let di = 0; di < discordQueries.length; di++) {
                const id = discordQueries[di];
                try {
                    const user = await api.Discord.getUserById(id);
                    discordUsers = [...discordUsers, user];
                    const discordEntries = await con.pquery("select archive_id from archive__users where type = 'discord' and user and value = ?;", [id]);

                    for (let ei = 0; ei < discordEntries.length; ei++) {
                        const archiveId = discordEntries[ei].archive_id;
                        if (!entries.find(e => e.id === archiveId)) {
                            entries = [
                                ...entries,
                                await api.Archive.getEntryById(archiveId),
                            ];
                        }
                    }
                } catch (e) {
                    global.api.Logger.warning(e);
                }
            }

            for (let ri = 0; ri < rawQueries.length; ri++) {
                const id = rawQueries[ri];
                try {
                    const rawEntries = await con.pquery("select archive_id from archive__users where value = ?;", [id]);

                    for (let ei = 0; ei < rawEntries.length; ei++) {
                        const archiveId = rawEntries[ei].archive_id;
                        if (!entries.find(e => e.id === archiveId)) {
                            entries = [
                                ...entries,
                                await api.Archive.getEntryById(archiveId),
                            ];
                        }
                    }
                } catch (e) {}
            }

            const embed = new EmbedBuilder()
                .setTitle("Archive Search Results")
                .setColor(0x36b55c);

            let embeds = [embed];

            if (entries.length > 0) {
                let entryResults = "";
                for (let e = 0; e < entries.length; e++) {
                    const entry = entries[e];
                    let message;
                    try {
                        message = await entry.getPublicRecordMessage();
                    } catch (e) {}

                    if (message) {
                        entryResults += `\n[${entry.offense}](${message.url})`;
                    } else {
                        entryResults += `\n${entry.offense} (No public record found)`;
                    }
                }

                embeds = [
                    ...embeds,
                    new EmbedBuilder()
                        .setTitle("Archive Entries")
                        .setDescription(entryResults)
                        .setColor(0xff4d4d),
                ];
            }

            if (bans.length > 0) {
                let banStr = "";

                const addField = () => {
                    embed.addFields({
                        name: "Bans",
                        value: banStr,
                        inline: true,
                    });
                    banStr = "";
                }

                for (let b = 0; b < bans.length; b++) {
                    const ban = bans[b];

                    if (banStr !== "") banStr += "\n";

                    if (ban.discord_message) {
                        banStr += `[#${b+1} ${ban.user.display_name} banned in #${ban.channel.login} on ${new Date(ban.time).toLocaleDateString()}${ban.active ? "" : " \[inactive\]"}](https://discord.com/channels/${config.modsquad_discord}/${config.liveban_channel}/${ban.discord_message})`;
                    } else {
                        banStr += `#${b+1} ${ban.user.display_name} banned in #${ban.channel.login} on ${new Date(ban.time).toLocaleDateString()}`;
                    }

                    if (banStr.length > 800) {
                        addField();
                    }
                }

                addField();
            }

            if (twitchUsers.length === 0 && discordUsers.length === 0 && entries.length === 0) {
                embed.setDescription("**Nothing was found on this user!**\nThis means we don't have any record of this user in participating Twitch channels, and there's no ban archive involving them.")
            } else {
                embed.setDescription(`We found \`${twitchUsers.length}\` twitch and \`${discordUsers.length}\` discord users with similar names to \`${query}\`.\n**Archive Entries:** ${entries.length} • **Twitch Bans:** ${bans.length}`)
            }

            const twitchUserSelect = new StringSelectMenuBuilder()
                    .setCustomId("archive-search-twitch")
                    .setPlaceholder("View Twitch Information")
                    .setMinValues(1)
                    .setMaxValues(1);

            const discordUserSelect = new StringSelectMenuBuilder()
                    .setCustomId("archive-search-discord")
                    .setPlaceholder("View Discord Information")
                    .setMinValues(1)
                    .setMaxValues(1);

            twitchUsers.forEach(user => {
                twitchUserSelect.addOptions({value: ""+user.id, label: user.display_name});
            })
            
            discordUsers.forEach(user => {
                discordUserSelect.addOptions({value: ""+user.id, label: user.name});
            });

            let rows = [];

            const twitchUserRow = new ActionRowBuilder()
                .addComponents(twitchUserSelect);

            const discordUserRow = new ActionRowBuilder()
                .addComponents(discordUserSelect);

            if (twitchUsers.length > 0) rows = [...rows, twitchUserRow];
            if (discordUsers.length > 0) rows = [...rows, discordUserRow];

            interaction.editReply({embeds: embeds, components: rows});
        }
    }
};

module.exports = command;