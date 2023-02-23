const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ChatInputCommandInteraction, SlashCommandBuilder } = require("discord.js");
const games = require("../games");

const command = {
    data: new SlashCommandBuilder()
        .setName("roles")
        .setDescription("Allows you to select Game roles!"),
    /**
     * Execution function for this command
     * @param {ChatInputCommandInteraction} interaction 
     */
    execute(interaction) {
        const embed = new EmbedBuilder()
                .setTitle("Game Roles!")
                .setDescription('Select a game role below then "Add Role" or "Remove Role" to manage your games.')
                .setColor(0x00FFFF);

        let options = games.map(x => {return {value: x.role, label: x.label, emoji: x.emoji}});

        let selectMenu = new StringSelectMenuBuilder()
                .setCustomId("role-select")
                .addOptions(options)
                .setPlaceholder("Select games to add or remove!")
                .setMinValues(1)
                .setMaxValues(options.length);

        const row = new ActionRowBuilder()
                .addComponents(selectMenu);
        
        interaction.reply({embeds: [embed], components: [row], ephemeral: true});
    }
};

module.exports = command;