const { ModalBuilder, ActionRowBuilder, TextInputBuilder } = require("@discordjs/builders");
const { SlashCommandBuilder, PermissionFlagsBits, SlashCommandStringOption, SlashCommandSubcommandBuilder, ChatInputCommandInteraction, TextInputStyle, RoleSelectMenuBuilder} = require("discord.js");

const listeners = {
    live: {
        name: "[Twitch] Livestream Started",
        /**
         * Called when this listener is added
         * @param {ChatInputCommandInteraction} interaction 
         */
        create(interaction) {
            const usernames = new TextInputBuilder()
                .setCustomId("usernames")
                .setLabel("Twitch Usernames")
                .setPlaceholder("Place a new name on each line")
                .setMinLength(3)
                .setMaxLength(512)
                .setRequired(true)
                .setStyle(TextInputStyle.Paragraph);

            const modal = new ModalBuilder()
                .setCustomId("listener-live")
                .setTitle("Add a Livestream Listener")
                .addComponents(
                    new ActionRowBuilder().addComponents(usernames)
                );

            interaction.showModal(modal)
                .catch(global.api.Logger.warning);
        },
    },
    twitchBan: {
        name: "[Twitch] Twitch Ban",
        /**
         * Called when this listener is added
         * @param {ChatInputCommandInteraction} interaction 
         */
        create(interaction) {
            const usernames = new TextInputBuilder()
                .setCustomId("usernames")
                .setLabel("Twitch Channels")
                .setPlaceholder("Place a new name on each line")
                .setMinLength(3)
                .setMaxLength(512)
                .setRequired(true)
                .setStyle(TextInputStyle.Paragraph);

            const modal = new ModalBuilder()
                .setCustomId("listener-twitchban")
                .setTitle("Add a Twitch ban listener")
                .addComponents(
                    new ActionRowBuilder().addComponents(usernames)
                );

            interaction.showModal(modal)
                .catch(global.api.Logger.warning);
        },
    },
    memberUpdate: {
        name: "[Discord] Member Update (Nicknames)",
        /**
         * Called when this listener is added
         * @param {ChatInputCommandInteraction} interaction 
         */
        create(interaction) {
            interaction.guildApi.addListener(interaction.channel, "memberUpdate", null).then(listener => {
                interaction.success("Created new listener!");
            }, err => {
                global.api.Logger.warning(err);
                interaction.error("Unable to add listener!");
            });
        },
    },
    messageDelete: {
        name: "[Discord] Message Delete (Bulk & Normal)",
        /**
         * Called when this listener is added
         * @param {ChatInputCommandInteraction} interaction 
         */
        create(interaction) {
            interaction.guildApi.addListener(interaction.channel, "messageDelete", null).then(listener => {
                interaction.success("Created new listener!");
            }, err => {
                global.api.Logger.warning(err);
                interaction.error("Unable to add listener!");
            });
        },
    },
    messageEdit: {
        name: "[Discord] Message Edit",
        /**
         * Called when this listener is added
         * @param {ChatInputCommandInteraction} interaction 
         */
        create(interaction) {
            interaction.guildApi.addListener(interaction.channel, "messageEdit", null).then(listener => {
                interaction.success("Created new listener!");
            }, err => {
                global.api.Logger.warning(err);
                interaction.error("Unable to add listener!");
            });
        },
    },
    userBan: {
        name: "[Discord] User Ban & Unban",
        /**
         * Called when this listener is added
         * @param {ChatInputCommandInteraction} interaction 
         */
        create(interaction) {
            interaction.guildApi.addListener(interaction.channel, "userBan", null).then(listener => {
                interaction.success("Created new listener!");
            }, err => {
                global.api.Logger.warning(err);
                interaction.error("Unable to add listener!");
            });
        },
    },
    userKick: {
        name: "[Discord] User Kick",
        /**
         * Called when this listener is added
         * @param {ChatInputCommandInteraction} interaction 
         */
        create(interaction) {
            interaction.guildApi.addListener(interaction.channel, "userKick", null).then(listener => {
                interaction.success("Created new listener!");
            }, err => {
                global.api.Logger.warning(err);
                interaction.error("Unable to add listener!");
            });
        },
    },
    userLeave: {
        name: "[Discord] User Leave",
        /**
         * Called when this listener is added
         * @param {ChatInputCommandInteraction} interaction 
         */
        create(interaction) {
            interaction.guildApi.addListener(interaction.channel, "userLeave", null).then(listener => {
                interaction.success("Created new listener!");
            }, err => {
                global.api.Logger.warning(err);
                interaction.error("Unable to add listener!");
            });
        },
    },
};

let listenerChoices = [];

for (const value in listeners) {
    listenerChoices = [
        ...listenerChoices,
        {
            name: listeners[value].name,
            value: value,
        }
    ]
}

const command = {
    data: new SlashCommandBuilder()
        .setName("listener")
        .setDescription("Create/delete a listener in the current channel for an event")
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName("create")
                .setDescription("Create a listener in the current channel for an event")
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("name")
                        .setDescription("The name of the listener to add")
                        .setChoices(...listenerChoices)
                        .setRequired(true)
                )
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName("delete")
                .setDescription("Delete a listener in the current channel")
                .addStringOption(
                    new SlashCommandStringOption()
                        .setName("listener")
                        .setDescription("The listener to remove")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false),
    global: false,
    listeners: listeners,
    /**
     * Called when this command is executed
     * @param {ChatInputCommandInteraction} interaction 
     */
    execute(interaction) {
        const subcommand = interaction.options.getSubcommand(true);

        global.api.Discord.getGuild(interaction.guild.id).then(guild => {
            interaction.guildApi = guild;
            if (subcommand === "create") {
                let listener = interaction.options.getString("name", true);
    
                if (listener in listeners) {
                    try {
                        listeners[listener].create(interaction);
                    } catch(err) {
                        global.api.Logger.warning(err);
                        interaction.error("An error occurred!");
                    }
                } else {
                    interaction.error(`Listener was not found with name \`${listener}\`!`);
                }
            } else if (subcommand === "delete") {
                let id = Number(interaction.options.getString("listener", true));

                let listener = guild.listeners.find(x => x.id === id)

                if (listener) {
                    guild.removeListener(listener).then(() => {
                        interaction.success(`The listener of type \`${listeners[listener.event].name}\` was deleted (ID #${listener.id})`)
                    }, err => {
                        console.error(err);
                        interaction.error("An error occurred!");
                    });
                } else {
                    interaction.error("Could not resolve listener by ID");
                }
            }
        }, err => {
            global.api.Logger.warning(err);
            interaction.error("Unable to get guild");
        });
    }
};

module.exports = command;