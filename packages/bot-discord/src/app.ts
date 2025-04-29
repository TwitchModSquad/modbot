import {Client, Collection, Events, GatewayIntentBits} from "discord.js";
import {logger} from "@modbot/utils";

import {TwineCommand} from "./interfaces";
import {ReplyManager} from "./classes";

import registerCommands from "./registerCommands";

import rawSlashCommands from "./slashCommands";
import {rawListeners} from "./listeners";

const slashCommands = new Collection<string, TwineCommand>();
for (const slashCommand of rawSlashCommands) {
    slashCommands.set(slashCommand.data.name, slashCommand);
}

const discordToken = process.env.DISCORD_MODBOT_TOKEN;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
    ],
});

logger.info(`Registering ${rawListeners.length} listener(s) and ${slashCommands.size} command(s)`)
for (const listener of rawListeners) {
    client[listener.type ?? "on"](listener.event, (...args) => listener.execute(...args));
}

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = slashCommands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction, new ReplyManager(interaction));
        } catch (error) {
            logger.error(error);
            await interaction.reply({
                content: "An unexpected error occurred while executing this command! Try again later.",
                ephemeral: true,
            });
        }
    }
});

client.login(discordToken).catch(e => logger.error(e));

registerCommands(slashCommands).catch(e => logger.error(e));

import("./events");

export default client;
