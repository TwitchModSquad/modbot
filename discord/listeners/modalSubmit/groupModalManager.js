const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const api = require("../../../api/index");
const con = require("../../../database");

const {cache, copyCache, updateCopyMessage} = require("../groupManager");

const listener = {
    name: 'groupModalManager',
    /**
     * Verifies a button press should be sent to this listener
     * @param {ModalSubmitInteraction} interaction 
     */
    verify(interaction) {
        return interaction.customId.startsWith("group-addpartic-")
            || interaction.customId.startsWith("group-setgame-")
            || interaction.customId === "group-cmd"
            || interaction.customId.startsWith("group-copy-")
            || interaction.customId === "copy-participant-add";
    },
    /**
     * Listener for a button press
     * @param {ModalSubmitInteraction} interaction 
     */
    async listener (interaction) {
        const handleSuccess = message => {
            interaction.reply({embeds: [new EmbedBuilder().setTitle(message).setColor(0x2dad3e)], ephemeral: true})
        }

        const handleError = (err) => {
            global.api.Logger.warning(err);
            interaction.reply({embeds: [new EmbedBuilder().setTitle("Uh oh!").setDescription(err).setColor(0x9e392f)], ephemeral: true})
        }

        if (interaction.customId.startsWith("group-addpartic-")) {
            let id = interaction.customId.replace("group-addpartic-", "");
            let participant;

            try {
                participant = (await api.Twitch.getUserByName(interaction.fields.getTextInputValue("participant"), true))[0];
            } catch (err) {
                handleError(err);
                return;
            }

            api.Discord.getUserById(interaction.user.id).then(async discordUser => {
                if (discordUser.identity?.id) {
                    let identity = await api.getFullIdentity(discordUser.identity.id);
                    
                    api.Group.getGroupById(id).then(group => {
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
        } else if (interaction.customId.startsWith("group-setgame-")) {
            let id = interaction.customId.replace("group-setgame-", "");
            let game = interaction.fields.getTextInputValue("game");

            api.Discord.getUserById(interaction.user.id).then(async discordUser => {
                if (discordUser.identity?.id) {
                    let identity = await api.getFullIdentity(discordUser.identity.id);
                    
                    api.Group.getGroupById(id).then(group => {
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
        } else if (interaction.customId === "group-cmd") {
            if (cache.hasOwnProperty(interaction.user.id)) {
                const group = cache[interaction.user.id].group;
                const method = cache[interaction.user.id].method;
                const streamer = cache[interaction.user.id].streamer;

                const layout = interaction.fields.getTextInputValue("layout");

                if (layout.indexOf("{{group}}") !== -1) {
                    const command = await group.generateGroupCommand(streamer, layout);
                    con.query("insert into group__streamer (streamer_id, command) values (?, ?) on duplicate key update command = ?;", [streamer.id, layout, layout], err => {
                        if (err) api.Logger.severe(err);
                    });
                    con.query("update group__user set update_command = true where group_id = ? and user_id = ?;", [group.id, streamer.id], err => {
                        if (err) api.Logger.severe(err);
                    });

                    delete cache[interaction.user.id];

                    if (method === "sendcmd") {
                        global.client.listen.client.say(streamer.login, command).then(() => {
                            let isMod = global.client.listen.isMod(streamer);
    
                            let embed = new EmbedBuilder()
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
    
                            interaction.reply({content: command, embeds: [embed], ephemeral: true});
                        }, handleError)
                    } else {
                        interaction.reply({content: command, ephemeral: true})
                    }
                } else {
                    handleError("Layout must contain `{{group}}`, which is used for substituting group information.")
                }
            } else {
                handleError("Command generator information was not saved in cache. Try again");
            }
        } else if (interaction.customId.startsWith("group-copy-")) {
            let id = interaction.customId.replace("group-copy-", "");
            let game = interaction.fields.getTextInputValue("game");
            let host = interaction.fields.getTextInputValue("host");

            api.Group.getGroupById(id).then(async group => {
                try {
                    host = (await api.Twitch.getUserByName(host))[0];
    
                    copyCache[interaction.user.id] = {
                        game: game,
                        oldGroup: group,
                        host: host,
                        participants: group.participants,
                        modal: interaction,
                    };

                    const embed = new EmbedBuilder()
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
                                value: `[${host.display_name}](https://twitch.tv/${host.login})`,
                                inline: true,
                            },
                            {
                                name: "Edit Participants",
                                value: "Utilize the select menu below to remove any participants that aren't in this group.\nUse the 'Add Participants' button to add participants."
                            }
                        ]);
                    
                    if (host.id !== group.host.id) { // new host is NOT the old host
                        copyCache[interaction.user.id].participants = copyCache[interaction.user.id].participants
                            .filter(x => x.id !== host.id && x.id !== group.host.id); // removes old host and new host from participants if present
                        
                        copyCache[interaction.user.id].participants = [
                            ...copyCache[interaction.user.id].participants,
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

                    for (let i = 0; i < copyCache[interaction.user.id].participants.length; i++) {
                        let participant = copyCache[interaction.user.id].participants[i];
                        if (participantString !== "") participantString += "\n";

                        participantString += `${i+1} - [${participant.display_name}](https://twitch.tv/${participant.login})`;
                    }

                    embed.addFields([
                        {
                            name: "Participants",
                            value: participantString,
                        }
                    ])

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
                        .setMaxValues(Math.max(1, copyCache[interaction.user.id].participants.length - 1));
            
                    if (copyCache[interaction.user.id].participants.length === 1)
                        removeParticipantsSelect.setDisabled(true);

                    removeParticipantsSelect.addOptions(copyCache[interaction.user.id].participants.map(
                        x => {
                            return {
                                label: x.display_name,
                                value: String(x.id),
                            };
                        }
                    ));

                    const row = new ActionRowBuilder()
                        .addComponents(addParticipantsButton, createButton);

                    const removeParticipantsRow = new ActionRowBuilder()
                        .addComponents(removeParticipantsSelect);

                    interaction.reply({embeds: [embed], components: [row, removeParticipantsRow], ephemeral: true});
                } catch (err) {
                    handleError(err);
                }
            }, handleError);
        } else if (interaction.customId === "copy-participant-add") {
            if (copyCache.hasOwnProperty(interaction.user.id)) {
                let participant;
    
                try {
                    participant = (await api.Twitch.getUserByName(interaction.fields.getTextInputValue("participant"), true))[0];
                } catch (err) {
                    handleError(err);
                    return;
                }
    
                if (copyCache[interaction.user.id].host.id === participant.id
                    || copyCache[interaction.user.id].participants.find(x => x.id === participant.id)) {
                    handleError("Participant already exists in this group!")
                    return;
                }

                copyCache[interaction.user.id].participants = [
                    ...copyCache[interaction.user.id].participants,
                    participant,
                ]

                updateCopyMessage(copyCache[interaction.user.id]);

                interaction.reply("Success!").then(message => {
                    interaction.deleteReply().catch(api.Logger.warning);
                }, api.Logger.severe)
            } else {
                handleError("Lost copy cache. Please try again!")
            }
        }
    }
};

module.exports = listener;