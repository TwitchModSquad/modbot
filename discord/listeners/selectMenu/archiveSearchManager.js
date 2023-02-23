const api = require("../../../api");

const listener = {
    name: 'archiveSearchManager',
    /**
     * Verifies a select menu interaction should be sent to this listener
     * @param {StringSelectMenuInteraction} interaction 
     */
    verify(interaction) {
        return interaction.isStringSelectMenu() && (
            interaction.component.customId === "archive-search-twitch"
            || interaction.component.customId === "archive-search-discord"
        );
    },
    /**
     * Listener for a select menu interaction
     * @param {StringSelectMenuInteraction} interaction 
     */
    async listener (interaction) {
        if (interaction.component.customId === "archive-search-twitch") {
            let embeds = [];
            for (let i = 0; i < interaction.values.length; i++) {
                const user = await api.Twitch.getUserById(interaction.values[i]);
                embeds = [
                    ...embeds,
                    await user.discordEmbed()
                ];
            }
            interaction.reply({ephemeral: true, embeds: embeds});
        } else if (interaction.component.customId === "archive-search-discord") {
            let embeds = [];
            for (let i = 0; i < interaction.values.length; i++) {
                const user = await api.Discord.getUserById(interaction.values[i]);
                embeds = [
                    ...embeds,
                    await user.discordEmbed()
                ];
            }
            interaction.reply({ephemeral: true, embeds: embeds});
        }
    }
};

module.exports = listener;