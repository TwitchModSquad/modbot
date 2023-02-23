const {EmbedBuilder, SlashCommandBuilder, ChatInputCommandInteraction} = require("discord.js");
const api = require("../../api/index");
const con = require("../../database");

const command = {
    data: new SlashCommandBuilder()
        .setName("invite")
        .setDescription("Sends a link to DM to others"),
    /**
     * Execution function for this command
     * @param {ChatInputCommandInteraction} interaction 
     */
    execute(interaction) {
        let code = api.stringGenerator(6);

        api.Discord.getUserById(interaction.user.id, false, true).then(discordAccount => {
            if (discordAccount.identity?.id) {
                con.query("insert into invite (invite, initiated_by, expiry) values (?, ?, date_add(now(), interval 1 hour));", [code, discordAccount.identity.id], () => {
                    const embed = new EmbedBuilder()
                        .setTitle("Invite Link")
                        .setDescription(`Send this link to invite your friends to TMSQD!\n\nhttps://join.tms.to/${code}\n\n**Do not allow others to use this link to invite others. This link will expire in 1 hour.**`)
                        .setColor(0x772ce8);

                    interaction.reply({embeds: [embed], ephemeral: true});
                });
            } else {
                const embed = new EmbedBuilder()
                    .setTitle("You must be linked in order to generate a code!")
                    .setDescription("Ask an administrator or other user for a link to TMSQD.")
                    .setColor(0x772ce8);
    
                interaction.reply({embeds: [embed], ephemeral: true});
            }
        }).catch(error => {
            const embed = new EmbedBuilder()
                .setTitle("Invite Generation Error!")
                .setDescription(`Error: ${error}`)
                .setColor(0x772ce8);

            interaction.reply({embeds: [embed], ephemeral: true});
        });
    }
};

module.exports = command;