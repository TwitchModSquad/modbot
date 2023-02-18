const {EmbedBuilder} = require("discord.js");
const api = require("../../api/index");
const {temporaryMessage} = require("../commands/archive");

const config = require("../../config.json");

const listener = {
    name: 'archiveEditModalManager',
    eventName: 'modalSubmit',
    eventType: 'on',
    listener (modal) {
        if (modal.customId.startsWith("edit-offense-")) {
            api.Discord.getUserById(modal.user.id).then(user => {
                if (!user.identity?.id) {
                    temporaryMessage(modal, "reply", "You are not properly linked to TMS", 5000);
                    return;
                }

                let id = modal.customId.replace("edit-offense-", "");
    
                api.Archive.getEntryById(id).then(entry => {
                    let value = modal.getTextInputValue("offense");
                    entry.setOffense(value, user.identity).then(() => {
                        temporaryMessage(modal, "reply", "Offense was updated!", 5000, "**New offense:** ```" + value + "```");
                    }, err => {
                        temporaryMessage(modal, "reply", "Error", 5000, "Error: " + err);
                        global.api.Logger.warning(err);
                    });
                }, err => {
                    temporaryMessage(modal, "reply", "Error", 5000, "Archive entry not found");
                })
            }, err => {
                global.api.Logger.warning(err);
                modal.reply("Error: " + err);
            });
        } else if (modal.customId.startsWith("edit-description-")) {
            api.Discord.getUserById(modal.user.id).then(user => {
                if (!user.identity?.id) {
                    temporaryMessage(modal, "reply", "You are not properly linked to TMS", 5000);
                    return;
                }

                let id = modal.customId.replace("edit-description-", "");
    
                api.Archive.getEntryById(id).then(entry => {
                    let value = modal.getTextInputValue("description");
                    entry.setDescription(value, user.identity).then(() => {
                        temporaryMessage(modal, "reply", "Description was updated!", 5000, "**New description:** ```" + value + "```");
                    }, err => {
                        temporaryMessage(modal, "reply", "Error", 5000, "Error: " + err);
                        global.api.Logger.warning(err);
                    });
                }, err => {
                    temporaryMessage(modal, "reply", "Error", 5000, "Archive entry not found");
                })
            }, err => {
                global.api.Logger.warning(err);
                modal.reply("Error: " + err);
            });
        } else if (modal.customId.startsWith("add-twitch-user-")) {
            api.Discord.getUserById(modal.user.id).then(user => {
                if (!user.identity?.id) {
                    temporaryMessage(modal, "reply", "You are not properly linked to TMS", 5000);
                    return;
                }

                let id = modal.customId.replace("add-twitch-user-", "");
    
                api.Archive.getEntryById(id).then(entry => {
                    let value = modal.getTextInputValue("query");

                    const submitRaw = () => {
                        entry.addUser(value, "twitch", user.identity).then(() => {
                            temporaryMessage(modal, "reply", "Twitch user was added!", 5000, "**Unresolved Twitch User:** `" + value + "`");
                        }, err => {
                            global.api.Logger.warning(err);
                            temporaryMessage(modal, "reply", "Error", 5000, "Error: " + err);
                        });
                    }

                    api.Twitch.getUserByName(value, true).then(users => {
                        if (users.length > 0) {
                            entry.addUser(users[0], "twitch", user.identity).then(() => {
                                temporaryMessage(modal, "reply", "Twitch user was added!", 5000, "**Twitch User:** `" + users[0].display_name + " (" + users[0].id + ")`");
                            }, err => {
                                global.api.Logger.warning(err);
                                temporaryMessage(modal, "reply", "Error", 5000, "Error: " + err);
                            });
                        } else {
                            submitRaw();
                        }
                    }, err => {
                        global.api.Logger.warning(err);
                        submitRaw();
                    });
                }, err => {
                    temporaryMessage(modal, "reply", "Error", 5000, "Archive entry not found");
                })
            }, err => {
                global.api.Logger.warning(err);
                modal.reply("Error: " + err);
            });
        } else if (modal.customId.startsWith("add-discord-user-")) {
            api.Discord.getUserById(modal.user.id).then(user => {
                if (!user.identity?.id) {
                    temporaryMessage(modal, "reply", "You are not properly linked to TMS", 5000);
                    return;
                }

                let id = modal.customId.replace("add-discord-user-", "");
    
                api.Archive.getEntryById(id).then(entry => {
                    let value = modal.getTextInputValue("query");

                    const submitRaw = () => {
                        entry.addUser(value, "discord", user.identity).then(() => {
                            temporaryMessage(modal, "reply", "Discord user was added!", 5000, "**Unresolved Discord User:** `" + value + "`");
                        }, err => {
                            global.api.Logger.warning(err);
                            temporaryMessage(modal, "reply", "Error", 5000, "Error: " + err);
                        });
                    }

                    api.Discord.getUserById(value, false, true).then(user => {
                        entry.addUser(user, "discord", user.identity).then(() => {
                            temporaryMessage(modal, "reply", "Discord user was added!", 5000, "**Discord User:** `" + user.name + "#" + user.discriminator + " (" + user.id + ")`");
                        }, err => {
                            global.api.Logger.warning(err);
                            temporaryMessage(modal, "reply", "Error", 5000, "Error: " + err);
                        });
                    }, err => {
                        global.api.Logger.warning(err);
                        submitRaw();
                    });
                }, err => {
                    temporaryMessage(modal, "reply", "Error", 5000, "Archive entry not found");
                })
            }, err => {
                global.api.Logger.warning(err);
                modal.reply("Error: " + err);
            });
        } else if (modal.customId.startsWith("add-file-")) {
            api.Discord.getUserById(modal.user.id).then(user => {
                if (!user.identity?.id) {
                    temporaryMessage(modal, "reply", "You are not properly linked to TMS", 5000);
                    return;
                }

                let id = modal.customId.replace("add-file-", "");
    
                api.Archive.getEntryById(id).then(entry => {
                    let label = modal.getTextInputValue("label");
                    let url = modal.getTextInputValue("url");

                    try {
                        url = new URL(url);

                        if (url.protocol !== "http:" && url.protocol !== "https:") throw "Invalid protocol";

                        
                        entry.addFile(url, label, user.identity).then(file => {
                            temporaryMessage(modal, "reply", "The file was successfully added!", 5000, "**Label:** `" + file.label + "`\n**Remote Path:** `" + file.remote_path + "`");
                        }, err => {
                            global.api.Logger.warning(err);
                            temporaryMessage(modal, "reply", "Error", 5000, "Error: " + err);
                        });
                    } catch (err) {
                        global.api.Logger.warning(err);
                        temporaryMessage(message.channel, "send", "Message should either contain an attachment or a URL message content", 5000);
                    }
                }, err => {
                    temporaryMessage(modal, "reply", "Error", 5000, "Archive entry not found");
                })
            }, err => {
                global.api.Logger.warning(err);
                modal.reply("Error: " + err);
            });
        }
    }
};

module.exports = listener;