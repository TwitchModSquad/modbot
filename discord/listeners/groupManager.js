const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonInteraction, StringSelectMenuInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonStyle } = require("discord.js");

const con = require("../../database");
const api = require("../../api/index");

const config = require("../../config.json");

const DEFAULT_GROUP_COMMAND = "!editcom !group {{streamer}} is playing {{game}} with {{group}}";

const getGroupCommand = streamer => {
    return new Promise((resolve, reject) => {
        con.query("select command from group__streamer where streamer_id = ?;", [streamer.id], (err, res) => {
            if (err) {
                api.Logger.severe(err);
                resolve(DEFAULT_GROUP_COMMAND);
            } else {
                if (res.length > 0 && res[0].command !== null) {
                    resolve(res[0].command);
                } else {
                    resolve(DEFAULT_GROUP_COMMAND);
                }
            }
        });
    });
}

const completeGroupList = async (group, interaction, handleError, cache) => {
    const method = cache[interaction.user.id].method;
    const streamer = cache[interaction.user.id].streamer;

    if (method === "gencmd" || method === "sendcmd") {
        const layout = new TextInputBuilder()
            .setCustomId("layout")
            .setLabel("Command Layout")
            .setStyle(TextInputStyle.Short)
            .setMinLength(3)
            .setMaxLength(128)
            .setRequired(true)
            .setValue(await getGroupCommand(streamer));

        const modal = new ModalBuilder()
            .setCustomId("group-cmd")
            .setTitle("Edit Command Layout")
            .addComponents(
                    new ActionRowBuilder().addComponents(layout)
                );

        interaction.showModal(modal);
    } else if (method === "gengrp") {
        interaction.reply({content: await group.generateGroupString(streamer), ephemeral: true})
        delete listener.cache[interaction.user.id];
    } else {
        handleError("Unknown method: " + method);
    }
}

