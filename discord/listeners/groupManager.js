const {Modal, TextInputComponent, showModal} = require("discord-modals");
const Discord = require("discord.js");
const con = require("../../database");
const api = require("../../api/index");

const listener = {
    name: 'groupManager',
    eventName: 'interactionCreate',
    eventType: 'on',
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
                            group.start().catch(handleError);
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
            }
        }
    }
};

module.exports = listener;