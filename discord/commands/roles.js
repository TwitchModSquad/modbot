const Discord = require("discord.js");
const games = require("../games");

const command = {
    data: {
        name: 'roles'
        , description: 'Allows you to select Game roles!'
    },
    execute(interaction) {
        const embed = new Discord.MessageEmbed()
                .setTitle("Game Roles!")
                .setDescription('Select a game role below then "Add Role" or "Remove Role" to manage your games.')
                .setColor(0x00FFFF);

        let options = games.map(x => {return {value: x.role, label: x.label, emoji: x.emoji}});

        let selectMenu = new Discord.MessageSelectMenu()
                .setCustomId("role-select")
                .addOptions(options)
                .setPlaceholder("Select games to add or remove!")
                .setMinValues(1)
                .setMaxValues(options.length);

        const row = new Discord.MessageActionRow()
                .addComponents(selectMenu);
        
        interaction.reply({content: ' ', embeds: [embed], components: [row], ephemeral: true});
    }
};

module.exports = command;