const listener = {
    name: 'groupManager',
    eventName: 'interactionCreate',
    eventType: 'on',
    cache: {},
    copyCache: {},
    updateCopyMessage: cache => {
        const embed = new EmbedBuilder()
            .setTitle("Copy Event")
            .setDescription("**Copying event** - " + cache.oldGroup.game + " hosted by " + cache.oldGroup.host.display_name + " *[old data]*")
            .addFields([
                {
                    name: "Game",
                    value: cache.game,
                    inline: true,
                },
                {
                    name: "Host",
                    value: `[${cache.host.display_name}](https://twitch.tv/${cache.host.login})`,
                    inline: true,
                },
                {
                    name: "Edit Participants",
                    value: "Utilize the select menu below to remove any participants that aren't in this group.\nUse the 'Add Participants' button to add participants."
                }
            ]);

        const addParticipantsButton = new ButtonBuilder()
            .setCustomId("copy-participant-add")
            .setLabel("Add Participant")
            .setStyle(ButtonStyle.Primary);

        const createButton = new ButtonBuilder()
            .setCustomId("copy-create")
            .setLabel("Create Group")
            .setStyle(ButtonStyle.Success);

        const removeParticipantsSelect = new StringSelectMenuBuilder()
            .setCustomId("copy-participant-remove")
            .setPlaceholder("Remove Participants")
            .setMinValues(1)
            .setMaxValues(Math.max(1, cache.participants.length - 1));

        if (cache.participants.length === 1)
            removeParticipantsSelect.setDisabled(true);

        removeParticipantsSelect.addOptions(cache.participants.map(
            x => {
                return {
                    label: x.display_name,
                    value: String(x.id),
                };
            }
        ));

        let participantString = "";

        for (let i = 0; i < cache.participants.length; i++) {
            let participant = cache.participants[i];
            if (participantString !== "") participantString += "\n";

            participantString += `${i+1} - [${participant.display_name}](https://twitch.tv/${participant.login})`;
        }

        embed.addFields([
            {
                name: "Participants",
                value: participantString,
            }
        ])

        const row = new ActionRowBuilder()
            .addComponents(addParticipantsButton, createButton);

        const removeParticipantsRow = new ActionRowBuilder()
            .addComponents(removeParticipantsSelect);

        cache.modal.editReply({embeds: [embed], components: [row, removeParticipantsRow], ephemeral: true});
    },
    /**
     * Listener for the group manager
     * @param {ButtonInteraction|StringSelectMenuInteraction} interaction 
     */
    async listener (interaction) {
        const handleSuccess = message => {
            interaction.reply({embeds: [new EmbedBuilder().setTitle(message).setColor(0x2dad3e)], ephemeral: true})
        }

        const handleError = (err, method = "reply", content = ' ') => {
            global.api.Logger.warning(err);
            interaction[method]({content: content, embeds: [new EmbedBuilder().setTitle("Uh oh!").setDescription(err).setColor(0x9e392f)], ephemeral: true})
        }

        if (interaction.isButton()) {
            if (interaction.component.customId === "edit-group") {
                api.Discord.getUserById(interaction.user.id).then(async discordUser => {
                    if (discordUser.identity?.id) {
                        let identity = await api.getFullIdentity(discordUser.identity.id);
                        
                        con.query("select id from `group` where message = ?;", [interaction.message.id], (err, res) => {
                            if (err) {
                                api.Logger.severe(err);
                                handleError("An error occurred!");
                                return;
                            }
                            if (res.length > 0) {
                                api.Group.getGroupById(res[0].id).then(async group => {
                                    interaction.reply(await group.generateEditMessage(identity.id === group.created_by.id, identity));
                                }, err => {
                                    api.Logger.severe(err);
                                    handleError("An error occurred!");
                                })
                            } else {
                                handleError("Could not find a group with this message ID");
                            }
                        });
                    } else {
                        handleError("Unable to find linked Twitch user");
                    }
                }, err => {
                    api.Logger.warning(err);
                    handleError("Unable to find linked Twitch user");
                });
            } else if (interaction.component.customId.startsWith("group-addpartic-")) {
                const participant = new TextInputBuilder()
                    .setCustomId("participant")
                    .setLabel("Twitch Name")
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(3)
                    .setMaxLength(25)
                    .setPlaceholder("Full Twitch Username")
                    .setRequired(true);
                
                const modal = new ModalBuilder()
                    .setCustomId(interaction.component.customId)
                    .setTitle("Add a Participant")
                    .addComponents(
                        new ActionRowBuilder().addComponents(participant)
                    );

                interaction.showModal(modal);
            } else if (interaction.component.customId.startsWith("group-delete-")) {
                api.Group.getGroupById(interaction.component.customId.replace("group-delete-", "")).then(group => {
                    api.Discord.getUserById(interaction.user.id).then(user => {
                        if (user.identity?.id) {
                            api.getFullIdentity(user.identity.id).then(identity => {
                                if (group.created_by.id === identity.id) {
                                    group.delete().then(() => {
                                        handleSuccess("Successfully deleted group `" + group.id + "`!");
                                    }, handleError)
                                } else {
                                    handleError("You must be the creator of this group in order to execute this function.");
                                }
                            }, err => {
                                handleError("You are not properly linked to TMS!");
                            })
                        } else {
                            handleError("You are not properly linked to TMS!");
                        }
                    }, err => {
                        handleError("You are not properly linked to TMS!");
                    });
                }, handleError);
            } else if (interaction.component.customId.startsWith("group-setgame-")) {
                const game = new TextInputBuilder()
                    .setCustomId("game")
                    .setLabel("Game")
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(3)
                    .setMaxLength(64)
                    .setPlaceholder("New Game Title")
                    .setRequired(true);
                
                const modal = new ModalBuilder()
                    .setCustomId(interaction.component.customId)
                    .setTitle("Set Game")
                    .addComponents(
                        new ActionRowBuilder().addComponents(game)
                    );

                interaction.showModal(modal);
            } else if (interaction.component.customId === "start-group") {
                con.query("select id from `group` where message = ?;", [interaction.message.id], (err, res) => {
                    if (err) {
                        api.Logger.severe(err);
                        handleError("An error occurred!");
                        return;
                    }
                    if (res.length > 0) {
                        api.Group.getGroupById(res[0].id).then(group => {
                            api.Discord.getUserById(interaction.user.id).then(user => {
                                if (user.identity?.id) {
                                    api.getFullIdentity(user.identity.id).then(identity => {
                                        group.start(identity).then(() => {
                                            handleSuccess("This event has started!");
                                        }, handleError);
                                    }, err => {
                                        handleError("You are not properly linked to TMS!");
                                    });
                                } else {
                                    handleError("You are not properly linked to TMS!");
                                }
                            }, err => {
                                handleError("You are not properly linked to TMS!");
                            });
                        }, handleError)
                    } else {
                        handleError("Could not find a group with this message ID");
                    }
                });
            } else if (interaction.component.customId === "stop-group") {
                con.query("select id from `group` where message = ?;", [interaction.message.id], (err, res) => {
                    if (err) {
                        api.Logger.severe(err);
                        handleError("An error occurred!");
                        return;
                    }
                    if (res.length > 0) {
                        api.Group.getGroupById(res[0].id).then(group => {
                            api.Discord.getUserById(interaction.user.id).then(user => {
                                if (user.identity?.id) {
                                    api.getFullIdentity(user.identity.id).then(identity => {
                                        group.stop(identity).then(() => {
                                            handleSuccess("This event has been stopped!");
                                        }, handleError);
                                    }, err => {
                                        handleError("You are not properly linked to TMS!");
                                    });
                                } else {
                                    handleError("You are not properly linked to TMS!");
                                }
                            }, err => {
                                handleError("You are not properly linked to TMS!");
                            });
                        }, handleError)
                    } else {
                        handleError("Could not find a group with this message ID");
                    }
                });
            } else if (interaction.component.customId === "set-command") {
                con.query("select id from `group` where message = ?;", [interaction.message.id], (err, res) => {
                    if (err) {
                        api.Logger.severe(err);
                        handleError("An error occurred!");
                        return;
                    }
                    if (res.length > 0) {
                        api.Group.getGroupById(res[0].id).then(group => {
                            api.Discord.getUserById(interaction.user.id).then(user => {
                                if (user.identity?.id) {
                                    api.getFullIdentity(user.identity.id).then(identity => {
                                        identity.getActiveModeratorChannels().then(async streamers => {
                                            const embed = new EmbedBuilder()
                                                .setTitle("Generate Group Command")
                                                .setDescription("Utilize any of the following methods to generate a group command for your streamer.")
                                                .addFields([
                                                    {name: "General Group Command", value: await group.generateGroupString(), inline: false},
                                                    {name: "TMS-Hosted Command", value: "In order to manage TMS-hosted commands to allow for immediate change to TMS groups, utilize the Discord slash commands `/command enable` and `/command disable`.", inline: false}]);
                
                                            const selectMethod = new StringSelectMenuBuilder()
                                                .setCustomId("cmd-selmethod-" + group.id)
                                                .setMinValues(1)
                                                .setMaxValues(1)
                                                .setPlaceholder("Select Method")
                                                .setOptions([
                                                    {
                                                        label: "Generate Command",
                                                        value: "gencmd",
                                                        description: "Generates a command for you to copy and paste into the streamers chat",
                                                    },
                                                    {
                                                        label: "Send Command",
                                                        value: "sendcmd",
                                                        description: "Generates a command and sends it to the streamer's chat automatically",
                                                    },
                                                    {
                                                        label: "Generate Group",
                                                        value: "gengrp",
                                                        description: "Generates the group text only for a specific streamer",
                                                    },
                                                ]);
                
                                            const selectStreamer = new StringSelectMenuBuilder()
                                                .setCustomId("cmd-selstreamer-" + group.id)
                                                .setPlaceholder("Select Streamer")
                                                .setMinValues(1)
                                                .setMaxValues(1);
    
                                            streamers.forEach(streamerIdentity => {
                                                selectStreamer.addOptions(
                                                    streamerIdentity.modForIdentity.twitchAccounts
                                                        .filter(x => group.allParticipants().find(xy => xy.id === x.id))
                                                        .map(x => {return {
                                                            label: x.display_name,
                                                            value: String(x.id),
                                                        }})
                                                );
                                            });

                                            identity.twitchAccounts.forEach(account => {
                                                if (group.allParticipants().find(x => x.id === account.id)) {
                                                    selectStreamer.addOptions([
                                                        {
                                                            label: account.display_name,
                                                            value: String(account.id),
                                                        },
                                                    ]);
                                                }
                                            });

                                            if (selectStreamer.options.length === 0) {
                                                let str = await group.generateGroupString();
                                                handleError("You don't moderate any channels that are participating in this event!\nJust in case we're wrong, here's a raw group list for this event: ```\n" + str + "```", "reply", str);
                                                return;
                                            }
                                            
                                            const row = new ActionRowBuilder()
                                                .addComponents(selectMethod);

                                            const row2 = new ActionRowBuilder()
                                                .addComponents(selectStreamer);
                
                                            interaction.reply({embeds: [embed], components: [row, row2], ephemeral: true});
                                        }, handleError)
                                    }, err => {
                                        handleError("You are not properly linked to TMS!");
                                    });
                                } else {
                                    handleError("You are not properly linked to TMS!");
                                }
                            }, err => {
                                handleError("You are not properly linked to TMS!");
                            });
                        }, handleError)
                    } else {
                        handleError("Could not find a group with this message ID");
                    }
                });
            } else if (interaction.component.customId === "recover-group") {
                con.query("select id from `group` where message = ?;", [interaction.message.id], (err, res) => {
                    if (err) {
                        api.Logger.severe(err);
                        handleError("An error occurred!");
                        return;
                    }
                    if (res.length > 0) {
                        api.Group.getGroupById(res[0].id).then(group => {
                            api.Discord.getUserById(interaction.user.id).then(user => {
                                if (user.identity?.id) {
                                    if (group.created_by.id === user.identity.id) {
                                        const embed = new EmbedBuilder()
                                            .setTitle("Confirm Recover")
                                            .setDescription("Recovering a group removes the end time and start time, allowing the group to be restarted.\nThis is not recommended unless the group was started by accident.\nIf you're trying to recreate the same or similar group, please copy this group instead.")
                                            .setColor(0x772ce8);

                                        const recoverConfirm = new ButtonBuilder()
                                            .setCustomId("recover-group-" + group.id)
                                            .setLabel("Confirm Recover")
                                            .setStyle(ButtonStyle.Primary);

                                        const row = new ActionRowBuilder()
                                            .addComponents(recoverConfirm);

                                        interaction.reply({embeds: [embed], components: [row], ephemeral: true});
                                    } else {
                                        handleError("You must be the creator of this group in order to execute this function.");
                                    }
                                } else {
                                    handleError("You are not properly linked to TMS!");
                                }
                            }, err => {
                                handleError("You are not properly linked to TMS!");
                            });
                        }, handleError)
                    } else {
                        handleError("Could not find a group with this message ID");
                    }
                });
            } else if (interaction.component.customId.startsWith("recover-group-")) {
                api.Group.getGroupById(interaction.component.customId.replace("recover-group-", "")).then(group => {
                    api.Discord.getUserById(interaction.user.id).then(user => {
                        if (user.identity?.id) {
                            api.getFullIdentity(user.identity.id).then(identity => {
                                if (group.created_by.id === identity.id) {
                                    con.query("update `group` set active = false, starttime = null, endtime = null where id = ?;", [group.id], err => {
                                        if (err) {
                                            handleError("An error occurred: " + err);
                                            api.Logger.warning(err);
                                        } else {
                                            group.active = false;
                                            group.starttime = null;
                                            group.endtime = null;
                                            group.updateMessage().then(() => {
                                                group.sendUpdate(
                                                    group.getUpdate()
                                                        .setColor(0x772ce8)
                                                        .setDescription("Group was recovered")
                                                , identity);
                                                handleSuccess("Group was recovered!");
                                            }, handleError);
                                        }
                                    });
                                } else {
                                    handleError("You must be the creator of this group in order to execute this function.");
                                }
                            }, err => {
                                handleError("You are not properly linked to TMS!");
                            })
                        } else {
                            handleError("You are not properly linked to TMS!");
                        }
                    }, err => {
                        handleError("You are not properly linked to TMS!");
                    });
                }, handleError);
            } else if (interaction.component.customId === "copy-group") {
                con.query("select id from `group` where message = ?;", [interaction.message.id], (err, res) => {
                    if (err) {
                        api.Logger.severe(err);
                        handleError("An error occurred!");
                        return;
                    }
                    if (res.length > 0) {
                        api.Group.getGroupById(res[0].id).then(group => {
                            api.Discord.getUserById(interaction.user.id).then(user => {
                                if (user.identity?.id) {
                                    const game = new TextInputBuilder()
                                        .setCustomId("game")
                                        .setLabel("Game")
                                        .setStyle(TextInputStyle.Short)
                                        .setMinLength(3)
                                        .setMaxLength(64)
                                        .setPlaceholder("Group game name")
                                        .setRequired(true)
                                        .setValue(group.game);


                                    const host = new TextInputBuilder()
                                        .setCustomId("host")
                                        .setLabel("Host")
                                        .setStyle(TextInputStyle.Short)
                                        .setMinLength(3)
                                        .setMaxLength(25)
                                        .setPlaceholder("Group host (Twitch name)")
                                        .setRequired(true)
                                        .setValue(group.host.display_name);

                                    const modal = new ModalBuilder()
                                        .setCustomId("group-copy-" + group.id)
                                        .setTitle("Copy group " + group.id)
                                        .addComponents(
                                                new ActionRowBuilder().addComponents(game),
                                                new ActionRowBuilder().addComponents(host)
                                            );

                                    interaction.showModal(modal);
                                } else {
                                    handleError("You are not properly linked to TMS!");
                                }
                            }, err => {
                                handleError("You are not properly linked to TMS!");
                            });
                        }, handleError)
                    } else {
                        handleError("Could not find a group with this message ID");
                    }
                });
            } else if (interaction.component.customId === "copy-participant-add") {
                const participant = new TextInputBuilder()
                    .setCustomId("participant")
                    .setLabel("Participant")
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(3)
                    .setMaxLength(25)
                    .setPlaceholder("New Twitch User")
                    .setRequired(true);

                const modal = new ModalBuilder()
                    .setCustomId("copy-participant-add")
                    .setTitle("Add participant to copied group")
                    .addComponents(
                            new ActionRowBuilder().addComponents(participant)
                        );

                interaction.showModal(modal);
            } else if (interaction.component.customId === "copy-create") {
                if (listener.copyCache.hasOwnProperty(interaction.user.id)) {
                    let cache = listener.copyCache[interaction.user.id];
                    api.Discord.getUserById(interaction.user.id).then(user => {
                        if (user.identity?.id) {
                            api.getFullIdentity(user.identity.id).then(async identity => {
                                let hostIdentity = null;
                                if (cache.host.identity?.id) {
                                    hostIdentity = await api.getFullIdentity(cache.host.identity.id);
                                }

                                const embed = new EmbedBuilder()
                                    .setTitle(cache.game + " hosted by " + cache.host.display_name)
                                    .setAuthor({iconURL: cache.host.profile_image_url, name: cache.host.display_name})
                                    .setColor(0x772ce8)
                                    .addFields([
                                        {name: "Host", value: "[" + cache.host.display_name + "](https://twitch.tv/" + cache.host.login + ")" + (hostIdentity === null || hostIdentity.discordAccounts.length === 0 ? "" : " [<@" + hostIdentity.discordAccounts[0].id + ">]"), inline: true},
                                        {name: "Posted By", value: interaction.member.toString(), inline: true},
                                    ]);

                                let participantList = "";

                                for (let i = 0; i < cache.participants.length; i++) {
                                    let user = cache.participants[i];

                                    if (participantList !== "") participantList += "\n";

                                    participantList += "**" + (i + 1) + "** - [" + user.display_name + "](https://twitch.tv/" + user.login + ")";

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

                                delete listener.copyCache[interaction.user.id];
                                    
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
                                                    con.query("insert into `group` (id, message, created_by, game) values (?, ?, ?, ?);", [id, message.id, identity.id, cache.game], err => {
                                                        if (err) {
                                                            api.Logger.severe(err);
                                                        } else {
                                                            con.query("insert into group__user (group_id, user_id, host) values (?, ?, true);", [id, cache.host.id], err => {
                                                                if (err) api.Logger.warning(err);
                                                            });
                                                            cache.participants.forEach(user => {
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
                            }, err => {
                                handleError("You are not properly linked to TMS!");
                            });
                        } else {
                            handleError("You are not properly linked to TMS!");
                        }
                    }, err => {
                        handleError("You are not properly linked to TMS!");
                    });
                } else {
                    handleError("Lost copy cache. Please try again!");
                }
            }
        }

        if (interaction.isStringSelectMenu()) {
            if (interaction.component.customId.startsWith("group-rempartic-")) {
                api.Discord.getUserById(interaction.user.id).then(async discordUser => {
                    if (discordUser.identity?.id) {
                        let identity = await api.getFullIdentity(discordUser.identity.id);
                        api.Group.getGroupById(interaction.component.customId.replace("group-rempartic-", "")).then(async group => {
                            try {
                                let users = [];
        
                                for (let i = 0; i < interaction.values.length; i++) {
                                    let value = interaction.values[i];
                                    users = [
                                        ...users,
                                        await api.Twitch.getUserById(value),
                                    ]
                                }
        
                                let participants = "";
        
                                users.forEach(user => {
                                    if (participants !== "") participants += ", ";
                                    participants += user.display_name;
                                });
        
                                group.removeParticipants(users, identity).then(() => {
                                    handleSuccess("Successfully removed participants: " + participants);
                                }, err => {
                                    api.Logger.warning(err);
                                    handleError("An error occurred! " + err);
                                });
                            } catch (err) {
                                api.Logger.warning(err);
                                handleError("An error occurred! " + err);
                            }
                        }, err => {
                            api.Logger.severe(err);
                            handleError("An error occurred!");
                        });
                    } else {
                        handleError("Unable to find linked Twitch user");
                    }
                }, err => {
                    api.Logger.warning(err);
                    handleError("Unable to find linked Twitch user");
                });
            } else if (interaction.component.customId.startsWith("cmd-selmethod-")) {
                api.Group.getGroupById(interaction.component.customId.replace("cmd-selmethod-", "")).then(async group => {
                    if (!listener.cache.hasOwnProperty(interaction.user.id)) listener.cache[interaction.user.id] = {};
                    listener.cache[interaction.user.id].group = group;
                    listener.cache[interaction.user.id].method = interaction.values[0];
                    if (listener.cache[interaction.user.id].hasOwnProperty("streamer")) {
                        completeGroupList(group, interaction, handleError, listener.cache);
                    } else {
                        interaction.reply("Success").then(message => {
                            interaction.deleteReply().then(() => {}, api.Logger.severe);
                        }, api.Logger.severe);
                    }
                }, err => {
                    api.Logger.severe(err);
                    handleError("An error occurred!");
                });
            } else if (interaction.component.customId.startsWith("cmd-selstreamer-")) {
                api.Group.getGroupById(interaction.component.customId.replace("cmd-selstreamer-", "")).then(async group => {
                    api.Twitch.getUserById(interaction.values[0]).then(streamer => {
                        if (!listener.cache.hasOwnProperty(interaction.user.id)) listener.cache[interaction.user.id] = {};
                        listener.cache[interaction.user.id].group = group;
                        listener.cache[interaction.user.id].streamer = streamer;
                        if (listener.cache[interaction.user.id].hasOwnProperty("method")) {
                            completeGroupList(group, interaction, handleError, listener.cache);
                        } else {
                            interaction.reply("Success").then(message => {
                                interaction.deleteReply().then(() => {}, api.Logger.severe);
                            }, api.Logger.severe);
                        }
                    }, err => {
                        api.Logger.warning(err);
                        handleError("Failed to get streamer!");
                    })
                }, err => {
                    api.Logger.severe(err);
                    handleError("An error occurred!");
                });
            } else if (interaction.component.customId.startsWith("cmd-selstreamer-")) {
                api.Group.getGroupById(interaction.component.customId.replace("cmd-selstreamer-", "")).then(async group => {
                    api.Twitch.getUserById(interaction.values[0]).then(streamer => {
                        if (!listener.cache.hasOwnProperty(interaction.user.id)) listener.cache[interaction.user.id] = {};
                        listener.cache[interaction.user.id].group = group;
                        listener.cache[interaction.user.id].streamer = streamer;
                        if (listener.cache[interaction.user.id].hasOwnProperty("method")) {
                            completeGroupList(group, interaction, handleError, listener.cache);
                        } else {
                            interaction.reply("Success").then(message => {
                                interaction.deleteReply().then(() => {}, api.Logger.severe);
                            }, api.Logger.severe);
                        }
                    }, err => {
                        api.Logger.warning(err);
                        handleError("Failed to get streamer!");
                    })
                }, err => {
                    api.Logger.severe(err);
                    handleError("An error occurred!");
                });
            } else if (interaction.component.customId === "copy-participant-remove") {
                if (listener.copyCache.hasOwnProperty(interaction.user.id)) {
                    listener.copyCache[interaction.user.id].participants = listener.copyCache[interaction.user.id].participants
                        .filter(x => !interaction.values.includes(""+x.id));

                    listener.updateCopyMessage(listener.copyCache[interaction.user.id]);

                    interaction.reply("Success!").then(message => {
                        interaction.deleteReply().catch(api.Logger.warning);
                    }, api.Logger.severe)
                } else {
                    handleError("Lost copy cache. Please try again!");
                }
            }
        }
    }
};

module.exports = listener;