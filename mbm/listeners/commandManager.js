const client = global.client.mbm;

const listener = {
    name: 'commandManager',
    eventName: 'interactionCreate',
    eventType: 'on',
    listener (interaction) {
        if (!interaction.isCommand()) return;
    
        if (!client.commands.has(interaction.commandName)) return;
    
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