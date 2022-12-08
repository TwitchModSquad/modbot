const { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
const api = require("../../api/index");
const con = require("../../database");

const config = require("../../config.json");

let commands = [];

const {twitchCommands} = require("../../twitch/listeners/commandListener");

for (const name in twitchCommands) {
    commands = [
        ...commands,
        {
            name: name,
            value: name,
        }
    ]
}

const command = {
    data: {
        name: 'command'
        , description: 'Manage TMS-hosted commands in streamer chats'
        , options: [
            {
                type: 1,
                name: "enable",
                description: "Enable a TMS-hosted command in a streamer's channel",
                options: [
                    {
                        type: 3,
                        name: "streamer",
                        description: "Streamer to enable the command in",
                        required: true,
                        autocomplete: true,
                    },
                    {
                        type: 3,
                        name: "command",
                        description: "The command to enable",
                        required: true,
                        choices: commands,
                    },
                    {
                        type: 3,
                        name: "label",
                        description: "The command label to use for this streamer, WITH a prefix. Ex: '!group'",
                        required: true,
                    },
                ],
            },
            {
                type: 1,
                name: "disable",
                description: "Disable a TMS-hosted command in a streamer's channel",
                options: [
                    {
                        type: 3,
                        name: "streamer",
                        description: "Streamer to disable the command in",
                        required: true,
                        autocomplete: true,
                    },
                    {
                        type: 3,
                        name: "label",
                        description: "The command label to disable",
                        required: true,
                        autocomplete: true,
                    },
                ],
            },
        ]
    },
    async execute(interaction) {
        let subcommand = interaction.options.getSubcommand(true);

        
        const streamerString = interaction.options.getString("streamer", true);
        const label = interaction.options.getString("label", true);

        api.Twitch.getUserByName(streamerString).then(streamer => {
            streamer = streamer[0];
            api.Discord.getUserById(interaction.user.id).then(user => {
                if (user.identity?.id) {
                    api.getFullIdentity(user.identity.id).then(identity => {
                        identity.getActiveModeratorChannels().then(streamers => {
                            if (!identity.twitchAccounts.find(x => x.id === streamer.id)
                                    && !identity.mod && !identity.admin) {
                                let authenticated = false;
                                let authenticatedFor = "";
                                for (let i = 0; i < streamers.length; i++) {
                                    for (let ti = 0; ti < streamers[i].modForIdentity.twitchAccounts.length; ti++) {
                                        let streamerTwitch = streamers[i].modForIdentity.twitchAccounts[ti];
                                        if (streamer.id === streamerTwitch.id) {
                                            authenticated = true;
                                            break;
                                        }
                                        authenticatedFor += "\n" + streamerTwitch.display_name;
                                    }
                                    if (authenticated) break;
                                }
                                if (!authenticated) {
                                    interaction.error(`You're not allowed to edit commands under \`${streamer.display_name}\`!\n**Allowed channels:**\n\`\`\`${authenticatedFor}\`\`\``);
                                    return;
                                }
                            }

                            if (subcommand === "enable") {;
                                const command = interaction.options.getString("command", true);
                
                                api.Twitch.addStreamerCommand(streamer, command, label).then(commands => {
                                    let activeCommands = "";
                                    commands.forEach(command => {
                                        activeCommands += `\n${command.command} -> ${command.referencedCommand}`;
                                    })
                                    interaction.success("Successfully added command `" + label + "`! Active commands in `" + streamer.display_name + "`:```" + activeCommands + "```")
                                }, interaction.error);
                            } else if (subcommand === "disable") {
                                api.Twitch.removeStreamerCommand(streamer, label).then(commands => {
                                    let activeCommands = "";
                                    commands.forEach(command => {
                                        activeCommands += `\n${command.command} -> ${command.referencedCommand}`;
                                    })
                                    interaction.success("Successfully removed command `" + label + "`! Active commands in `" + streamer.display_name + "`:```" + activeCommands + "```")
                                }, interaction.error);
                            }
                        })
                    }, err => {
                        api.Logger.warning(err);
                        interaction.error("You are not properly linked to TMS!");
                    })
                } else {
                    interaction.error("You are not properly linked to TMS!");
                }
            }, err => {
                api.Logger.warning(err);
                interaction.error("You are not properly linked to TMS!");
            })
        }, err => {
            api.Logger.warning(err);
            interaction.error("Streamer by the name of `" + streamerString + "` was not found!");
        });
    }
};

module.exports = command;