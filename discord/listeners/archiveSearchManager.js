const api = require("../../api/");

const listener = {
    name: 'archiveSearchManager',
    eventName: 'interactionCreate',
    eventType: 'on',
    async listener (interaction) {
        if (interaction.isSelectMenu()) {
            if (interaction.component.customId === "archive-search-twitch") {
                let embeds = [];
                for (let i = 0; i < interaction.values.length; i++) {
                    const user = await api.Twitch.getUserById(interaction.values[i]);
                    embeds = [
                        ...embeds,
                        await user.discordEmbed()
                    ];
                }
                interaction.reply({content: ' ', ephemeral: true, embeds: embeds});
            } else if (interaction.component.customId === "archive-search-discord") {
                let embeds = [];
                for (let i = 0; i < interaction.values.length; i++) {
                    const user = await api.Discord.getUserById(interaction.values[i]);
                    embeds = [
                        ...embeds,
                        await user.discordEmbed()
                    ];
                }
                interaction.reply({content: ' ', ephemeral: true, embeds: embeds});
            }
        }
    }
};

module.exports = listener;