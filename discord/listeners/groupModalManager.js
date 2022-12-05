const { MessageEmbed } = require("discord.js");
const api = require("../../api/index");

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
        }
    }
};

module.exports = listener;