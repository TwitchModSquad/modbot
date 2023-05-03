const {EmbedBuilder, SlashCommandBuilder, SlashCommandStringOption, SlashCommandUserOption, PermissionFlagsBits} = require("discord.js");

const errorEmbed = message => {
    return {embeds: [new EmbedBuilder()
            .setTitle("Error:")
            .setDescription(message)
            .setColor(0xed3734)], ephemeral: true};
}

const command = {
    data: new SlashCommandBuilder()
        .setName("user")
        .setDescription("View user data of a Twitch or Discord user")
        .addStringOption(
            new SlashCommandStringOption()
                .setName("twitch")
                .setDescription("Search by Twitch username")
                .setRequired(false)
                .setAutocomplete(true)
        )
        .addUserOption(
            new SlashCommandUserOption()
                .setName("discord")
                .setDescription("Search by Discord mention")
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    global: false,
    /**
     * Called when this command is executed
     * @param {CommandInteraction} interaction 
     */
    execute(interaction) {
        if (interaction.guildId) {
            global.api.Discord.getGuild(interaction.guildId).then(async guild => {
                try {
                    let embeds = [];

                    if (interaction.options.getString("twitch")) {
                        try {
                            let users = await global.api.Twitch.getUserByName(interaction.options.getString("twitch"));
                            for (let i = 0; i < users.length; i++) {
                                embeds = [
                                    ...embeds,
                                    await users[i].discordEmbed()
                                ];
                            }
                        } catch (err) {}
                    }
                    if (interaction.options.getUser("discord")) {
                        try {
                            let user = await global.api.Discord.getUserById(interaction.options.getUser("discord").id);

                            embeds = [
                                ...embeds,
                                await user.discordEmbed()
                            ];
                        } catch (err) {}
                    }

                    if (embeds.length === 0) {
                        embeds = [
                            errorEmbed("No users were found with this query!"),
                        ];
                    }

                    interaction.reply({embeds: embeds, ephemeral: true});
                } catch (err) {
                    global.api.Logger.warning(err);
                    interaction.reply(errorEmbed(err.toString()));
                }
            }).catch(err => {global.api.Logger.warning(err);interaction.reply(errorEmbed("" + err));});
        } else {
            interaction.reply(errorEmbed("Command must be sent in a guild"));
        }
    }
};

module.exports = command;