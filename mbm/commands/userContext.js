const { ContextMenuCommandInteraction, ContextMenuCommandBuilder, ApplicationCommandType, PermissionFlagsBits } = require("discord.js");

const command = {
    data: new ContextMenuCommandBuilder()
        .setName("User Lookup")
        .setType(ApplicationCommandType.User)
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false),
    global: false,
    /**
     * Called when this command is executed
     * @param {ContextMenuCommandInteraction} interaction 
     */
    execute(interaction) {
        if (!interaction.isUserContextMenuCommand()) return;

        global.api.Discord.getUserById(interaction.targetUser.id, false, true).then(async user => {
            interaction.reply({embeds: [await user.discordEmbed()], ephemeral: true});
        }, err => {
            global.api.Logger.warning(err);
            interaction.error("An error occurred: " + err);
        });
    }
};

module.exports = command;