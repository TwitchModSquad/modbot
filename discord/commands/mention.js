const { EmbedBuilder, SlashCommandBuilder, SlashCommandStringOption, SlashCommandBooleanOption, ChatInputCommandInteraction } = require("discord.js");
const api = require("../../api/index");

const command = {
    data: new SlashCommandBuilder()
        .setName("mention")
        .setDescription("Mention moderators of a specific channel or channels")
        .addBooleanOption(
            new SlashCommandBooleanOption()
                .setName("mention-streamer")
                .setDescription("Whether the streamer in question should be mentioned or not")
                .setRequired(true)
        )
        .addStringOption(
            new SlashCommandStringOption()
                .setName("streamer-1")
                .setDescription("Streamer's twitch name to mention")
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(
            new SlashCommandStringOption()
                .setName("streamer-2")
                .setDescription("Streamer's twitch name to mention")
                .setAutocomplete(true)
        )
        .addStringOption(
            new SlashCommandStringOption()
                .setName("streamer-3")
                .setDescription("Streamer's twitch name to mention")
                .setAutocomplete(true)
        )
        .addStringOption(
            new SlashCommandStringOption()
                .setName("streamer-4")
                .setDescription("Streamer's twitch name to mention")
                .setAutocomplete(true)
        )
        .addStringOption(
            new SlashCommandStringOption()
                .setName("streamer-5")
                .setDescription("Streamer's twitch name to mention")
                .setAutocomplete(true)
        ),
    /**
     * Execution function for this command
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        const handleError = err => {
            interaction.reply({embeds: [new EmbedBuilder().setTitle(err).setColor(0x9e392f)], ephemeral: true})
        }

        const streamer1 = interaction.options.getString("streamer-1");
        const streamer2 = interaction.options.getString("streamer-2");
        const streamer3 = interaction.options.getString("streamer-3");
        const streamer4 = interaction.options.getString("streamer-4");
        const streamer5 = interaction.options.getString("streamer-5");

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

        let embed = new EmbedBuilder()
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