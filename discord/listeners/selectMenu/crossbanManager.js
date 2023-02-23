const { TextInputStyle, ModalBuilder, TextInputBuilder, ActionRowBuilder } = require("discord.js");
const api = require("../../../api/index");

const {storedCrossBanChannels} = require("../button/crossbanManager");

const listener = {
    name: 'archiveMove',
    /**
     * Verifies a select menu interaction should be sent to this listener
     * @param {StringSelectMenuInteraction} interaction 
     */
    verify(interaction) {
        return interaction.isStringSelectMenu() && interaction.component.customId.startsWith("cbsel-");
    },
    /**
     * Listener for a select menu interaction
     * @param {StringSelectMenuInteraction} interaction 
     */
    listener (interaction) {
        let twitchId = interaction.component.customId.substring(6);
            storedCrossBanChannels[interaction.member.id] = interaction.values;

            api.Twitch.getUserById(twitchId).then(async user => {
                const reason = new TextInputBuilder()
                    .setCustomId("reason")
                    .setLabel("Ban Reason")
                    .setPlaceholder("This reason is sent to Twitch and is viewable by the user")
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(3)
                    .setMaxLength(64)
                    .setRequired(false);

                const includeThumbprint = new TextInputBuilder()
                    .setCustomId("include-thumbprint")
                    .setLabel("Include Thumbprint (yes/no)")
                    .setValue("Yes")
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(2)
                    .setMaxLength(3)
                    .setRequired(false);
                
                const modal = new ModalBuilder()
                    .setCustomId("cb-ban-" + user.id)
                    .setTitle("Ban User " + user.display_name)
                    .addComponents(
                        new ActionRowBuilder().addComponents(reason),
                        new ActionRowBuilder().addComponents(includeThumbprint)
                    );
    
                interaction.showModal(modal);
            }, err => {
                handleError(err);
            });
    }
};

module.exports = listener;