const { ButtonStyle } = require("discord.js");
const Discord = require("discord.js");
const { storedGameLists } = require("../button/gameRolesManager");

const listener = {
    name: 'gameRolesManager',
    /**
     * Verifies a select menu interaction should be sent to this listener
     * @param {StringSelectMenuInteraction} interaction 
     */
    verify(interaction) {
        return interaction.isStringSelectMenu() && interaction.component.customId === "role-select";
    },
    /**
     * Listener for a select menu interaction
     * @param {StringSelectMenuInteraction} interaction 
     */
    listener (interaction) {
        storedGameLists[interaction.member.id] = interaction.values;

        const addButton = new Discord.ButtonBuilder()
                .setCustomId("add-roles")
                .setLabel("Add Roles")
                .setStyle(ButtonStyle.Success);
    
        const removeButton = new Discord.ButtonBuilder()
                .setCustomId("remove-roles")
                .setLabel("Remove Roles")
                .setStyle(ButtonStyle.Danger);
    
        const setButton = new Discord.ButtonBuilder()
                .setCustomId("set-roles")
                .setLabel("Set Roles")
                .setStyle(ButtonStyle.Primary);
    
        const row = new Discord.ActionRowBuilder()
                .addComponents(addButton, removeButton, setButton);
    
        interaction.reply({embeds: [new Discord.EmbedBuilder().setTitle("Saved Game Choices!").setDescription(`You've selected ${interaction.values.length} game${interaction.values.length === 1 ? "" : "s"}. Use a button below to save.`).setColor(0x2dad3e)], components: [row], ephemeral: true});
    }
};

module.exports = listener;