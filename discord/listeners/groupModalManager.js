const { MessageEmbed, MessageSelectMenu, MessageActionRow, MessageButton } = require("discord.js");
const api = require("../../api/index");
const con = require("../../database");

const {cache, copyCache, updateCopyMessage} = require("./groupManager");

const listener = {
    name: 'archiveEditModalManager',
    eventName: 'modalSubmit',
    eventType: 'on',
    async listener (modal) {
        const handleSuccess = message => {
            modal.reply({content: ' ', embeds: [new MessageEmbed().setTitle(message).setColor(0x2dad3e)], ephemeral: true})
        }

        const handleError = (err) => {
            global.api.Logger.warning(err);
            modal.reply({content: ' ', embeds: [new MessageEmbed().setTitle("Uh oh!").setDescription(err).setColor(0x9e392f)], ephemeral: true})
        }

        if (modal.customId.startsWith("group-addpartic-")) {
            let id = modal.customId.replace("group-addpartic-", "");
            let participant;

            try {
                participant = (await api.Twitch.getUserByName(modal.getTextInputValue("participant"), true))[0];
            } catch (err) {
                handleError(err);
                return;
            }

            api.Discord.getUserById(modal.user.id).then(async discordUser => {
                if (discordUser.identity?.id) {
                    let identity = await api.getFullIdentity(discordUser.identity.id);
                    
                    api.getGroupById(id).then(group => {
                        group.addParticipant(participant, identity).then(() => {
                            handleSuccess("Successfully added participant!");
                        }, handleError);
                    }, handleError);
                } else {
                    handleError("Unable to find linked Twitch user");
                }
            }, err => {
                api.Logger.warning(err);
                handleError("Unable to find linked Twitch user");
            });
        } else if (modal.customId.startsWith("group-setgame-")) {
            let id = modal.customId.replace("group-setgame-", "");
            let game = modal.getTextInputValue("game");

            api.Discord.getUserById(modal.user.id).then(async discordUser => {
                if (discordUser.identity?.id) {
                    let identity = await api.getFullIdentity(discordUser.identity.id);
                    
                    api.getGroupById(id).then(group => {
                        group.setGame(game, identity).then(() => {
                            handleSuccess("Successfully set game!");
                        }, handleError);
                    }, handleError);
                } else {
                    handleError("Unable to find linked Twitch user");
                }
            }, err => {
                api.Logger.warning(err);
                handleError("Unable to find linked Twitch user");
            });
        } else if (modal.customId === "group-cmd") {
            if (cache.hasOwnProperty(modal.user.id)) {
                const group = cache[modal.user.id].group;
                const method = cache[modal.user.id].method;
                const streamer = cache[modal.user.id].streamer;

                const layout = modal.getTextInputValue("layout");

                if (layout.indexOf("{{group}}") !== -1) {
                    const command = group.generateGroupCommand(streamer, layout);
                    con.query("insert into group__command (streamer_id, command) values (?, ?) on duplicate key update command = ?;", [streamer.id, layout, layout], err => {
                        if (err) api.Logger.severe(err);
                    });
                    con.query("update group__user set update_command = true where group_id = ? and user_id = ?;", [group.id, streamer.id], err => {
                        if (err) api.Logger.severe(err);
                    });

                    delete cache[modal.user.id];

                    if (method === "sendcmd") {
                        global.client.listen.client.say(streamer.display_name.toLowerCase(), command).then(() => {
                            let isMod = global.client.listen.isMod(streamer);
    
                            let embed = new MessageEmbed()
                                .setTitle("Message Sent!")
                                .setDescription(`Sent set command message to \`${streamer.display_name}\`!\nWe will automatically send update commands if participants are added or removed from this group.`);
    
                            if (isMod === null) {
                                embed.addFields([{
                                    name: "Warning",
                                    value: "We may not be listening to this channel! We currently only activate commands on channels with greater than 5000 followers and partners.",
                                }]);
                            } else if (!isMod) {
                                embed.addFields([{
                                    name: "Warning",
                                    value: "TMS may not be added as a moderator on this channel! This command may have failed!",
                                }]);
                            }
    
                            modal.reply({content: command, embeds: [embed], ephemeral: true});
                        }, handleError)
                    } else {
                        modal.reply({content: command, ephemeral: true})
                    }
                } else {
                    handleError("Layout must contain `{{group}}`, which is used for substituting group information.")
                }
            } else {
                handleError("Command generator information was not saved in cache. Try again");
            }
        } else if (modal.customId.startsWith("group-copy-")) {
            let id = modal.customId.replace("group-copy-", "");
            let game = modal.getTextInputValue("game");
            let host = modal.getTextInputValue("host");

            api.getGroupById(id).then(async group => {
                try {
                    host = (await api.Twitch.getUserByName(host))[0];
    
                    copyCache[modal.user.id] = {
                        game: game,
                        oldGroup: group,
                        host: host,
                        participants: group.participants,
                        modal: modal,
                    };

                    const embed = new MessageEmbed()
                        .setTitle("Copy Event")
                        .setDescription("**Copying event** - " + group.game + " hosted by " + group.host.display_name + " *[old data]*")
                        .addFields([
                            {
                                name: "Game",
                                value: game,
                                inline: true,
                            },
                            {
                                name: "Host",
                                value: `[${host.display_name}](https://twitch.tv/${host.display_name.toLowerCase()})`,
                                inline: true,
                            },
                            {
                                name: "Edit Participants",
                                value: "Utilize the select menu below to remove any participants that aren't in this group.\nUse the 'Add Participants' button to add participants."
                            }
                        ]);
                    
                    if (host.id !== group.host.id) { // new host is NOT the old host
                        copyCache[modal.user.id].participants = copyCache[modal.user.id].participants
                            .filter(x => x.id !== host.id && x.id !== group.host.id); // removes old host and new host from participants if present
                        
                        copyCache[modal.user.id].participants = [
                            ...copyCache[modal.user.id].participants,
                            group.host,   // adds old host to participants
                        ];

                        embed.addFields([
                            {
                                name: "Host Note",
                                value: "You selected a different host than the initial one.\nBy default, we'll add the groups old host as a participant and remove the new host as a participant, if present.\nEnsure the participant list is as desired before creating.",
                            }
                        ])
                    }

                    let participantString = "";

                    for (let i = 0; i < copyCache[modal.user.id].participants.length; i++) {
                        let participant = copyCache[modal.user.id].participants[i];
                        if (participantString !== "") participantString += "\n";

                        participantString += `${i+1} - [${participant.display_name}](https://twitch.tv/${participant.display_name.toLowerCase()})`;
                    }

                    embed.addFields([
                        {
                            name: "Participants",
                            value: participantString,
                        }
                    ])

                    const addParticipantsButton = new MessageButton()
                        .setCustomId("copy-participant-add")
                        .setLabel("Add Participant")
                        .setStyle("PRIMARY");

                    const createButton = new MessageButton()
                        .setCustomId("copy-create")
                        .setLabel("Create Group")
                        .setStyle("SUCCESS");

                    const removeParticipantsSelect = new MessageSelectMenu()
                        .setCustomId("copy-participant-remove")
                        .setPlaceholder("Remove Participants")
                        .setMinValues(1)
                        .setMaxValues(Math.max(1, copyCache[modal.user.id].participants.length - 1));
            
                    if (copyCache[modal.user.id].participants.length === 1)
                        removeParticipantsSelect.setDisabled(true);

                    removeParticipantsSelect.addOptions(copyCache[modal.user.id].participants.map(
                        x => {
                            return {
                                label: x.display_name,
                                value: String(x.id),
                            };
                        }
                    ));

                    const row = new MessageActionRow()
                        .addComponents(addParticipantsButton, createButton);

                    const removeParticipantsRow = new MessageActionRow()
                        .addComponents(removeParticipantsSelect);

                    modal.reply({content: ' ', embeds: [embed], components: [row, removeParticipantsRow], ephemeral: true});
                } catch (err) {
                    handleError(err);
                }
            }, handleError);
        } else if (modal.customId === "copy-participant-add") {
            if (copyCache.hasOwnProperty(modal.user.id)) {
                let participant;
    
                try {
                    participant = (await api.Twitch.getUserByName(modal.getTextInputValue("participant"), true))[0];
                } catch (err) {
                    handleError(err);
                    return;
                }
    
                if (copyCache[modal.user.id].host.id === participant.id
                    || copyCache[modal.user.id].participants.find(x => x.id === participant.id)) {
                    handleError("Participant already exists in this group!")
                    return;
                }

                copyCache[modal.user.id].participants = [
                    ...copyCache[modal.user.id].participants,
                    participant,
                ]

                updateCopyMessage(copyCache[modal.user.id]);

                modal.reply("Success!").then(message => {
                    modal.deleteReply().catch(api.Logger.warning);
                }, api.Logger.severe)
            } else {
                handleError("Lost copy cache. Please try again!")
            }
        }
    }
};

module.exports = listener;