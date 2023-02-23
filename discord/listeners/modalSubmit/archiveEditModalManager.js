const { ModalSubmitInteraction } = require("discord.js");
const api = require("../../../api/index");
const {temporaryMessage} = require("../../commands/archive");

const listener = {
    name: 'archiveEditModalManager',
    /**
     * Verifies a button press should be sent to this listener
     * @param {ModalSubmitInteraction} interaction 
     */
    verify(interaction) {
        return interaction.customId.startsWith("edit-offense-")
            || interaction.customId.startsWith("edit-description-")
            || interaction.customId.startsWith("add-twitch-user-")
            || interaction.customId.startsWith("add-discord-user-")
            || interaction.customId.startsWith("add-file-");
    },
    /**
     * Listener for a button press
     * @param {ModalSubmitInteraction} interaction 
     */
    listener (interaction) {
        if (interaction.customId.startsWith("edit-offense-")) {
            api.Discord.getUserById(interaction.user.id).then(user => {
                if (!user.identity?.id) {
                    temporaryMessage(interaction, "reply", "You are not properly linked to TMS", 5000);
                    return;
                }

                let id = interaction.customId.replace("edit-offense-", "");
    
                api.Archive.getEntryById(id).then(entry => {
                    let value = interaction.fields.getTextInputValue("offense");
                    entry.setOffense(value, user.identity).then(() => {
                        temporaryMessage(interaction, "reply", "Offense was updated!", 5000, "**New offense:** ```" + value + "```");
                    }, err => {
                        temporaryMessage(interaction, "reply", "Error", 5000, "Error: " + err);
                        global.api.Logger.warning(err);
                    });
                }, err => {
                    temporaryMessage(interaction, "reply", "Error", 5000, "Archive entry not found");
                })
            }, err => {
                global.api.Logger.warning(err);
                interaction.reply("Error: " + err);
            });
        } else if (interaction.customId.startsWith("edit-description-")) {
            api.Discord.getUserById(interaction.user.id).then(user => {
                if (!user.identity?.id) {
                    temporaryMessage(interaction, "reply", "You are not properly linked to TMS", 5000);
                    return;
                }

                let id = interaction.customId.replace("edit-description-", "");
    
                api.Archive.getEntryById(id).then(entry => {
                    let value = interaction.fields.getTextInputValue("description");
                    entry.setDescription(value, user.identity).then(() => {
                        temporaryMessage(interaction, "reply", "Description was updated!", 5000, "**New description:** ```" + value + "```");
                    }, err => {
                        temporaryMessage(interaction, "reply", "Error", 5000, "Error: " + err);
                        global.api.Logger.warning(err);
                    });
                }, err => {
                    temporaryMessage(interaction, "reply", "Error", 5000, "Archive entry not found");
                })
            }, err => {
                global.api.Logger.warning(err);
                interaction.reply("Error: " + err);
            });
        } else if (interaction.customId.startsWith("add-twitch-user-")) {
            api.Discord.getUserById(interaction.user.id).then(user => {
                if (!user.identity?.id) {
                    temporaryMessage(interaction, "reply", "You are not properly linked to TMS", 5000);
                    return;
                }

                let id = interaction.customId.replace("add-twitch-user-", "");
    
                api.Archive.getEntryById(id).then(entry => {
                    let value = interaction.fields.getTextInputValue("query");

                    const submitRaw = () => {
                        entry.addUser(value, "twitch", user.identity).then(() => {
                            temporaryMessage(interaction, "reply", "Twitch user was added!", 5000, "**Unresolved Twitch User:** `" + value + "`");
                        }, err => {
                            global.api.Logger.warning(err);
                            temporaryMessage(interaction, "reply", "Error", 5000, "Error: " + err);
                        });
                    }

                    api.Twitch.getUserByName(value, true).then(users => {
                        if (users.length > 0) {
                            entry.addUser(users[0], "twitch", user.identity).then(() => {
                                temporaryMessage(interaction, "reply", "Twitch user was added!", 5000, "**Twitch User:** `" + users[0].display_name + " (" + users[0].id + ")`");
                            }, err => {
                                global.api.Logger.warning(err);
                                temporaryMessage(interaction, "reply", "Error", 5000, "Error: " + err);
                            });
                        } else {
                            submitRaw();
                        }
                    }, err => {
                        global.api.Logger.warning(err);
                        submitRaw();
                    });
                }, err => {
                    temporaryMessage(interaction, "reply", "Error", 5000, "Archive entry not found");
                })
            }, err => {
                global.api.Logger.warning(err);
                interaction.reply("Error: " + err);
            });
        } else if (interaction.customId.startsWith("add-discord-user-")) {
            api.Discord.getUserById(interaction.user.id).then(user => {
                if (!user.identity?.id) {
                    temporaryMessage(interaction, "reply", "You are not properly linked to TMS", 5000);
                    return;
                }

                let id = interaction.customId.replace("add-discord-user-", "");
    
                api.Archive.getEntryById(id).then(entry => {
                    let value = interaction.fields.getTextInputValue("query");

                    const submitRaw = () => {
                        entry.addUser(value, "discord", user.identity).then(() => {
                            temporaryMessage(interaction, "reply", "Discord user was added!", 5000, "**Unresolved Discord User:** `" + value + "`");
                        }, err => {
                            global.api.Logger.warning(err);
                            temporaryMessage(interaction, "reply", "Error", 5000, "Error: " + err);
                        });
                    }

                    api.Discord.getUserById(value, false, true).then(user => {
                        entry.addUser(user, "discord", user.identity).then(() => {
                            temporaryMessage(interaction, "reply", "Discord user was added!", 5000, "**Discord User:** `" + user.name + "#" + user.discriminator + " (" + user.id + ")`");
                        }, err => {
                            global.api.Logger.warning(err);
                            temporaryMessage(interaction, "reply", "Error", 5000, "Error: " + err);
                        });
                    }, err => {
                        global.api.Logger.warning(err);
                        submitRaw();
                    });
                }, err => {
                    temporaryMessage(interaction, "reply", "Error", 5000, "Archive entry not found");
                })
            }, err => {
                global.api.Logger.warning(err);
                interaction.reply("Error: " + err);
            });
        } else if (interaction.customId.startsWith("add-file-")) {
            api.Discord.getUserById(interaction.user.id).then(user => {
                if (!user.identity?.id) {
                    temporaryMessage(interaction, "reply", "You are not properly linked to TMS", 5000);
                    return;
                }

                let id = interaction.customId.replace("add-file-", "");
    
                api.Archive.getEntryById(id).then(entry => {
                    let label = interaction.fields.getTextInputValue("label");
                    let url = interaction.fields.getTextInputValue("url");

                    try {
                        url = new URL(url);

                        if (url.protocol !== "http:" && url.protocol !== "https:") throw "Invalid protocol";

                        
                        entry.addFile(url, label, user.identity).then(file => {
                            temporaryMessage(interaction, "reply", "The file was successfully added!", 5000, "**Label:** `" + file.label + "`\n**Remote Path:** `" + file.remote_path + "`");
                        }, err => {
                            global.api.Logger.warning(err);
                            temporaryMessage(interaction, "reply", "Error", 5000, "Error: " + err);
                        });
                    } catch (err) {
                        global.api.Logger.warning(err);
                        temporaryMessage(message.channel, "send", "Message should either contain an attachment or a URL message content", 5000);
                    }
                }, err => {
                    temporaryMessage(interaction, "reply", "Error", 5000, "Archive entry not found");
                })
            }, err => {
                global.api.Logger.warning(err);
                interaction.reply("Error: " + err);
            });
        }
    }
};

module.exports = listener;