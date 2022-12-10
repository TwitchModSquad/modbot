const {Modal, TextInputComponent, showModal} = require("discord-modals");
const Discord = require("discord.js");
const con = require("../../database");
const api = require("../../api/index");

const DEFAULT_GROUP_COMMAND = "!editcom !group {{streamer}} is playing {{game}} with {{group}}";

const getGroupCommand = streamer => {
    return new Promise((resolve, reject) => {
        con.query("select command from group__command where streamer_id = ?;", [streamer.id], (err, res) => {
            if (err) {
                api.Logger.severe(err);
                resolve(DEFAULT_GROUP_COMMAND);
            } else {
                if (res.length > 0) {
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
        const modal = new Modal()
            .setCustomId("group-cmd")
            .setTitle("Edit Command Layout")
            .addComponents(
                new TextInputComponent()
                    .setCustomId("layout")
                    .setLabel("Command Layout")
                    .setStyle("SHORT")
                    .setMinLength(3)
                    .setMaxLength(128)
                    .setRequired(true)
                    .setDefaultValue(await getGroupCommand(streamer)));

        showModal(modal, {
            client: global.client.discord,
            interaction: interaction,
        });
    } else if (method === "gengrp") {
        interaction.reply({content: group.generateGroupString(streamer), ephemeral: true})
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
    async listener (interaction) {
        const handleSuccess = message => {
            interaction.reply({content: ' ', embeds: [new Discord.MessageEmbed().setTitle(message).setColor(0x2dad3e)], ephemeral: true})
        }

        const handleError = (err, method = "reply") => {
            global.api.Logger.warning(err);
            interaction[method]({content: ' ', embeds: [new Discord.MessageEmbed().setTitle("Uh oh!").setDescription(err).setColor(0x9e392f)], ephemeral: true})
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
                                api.getGroupById(res[0].id).then(async group => {
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
                let modal = new Modal()
                    .setCustomId(interaction.component.customId)
                    .setTitle("Add a Participant")
                    .addComponents(
                        new TextInputComponent()
                            .setCustomId("participant")
                            .setLabel("Twitch Name")
                            .setStyle("SHORT")
                            .setMinLength(3)
                            .setMaxLength(25)
                            .setPlaceholder("Full Twitch Username")
                            .setRequired(true)
                    );

                showModal(modal, {
                    client: global.client.discord,
                    interaction: interaction,
                })
            } else if (interaction.component.customId.startsWith("group-setgame-")) {
                let modal = new Modal()
                    .setCustomId(interaction.component.customId)
                    .setTitle("Set Game")
                    .addComponents(
                        new TextInputComponent()
                            .setCustomId("game")
                            .setLabel("Game")
                            .setStyle("SHORT")
                            .setMinLength(3)
                            .setMaxLength(64)
                            .setPlaceholder("New Game Title")
                            .setRequired(true)
                    );

                showModal(modal, {
                    client: global.client.discord,
                    interaction: interaction,
                })
            } else if (interaction.component.customId === "start-group") {
                con.query("select id from `group` where message = ?;", [interaction.message.id], (err, res) => {
                    if (err) {
                        api.Logger.severe(err);
                        handleError("An error occurred!");
                        return;
                    }
                    if (res.length > 0) {
                        api.getGroupById(res[0].id).then(group => {
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
                        api.getGroupById(res[0].id).then(group => {
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
                        api.getGroupById(res[0].id).then(group => {
                            api.Discord.getUserById(interaction.user.id).then(user => {
                                if (user.identity?.id) {
                                    api.getFullIdentity(user.identity.id).then(identity => {
                                        identity.getActiveModeratorChannels().then(streamers => {
                                            const embed = new Discord.MessageEmbed()
                                                .setTitle("Generate Group Command")
                                                .setDescription("Utilize any of the following methods to generate a group command for your streamer.")
                                                .addFields([
                                                    {name: "General Group Command", value: group.generateGroupString(), inline: false},
                                                    {name: "TMS-Hosted Command", value: "In order to manage TMS-hosted commands to allow for immediate change to TMS groups, utilize the Discord slash commands `/command enable` and `/command disable`.", inline: false}]);
                
                                            const selectMethod = new Discord.MessageSelectMenu()
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
                
                                            const selectStreamer = new Discord.MessageSelectMenu()
                                                .setCustomId("cmd-selstreamer-" + group.id)
                                                .setPlaceholder("Select Streamer")
                                                .setMinValues(1)
                                                .setMaxValues(1);
    
                                            streamers.forEach(streamerIdentity => {
                                                selectStreamer.addOptions(
                                                    streamerIdentity.modForIdentity.twitchAccounts
                                                        .filter(x => group.participants.find(xy => xy.id === x.id))
                                                        .map(x => {return {
                                                            label: x.display_name,
                                                            value: String(x.id),
                                                        }})
                                                );
                                            });

                                            identity.twitchAccounts.forEach(account => {
                                                if (group.participants.find(x => x.id === account.id)) {
                                                    selectStreamer.addOptions([
                                                        {
                                                            label: account.display_name,
                                                            value: String(account.id),
                                                        },
                                                    ]);
                                                }
                                            });
                                            
                                            const row = new Discord.MessageActionRow()
                                                .addComponents(selectMethod);

                                            const row2 = new Discord.MessageActionRow()
                                                .addComponents(selectStreamer);
                
                                            interaction.reply({content: ' ', embeds: [embed], components: [row, row2], ephemeral: true});
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
            }
        }

        if (interaction.isSelectMenu()) {
            if (interaction.component.customId.startsWith("group-rempartic-")) {
                api.Discord.getUserById(interaction.user.id).then(async discordUser => {
                    if (discordUser.identity?.id) {
                        let identity = await api.getFullIdentity(discordUser.identity.id);
                        api.getGroupById(interaction.component.customId.replace("group-rempartic-", "")).then(async group => {
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
                api.getGroupById(interaction.component.customId.replace("cmd-selmethod-", "")).then(async group => {
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
                api.getGroupById(interaction.component.customId.replace("cmd-selstreamer-", "")).then(async group => {
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
            }
        }
    }
};

module.exports = listener;