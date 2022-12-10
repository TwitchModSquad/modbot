const { MessageEmbed } = require("discord.js");
const api = require("../../api/index");
const con = require("../../database");

const {cache} = require("./groupManager");

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
        }
    }
};

module.exports = listener;