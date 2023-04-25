const { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandStringOption } = require("discord.js");
const api = require("../../api/");

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
                        .setMaxLength(25)
                        .setRequired(true)
                )
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("comment")
                        .setDescription("The pre-defined comment to add to the user")
                        .setMinLength(1)
                        .setMaxLength(5)
                )
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("customcomment")
                        .setDescription("The custom comment to add to the user")
                        .setMinLength(6)
                        .setMaxLength(512)
                )
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName("delete")
                .setDescription("Deletes a Mod Comment under a user")
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("user")
                        .setDescription("The Twitch user")
                        .setMinLength(1)
                        .setMaxLength(25)
                        .setRequired(true)
                )
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("comment")
                        .setDescription("The comment to remove from the user")
                        .setMinLength(1)
                        .setMaxLength(5)
                )
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName("view")
                .setDescription("Views Mod Comments under a user")
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("user")
                        .setDescription("The Twitch user")
                        .setMinLength(1)
                        .setMaxLength(25)
                        .setRequired(true)
                )
        ),
    /**
     * Execution function for this command
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand(true);

        try {
            let user = await api.Twitch.getUserByName(interaction.options.getString("user", true));

            if (user.length > 0) {
                user = user[0];
            } else {
                interaction.error("User was not found!");
                return;
            }

            if (subcommand === "create") {
                let comment = interaction.options.getString("comment");
                let customComment = interaction.options.getString("customcomment");

                if (comment) {
                    
                } else if (customComment) {

                } else {
                    interaction.error("...no comment")
                }
            } else if (subcommand === "delete") {
    
            } else if (subcommand === "view") {
    
            } else {
                interaction.error("Unknown subcommand");
            }
        } catch(err) {
            interaction.error(err);
        }
    }
};

module.exports = command;