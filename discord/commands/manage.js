const { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandStringOption, SlashCommandUserOption, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const api = require("../../api/");

const command = {
    data: new SlashCommandBuilder()
        .setName("manage")
        .setDescription("Allows moderators to manage specific TMS identities and other data")
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName("identity")
                .setDescription("Management of TMS user identities")
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("twitch")
                        .setDescription("The Twitch user to pull the identity for")
                        .setRequired(false)
                        .setAutocomplete(true)
                )
                .addUserOption(
                    new SlashCommandUserOption()
                        .setName("discord")
                        .setDescription("The Discord user to pull the identity for")
                        .setRequired(false)
                )
        )
        .setDefaultMemberPermissions(0),
    interactions: {},
    /**
     * Execution function for this command
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand(true);
        let user = null;

        try {
            user = await api.Discord.getUserById(interaction.user.id);
            
            if (!user.identity?.admin && !user.identity.mod) {
                interaction.error("You do not have permission to use this command.");
                return;
            }
        } catch(e) {
            api.Logger.warning(e);
            interaction.error("You do not have permission to use this command.");
            return;
        }

        if (subcommand === "identity") {
            let twitchUsername = interaction.options.getString("twitch", false);
            let discordUser = interaction.options.getUser("discord", false);

            if (!twitchUsername && !discordUser) {
                interaction.error("No Twitch or Discord user was provided");
                return;
            }

            if (twitchUsername && discordUser) {
                interaction.error("Both a Twitch and Discord user was provided. Please only use one field");
                return;
            }

            let identity = null;

            try {
                if (twitchUsername) {
                    const twitchUserObj = (await api.Twitch.getUserByName(twitchUsername, true))[0];

                    if (twitchUserObj.identity?.id) {
                        identity = await api.getFullIdentity(twitchUserObj.identity.id);
                    } else {
                        const embed = await twitchUserObj.discordEmbed();
                        const createRow = new ActionRowBuilder()
                            .setComponents(
                                new ButtonBuilder()
                                    .setCustomId("id-create-" + twitchUserObj.id)
                                    .setLabel("Create Identity")
                                    .setStyle(ButtonStyle.Success)
                            );

                        interaction.reply({embeds: [embed], components: [createRow], ephemeral: true});

                        command.interactions[interaction.user.id] = interaction;
                        
                        return;
                    }
                } else if (discordUser) {
                    const discordUserObj = await api.Discord.getUserById(discordUser.id);

                    if (discordUserObj.identity?.id) {
                        identity = await api.getFullIdentity(discordUserObj.identity.id);
                    } else {
                        interaction.error("User does not have an active identity.\nPlease open the user via Twitch username and add the Discord user to an identity.")
                        return;
                    }
                }
            } catch(e) {
                api.Logger.warning(e);
                interaction.error(e);
                return;
            }

            if (identity.admin && !user.identity.admin) {
                interaction.error("You do not have permission to manage this user.");
                return;
            }

            if (identity.mod && !(user.identity.mod || user.identity.admin)) {
                interaction.error("You do not have permission to manage this user.");
                return;
            }

            const message = await identity.editEmbed(user.identity.admin);
            interaction.reply(message);

            command.interactions[interaction.user.id] = interaction;
        }
    }
};

module.exports = command;