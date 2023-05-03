const {MessageEmbed} = require("discord.js");

const errorEmbed = message => {
    return {content: ' ', embeds: [new MessageEmbed()
            .setTitle("Error:")
            .setDescription(message)
            .setColor(0xed3734)], ephemeral: true};
}

const command = {
    data: {
        name: 'user'
        , description: 'View user data or a Twitch or Discord user'
        , options: [
            {
                type: 3,
                name: "twitch",
                description: "Search by Twitch username",
                required: false,
                autocomplete: true,
            },
            {
                type: 6,
                name: "discord",
                description: "Search by Discord mention",
                required: false,
            },
            {
                type: 4,
                name: "identity",
                description: "Search by TMS Identity ID",
                required: false,
            },
        ]
        , default_permission: false
    },
    global: false,
    execute(interaction) {
        if (interaction.guildId) {
            global.api.Discord.getGuild(interaction.guildId).then(async guild => {
                try {
                    let embeds = [];

                    const loadIdentity = async id => {
                        try {
                            let identity = await global.api.getFullIdentity(id);
                            if (identity) {
                                embeds = [
                                    ...embeds,
                                    ...await identity.discordEmbed()
                                ];
                            }
                        } catch (err) {}
                    }

                    if (interaction.options.getString("twitch")) {
                        try {
                            let users = await global.api.Twitch.getUserByName(interaction.options.getString("twitch"));
                            for (let i = 0; i < users.length; i++) {
                                if (users[i].identity?.id) {
                                    await loadIdentity(users[i].identity.id);
                                } else {
                                    embeds = [
                                        ...embeds,
                                        await users[i].discordEmbed()
                                    ];
                                }
                            }
                        } catch (err) {}
                    }
                    if (interaction.options.getUser("discord")) {
                        try {
                            let user = await global.api.Discord.getUserById(interaction.options.getUser("discord").id);

                            if (user.identity?.id) {
                                await loadIdentity(user.identity.id);
                            } else if (user) {
                                embeds = [
                                    ...embeds,
                                    await user.discordEmbed()
                                ];
                            }
                        } catch (err) {}
                    }
                    if (interaction.options.getInteger("identity")) {
                        await loadIdentity(interaction.options.getInteger("identity"));
                    }

                    if (embeds.length === 0) {
                        embeds = [
                            errorEmbed("No users were found with this query!"),
                        ];
                    }

                    interaction.reply({content: ' ', embeds: embeds, ephemeral: true});
                } catch (err) {
                    global.api.Logger.warning(err);
                    interaction.reply(errorEmbed(err.toString()));
                }
            }).catch(err => {global.api.Logger.warning(err);interaction.reply(errorEmbed("" + err));});
        } else {
            interaction.reply(errorEmbed("Command must be sent in a guild"));
        }
    }
};

module.exports = command;