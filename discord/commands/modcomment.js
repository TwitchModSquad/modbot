const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandStringOption } = require("discord.js");
const games = require("../games");

const command = {
    data: new SlashCommandBuilder()
        .setName("modcomment")
        .setDescription("Base command for creating, deleting, and viewing Mod Comments")
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName("create")
                .setDescription("Creates a new Mod Comment under a user")
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("user")
                        .setDescription("The Twitch user")
                        .setMinLength(1)
                )
        ),
    /**
     * Execution function for this command
     * @param {ChatInputCommandInteraction} interaction 
     */
    execute(interaction) {
        
    }
};

module.exports = command;