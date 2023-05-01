const { ChatInputCommandInteraction, SlashCommandBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");

const command = {
    data: new SlashCommandBuilder()
        .setName("connect")
        .setDescription("Connect your account to TMS!")
        .setDefaultMemberPermissions(0),
    memory: {},
    /**
     * Execution function for this command
     * @param {ChatInputCommandInteraction} interaction 
     */
    execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId("connect")
            .setTitle("Connect to TMS")
            .setComponents(
                new ActionRowBuilder()
                    .setComponents(
                        new TextInputBuilder()
                            .setCustomId("streamers")
                            .setLabel("Streamers you moderate for")
                            .setPlaceholder("Twitch names, separated by new lines")
                            .setMinLength(2)
                            .setMaxLength(512)
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                    ),
                new ActionRowBuilder()
                    .setComponents(
                        new TextInputBuilder()
                            .setCustomId("username")
                            .setLabel("Your Twitch Username")
                            .setPlaceholder("DevTwijn")
                            .setMinLength(2)
                            .setMaxLength(16)
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    ),
                new ActionRowBuilder()
                    .setComponents(
                        new TextInputBuilder()
                            .setCustomId("nickname")
                            .setLabel("Nickname Identification")
                            .setPlaceholder("Shorthand of the primary streamers you mod for")
                            .setMinLength(2)
                            .setMaxLength(32)
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                    )
            );

        if (command.memory.hasOwnProperty(interaction.user.id)) {
            modal.components[0].components[0].setValue(command.memory[interaction.user.id].streamers);
            if (command.memory[interaction.user.id].nickname && command.memory[interaction.user.id].nickname.length >= 2)
                modal.components[1].components[0].setValue(command.memory[interaction.user.id].nickname);
        }

        interaction.showModal(modal);
    }
};

module.exports = command;