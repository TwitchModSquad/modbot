const Discord = require("discord.js");

const games = require("../../games");

let storedGameLists = {};

const listener = {
    name: 'gameRolesManager',
    storedGameLists: storedGameLists,
    /**
     * Verifies a button press should be sent to this listener
     * @param {ButtonInteraction} interaction 
     */
    verify(interaction) {
        return interaction.component.customId === "set-roles"
            || interaction.component.customId === "remove-roles"
            || interaction.component.customId === "add-roles";
    },
    /**
     * Listener for a button press
     * @param {ButtonInteraction} interaction 
     */
    listener (interaction) {
        let buttonId = interaction.component.customId;

        const handleSuccess = message => {
            interaction.reply({embeds: [new Discord.EmbedBuilder().setTitle(message).setColor(0x2dad3e)], ephemeral: true})
        }

        const handleError = err => {
            interaction.reply({embeds: [new Discord.EmbedBuilder().setTitle(err).setColor(0x9e392f)], ephemeral: true})
        }

        if (storedGameLists[interaction.member.id]) {
            if (buttonId === "set-roles") {
                let gameRoles = games.map(x => x.role);

                interaction.member.roles.remove(gameRoles).then(() => {
                    interaction.member.roles.add(storedGameLists[interaction.member.id]).then(() => {
                        handleSuccess("Successfully set selected roles!");
                    }, handleError)
                }, handleError);
            } else if (buttonId === "remove-roles") {
                interaction.member.roles.remove(storedGameLists[interaction.member.id]).then(() => {
                    handleSuccess("Successfully removed selected roles!");
                }, handleError);
            } else if (buttonId === "add-roles") {
                interaction.member.roles.add(storedGameLists[interaction.member.id]).then(() => {
                    handleSuccess("Successfully added selected roles!");
                }, handleError);
            }
        } else {
            handleError("No game list stored.");
        }
    }
};

module.exports = listener;