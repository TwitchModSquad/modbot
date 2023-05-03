const {MessageEmbed} = require("discord.js");
const resources = require("./resources.json");

const command = {
    data: {
        name: 'resources'
        , description: 'View resources for suicide, sexual assault, domestic violence, and more.'
    },
    global: true,
    execute(interaction) {
        let embed = new MessageEmbed()
            .setTitle("National Hotlines")
            .setURL("https://victimconnect.org/resources/national-hotlines/")
            .setColor(0x2170d1);

        resources.forEach(resourceGroup => {
            let links = "";
            resourceGroup.links.forEach(link => {
                if (links !== "") links += "\n";
                links += `[${link.name}](${link.url}) - ${link.hotline}`;
            });
            embed.addField(resourceGroup.name, links, false);
        });

        interaction.reply({content: ' ', embeds: [embed], ephemeral: true})
    }
};

module.exports = command;