import {Client, Collection, Events, GatewayIntentBits, MessageFlags} from "discord.js";
import {logger, PublicStats} from "@modbot/utils";

import {InteractionListener, InteractionListenerType, TwineCommand} from "./interfaces";
import {ReplyManager, TwineInteraction} from "./classes";

import registerCommands from "./registerCommands";

import rawSlashCommands from "./slashCommands";
import {interactionListeners, rawListeners} from "./listeners";
import eventManager from "@modbot/utils/dist/managers/events/EventManager";

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
                flags: [MessageFlags.Ephemeral],
            });
        }
        return;
    }

    async function tryListener<T extends TwineInteraction>(listener: InteractionListener<T>, interaction: T) {
        try {
            if (listener.matches(interaction)) {
                await listener.execute(interaction, new ReplyManager<T>(interaction));
            }
        } catch (error) {
            logger.error(error);
            await interaction.reply({
                content: "An unexpected error occurred while executing this command! Try again later.",
                flags: [MessageFlags.Ephemeral],
            });
        }
    }

    for (const listener of interactionListeners) {
        if (interaction.isButton() &&
            listener.type === InteractionListenerType.BUTTON) {
            await tryListener(listener, interaction);
        } else if (interaction.isStringSelectMenu() &&
            listener.type === InteractionListenerType.STRING_SELECT_MENU) {
            await tryListener(listener, interaction);
        } else if (interaction.isModalSubmit() &&
            listener.type === InteractionListenerType.MODAL) {
            await tryListener(listener, interaction);
        }
    }
});

eventManager.register("stats:request", async (): Promise<Partial<PublicStats>> => {
    const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
    return {
        discordMembers: guild?.memberCount ?? 0,
    };
});

client.login(discordToken).catch(e => logger.error(e));

registerCommands(slashCommands).catch(e => logger.error(e));

import("./events");

export default client;
