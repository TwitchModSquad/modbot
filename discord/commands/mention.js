const Discord = require("discord.js");
const api = require("../../api/index");

const command = {
    data: {
        name: 'mention'
        , description: 'Mention moderators of a specific channel or channel.'
        , options: [
            {
                type: 5,
                name: "mention-streamer",
                description: "Whether the Streamer in question should be mentioned or not",
                required: true,
            },
            {
                type: 3,
                name: "streamer1",
                description: "Streamer's Twitch name to mention",
                autocomplete: true,
                required: true,
            },
            {
                type: 3,
                name: "streamer2",
                description: "Streamer's Twitch name to mention",
                autocomplete: true,
            },
            {
                type: 3,
                name: "streamer3",
                description: "Streamer's Twitch name to mention",
                autocomplete: true,
            },
            {
                type: 3,
                name: "streamer4",
                description: "Streamer's Twitch name to mention",
                autocomplete: true,
            },
            {
                type: 3,
                name: "streamer5",
                description: "Streamer's Twitch name to mention",
                autocomplete: true,
            },
        ]
    },
    async execute(interaction) {
        const handleError = err => {
            interaction.reply({content: ' ', embeds: [new Discord.MessageEmbed().setTitle(err).setColor(0x9e392f)], ephemeral: true})
        }

        const streamer1 = interaction.options.getString("streamer1");
        const streamer2 = interaction.options.getString("streamer2");
        const streamer3 = interaction.options.getString("streamer3");
        const streamer4 = interaction.options.getString("streamer4");
        const streamer5 = interaction.options.getString("streamer5");

        const mentionStreamer = interaction.options.getBoolean("mention-streamer");

        let streamers = [streamer1];

        if (streamer2) streamers = [...streamers, streamer2];
        if (streamer3) streamers = [...streamers, streamer3];
        if (streamer4) streamers = [...streamers, streamer4];
        if (streamer5) streamers = [...streamers, streamer5];

        let mentionString = "";

        let i;
        for (i = 0; i < streamers.length; i++) {
            let streamer;
            try {
                streamer = (await api.Twitch.getUserByName(streamers[i]))[0];
                streamers[i] = streamer;
            } catch (e) {
                try {
                    streamer = await api.Twitch.getUserById(streamers[i]);
                    streamers[i] = streamer;
                } catch (e) {
                    handleError(`User \`${streamers[i]}\` was not found!`);
                    return;
                }
            }

            if (mentionStreamer && streamer?.identity?.id) {
                let identity = await api.getFullIdentity(streamer.identity.id);
                identity.discordAccounts.forEach(discordAccount => {
                    mentionString += `<@${discordAccount.id}> `;
                });
            }
        }

        let allMods = [];

        for (i = 0; i < streamers.length; i++) {
            let twitchMods = await streamers[i].getMods();
            let mods = [];
            for (let tm = 0; tm < twitchMods.length; tm++) {
                if (twitchMods[tm].identity?.id) {
                    let identity = await api.getFullIdentity(twitchMods[tm].identity.id);
                    identity.discordAccounts.forEach(discordAccount => {
                        mods = [
                            ...mods,
                            discordAccount
                        ];
                        mentionString += `<@${discordAccount.id}> `;
                    });
                }
            }
            allMods[i] = mods;
        }

        if (mentionString === "") {
            handleError("No mods were mentioned");
            return;
        }

        let embed = new Discord.MessageEmbed()
                .setTitle("Mention Users")
                .setDescription(`The following ${mentionStreamer ? "streamers and their " : ""}moderators were mentioned.`)
                .setColor(0xa970ff);

        streamers.forEach((streamer, index) => {
            let modString = "";
            allMods[index].forEach(mod => {
                if (modString !== "") modString += "\n";
                modString += `<@${mod.id}>`;
            });
            embed.addField(streamer.display_name, modString, true);
        });

        interaction.reply({content: mentionString, embeds: [embed]});
    }
};

module.exports = command;