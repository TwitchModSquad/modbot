const client = global.client.mbm;

const listener = {
    name: 'commandManager',
    eventName: 'interactionCreate',
    eventType: 'on',
    listener (interaction) {
        if (!interaction.isCommand()) return;
    
        if (!client.commands.has(interaction.commandName)) return;

        const success = message => {
            const embed = new EmbedBuilder()
                .setTitle("Success!")
                .setDescription(message)
                .setColor(0x772ce8);

            interaction.reply({embeds: [embed], ephemeral: true})
        }

        const error = message => {
            const embed = new EmbedBuilder()
                .setTitle("Error!")
                .setDescription(message)
                .setColor(0xe83b3b);

            interaction.reply({embeds: [embed], ephemeral: true})
        }

        interaction.success = success;
        interaction.error = error;
    
        let cmd = client.commands.get(interaction.commandName);
        try {
            cmd.execute(interaction);
        } catch (error) {
            global.api.Logger.warning(error);
            interaction.reply('***There was an error trying to execute that command!***');
        }
    }
};

module.exports = listener;