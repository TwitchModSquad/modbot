const Discord = require("discord.js");

const games = require("../games");

let storedGameLists = {};

const listener = {
    name: 'gameRolesManager',
    eventName: 'interactionCreate',
    eventType: 'on',
    listener (interaction) {
        if (interaction.isButton()) {
            let buttonId = interaction.component.customId;

            const handleSuccess = message => {
                interaction.reply({content: ' ', embeds: [new Discord.MessageEmbed().setTitle(message).setColor(0x2dad3e)], ephemeral: true})
            }

            const handleError = err => {
                interaction.reply({content: ' ', embeds: [new Discord.MessageEmbed().setTitle(err).setColor(0x9e392f)], ephemeral: true})
            }

            if (buttonId === "set-roles" || buttonId === "remove-roles" || buttonId === "add-roles") {
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
        } else if (interaction.isSelectMenu() && interaction.component.customId === "role-select") {
            storedGameLists[interaction.member.id] = interaction.values;
            

            const addButton = new Discord.MessageButton()
                    .setCustomId("add-roles")
                    .setLabel("Add Roles")
                    .setStyle("SUCCESS");

            const removeButton = new Discord.MessageButton()
                    .setCustomId("remove-roles")
                    .setLabel("Remove Roles")
                    .setStyle("DANGER");

            const setButton = new Discord.MessageButton()
                    .setCustomId("set-roles")
                    .setLabel("Set Roles")
                    .setStyle("PRIMARY");

            const row = new Discord.MessageActionRow()
                    .addComponents(addButton, removeButton, setButton);

            interaction.reply({content: ' ', embeds: [new Discord.MessageEmbed().setTitle("Saved Game Choices!").setDescription(`You've selected ${interaction.values.length} game${interaction.values.length === 1 ? "" : "s"}. Use a button below to save.`).setColor(0x2dad3e)], components: [row], ephemeral: true});
        }
    }
};

module.exports = listener;