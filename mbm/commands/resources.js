const {EmbedBuilder, SlashCommandBuilder} = require("discord.js");
const resources = require("./resources.json");

const command = {
    data: new SlashCommandBuilder()
        .setName("resources")
        .setDescription("View resources for suicide, sexual assault, domestic violence, and more."),
    global: true,
    /**
     * Called when this command is executed
     * @param {CommandInteraction} interaction 
     */
    execute(interaction) {
        let embed = new EmbedBuilder()
            .setTitle("National Hotlines")
            .setURL("https://victimconnect.org/resources/national-hotlines/")
            .setColor(0x2170d1);

        resources.forEach(resourceGroup => {
            let links = "";
            resourceGroup.links.forEach(link => {
                if (links !== "") links += "\n";
                links += `[${link.name}](${link.url}) - ${link.hotline}`;
            });
            embed.addFields({
                name: resourceGroup.name,
                value: links,
                inline: false,
            })
        });

        interaction.reply({embeds: [embed], ephemeral: true})
    }
};

module.exports = command;