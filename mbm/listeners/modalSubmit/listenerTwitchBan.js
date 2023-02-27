const { ModalSubmitInteraction } = require("discord.js");

const listener = {
    name: 'listenerTwitchBan',
    /**
     * Verifies a button press should be sent to this listener
     * @param {ModalSubmitInteraction} interaction 
     */
    verify(interaction) {
        return interaction.customId === "listener-twitchban";
    },
    /**
     * Listener for a button press
     * @param {ModalSubmitInteraction} interaction 
     */
    listener (interaction) {
        global.api.Discord.getGuild(interaction.guildId).then(async guild => {
            let usernames = interaction.fields.getTextInputValue("usernames").split("\n");
    
            let users = [];
            for (let i = 0; i < usernames.length; i++) {
                let retrievedUsers = await global.api.Twitch.getUserByName(usernames[i].trim(), true);
    
                retrievedUsers.forEach(user => {
                    if (!users.find(x => x.id === user.id)) {
                        users = [
                            ...users,
                            user,
                        ];
                    }
                });
            }
            if (users.length > 0) {
                guild.addListener(interaction.channel, "twitchBan", users.map(x => x.id).join(",")).then(listener => {
                    interaction.success("The listener was added!");
                }, err => {
                    global.api.Logger.warning(err);
                    interaction.error("Failed to add listener!");
                });
            } else {
                interaction.error("Less than 1 user returned");
            }
        }, err => {
            interaction.error("Guild not found");
        });
    }
};

module.exports = listener;