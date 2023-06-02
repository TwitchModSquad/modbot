const {SlashCommandBuilder, ChatInputCommandInteraction, SlashCommandSubcommandBuilder} = require("discord.js");
const api = require("../../api/");
const config = require("../../config.json");

const command = {
    data: new SlashCommandBuilder()
        .setName("promotion")
        .setDescription("Toggles Promotion role status")
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName("on")
                .setDescription("Turns on notifications from Promotion events")
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName("off")
                .setDescription("Turns off notifications from Promotion events")
        )
        .setDMPermission(false),
    /**
     * Execution function for this command
     * @param {ChatInputCommandInteraction} interaction 
     */
    execute(interaction) {
        const sub = interaction.options.getSubcommand();
        
        if (sub === "on") {
            interaction.member.roles.add(config.roles.promotion, "Manual").then(() => {
                interaction.success("You have successfully been **subscribed** to promotion events!");
            }, err => {
                api.Logger.warning(err);
                interaction.error("An error occurred while adding the role!");
            });
        }  else if (sub === "off") {
            interaction.member.roles.remove(config.roles.promotion, "Manual").then(() => {
                interaction.success("You have successfully been **unsubscribed** from promotion events!");
            }, err => {
                api.Logger.warning(err);
                interaction.error("An error occurred while removing the role!");
            });
        } else {
            interaction.error("Unknown subcommand!");
        }
    }
};

module.exports = command;
