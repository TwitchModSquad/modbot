const {MessageEmbed, AttachmentBuilder, SlashCommandBuilder, SlashCommandStringOption, SlashCommandIntegerOption, SlashCommandNumberOption, SlashCommandBooleanOption, PermissionFlagsBits} = require("discord.js");

const con = require("../../database");

const errorEmbed = message => {
    return {embeds: [new MessageEmbed()
            .setTitle("Error:")
            .setDescription(message)
            .setColor(0xed3734)], ephemeral: true};
}

const formatDate = date => {
    return date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

const command = {
    data: new SlashCommandBuilder()
        .setName("chatdump")
        .setDescription("Dumps a chat log file following the given queries")
        .addStringOption(
            new SlashCommandStringOption()
                .setName("streamer")
                .setDescription("Search by streamer username")
                .setRequired(false)
                .setAutocomplete(true)
        )
        .addStringOption(
            new SlashCommandStringOption()
                .setName("user")
                .setDescription("Search by chatter username")
                .setRequired(false)
                .setAutocomplete(true)
        )
        .addNumberOption(
            new SlashCommandNumberOption()
                .setName("start")
                .setDescription("Relative start time for chat logs, in hours. Ex: 1 would search for anything less than 1 hour ago")
                .setRequired(false)
        )
        .addNumberOption(
            new SlashCommandNumberOption()
                .setName("end")
                .setDescription("Relative end time for chat logs, in hours. Ex: 1 would search for anything greater than 1 hour ago")
                .setRequired(false)
        )
        .addIntegerOption(
            new SlashCommandIntegerOption()
                .setName("limit")
                .setDescription("Maximum chat messages to be sent. Default/Maximum: 10,000/500,000")
                .setMinValue(1)
                .setMaxValue(500000)
                .setRequired(false)
        )
        .addBooleanOption(
            new SlashCommandBooleanOption()
                .setName("ephemeral")
                .setDescription("'True' if you only want the dump to be viewable by you. Default: True")
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false),
    global: false,
    /**
     * Called when this command is executed
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        let streamer = interaction.options.getString("streamer", false);
        let user = interaction.options.getString("user", false);
        let start = interaction.options.getNumber("start", false);
        let end = interaction.options.getNumber("end", false);
        let limit = interaction.options.getInteger("limit", false);

        let ephemeral = interaction.options.getBoolean("ephemeral", false);

        if (ephemeral === undefined || ephemeral === null) ephemeral = true;

        try {
            if (streamer) {
                let streamers = await global.api.Twitch.getUserByName(streamer);
                if (streamers.length > 0) {
                    streamer = streamers[0].id;
                } else {
                    throw "No users were found with that username!";
                }
            }
        } catch (err) {
            global.api.Logger.warning(err);
            interaction.reply(errorEmbed("Invalid streamer was given: " + err))
            return;
        }
        try {
            if (user) {
                let users = await global.api.Twitch.getUserByName(user);
                if (users.length > 0) {
                    user = users[0].id;
                } else {
                    throw "No users were found with that username!";
                }
            }
        } catch (err) {
            global.api.Logger.warning(err);
            interaction.reply(errorEmbed("Invalid user was given: " + err))
            return;
        }

        let queryWhere = "";
        let queryObjs = [];

        const add = (query, obj) => {
            if (queryWhere !== "") queryWhere += " and ";
            queryWhere += query;
            queryObjs = [
                ...queryObjs,
                obj,
            ]
        }

        if (streamer) {
            add("streamer_id = ?", streamer);
        }
        if (user) {
            add("user_id = ?", user);
        }
        if (start) {
            add("timesent > ROUND(UNIX_TIMESTAMP(CURTIME(4)) * 1000) - ?", start * 60 * 60 * 1000);
        }
        if (end) {
            add("timesent < ROUND(UNIX_TIMESTAMP(CURTIME(4)) * 1000) - ?", end   * 60 * 60 * 1000);
        }
        if (!limit) {
            limit = 500000;
        }

        queryObjs = [
            ...queryObjs,
            limit
        ];

        await interaction.deferReply({ephemeral: ephemeral});

        con.query(`select * from twitch__chat ${queryWhere === "" ? "" : "where "}${queryWhere} order by timesent desc${limit ? " limit ?" : ""};`, queryObjs, async (err, res) => {
            if (err) {
                global.api.Logger.warning(err);
                interaction.editReply(errorEmbed("An error occurred!"));
            }

            let str = "";

            let header = "= Chat Dump generated by " + interaction.user.username + "#" + interaction.user.discriminator + " on " + formatDate(new Date()) + " =";

            str += "=".repeat(header.length) + "\n" + header + "\n" + "=".repeat(header.length) + "\n\n";

            for (let i = 0; i < res.length; i++) {
                let log = res[i];
                let streamer = await global.api.Twitch.getUserById(log.streamer_id);
                let user = await global.api.Twitch.getUserById(log.user_id);
                str += formatDate(new Date(log.timesent)) + " [#" + streamer.display_name.toLowerCase() + "] " + user.display_name + ": " + log.message + "\n";
            }
            
            const attachment = new AttachmentBuilder(Buffer.from(str, 'utf-8'), {name: "dump-" + Date.now() + ".txt", description: "Chat history!", content_type: "text/plain"});
            
            interaction.editReply({ephemeral: ephemeral, files: [attachment]});
        });
    }
};

module.exports = command;