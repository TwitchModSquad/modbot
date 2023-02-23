const {EmbedBuilder, SlashCommandBuilder, SlashCommandUserOption, SlashCommandStringOption} = require("discord.js");
const FullIdentity = require("../../api/FullIdentity");
const DiscordGuild = require("../../api/Discord/DiscordGuild");

const errorEmbed = message => {
    return {embeds: [new EmbedBuilder()
            .setTitle("Error:")
            .setDescription(message)
            .setColor(0xed3734)], ephemeral: true};
}

const command = {
    data: new SlashCommandBuilder()
        .setName("register")
        .setDescription("Register your Discord server to Twitch Mod Squad")
        .addUserOption(
            new SlashCommandUserOption()
                .setName("represents-discord")
                .setDescription("Discord mention of the user this Discord represents")
                .setRequired(true)
        )
        .addStringOption(
            new SlashCommandStringOption()
                .setName("represents-twitch")
                .setDescription("Twitch name of the channel this Discord represents")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(8)
        .setDMPermission(false),
    global: false,
    execute(interaction) {
        if (interaction.member?.id === interaction.guild?.ownerId
            || interaction.member?.id === "267380687345025025") {
            global.api.Discord.getGuild(interaction.guild.id).then(() => {
                interaction.reply(errorEmbed("This guild has already been registered!"));
            }).catch(async err => {
                try {
                    let ownerDiscord = await global.api.Discord.getUserById(interaction.guild.ownerId, false, true);
                    
                    let representsDiscord = await global.api.Discord.getUserById(interaction.options.getUser("represents-discord").id);
                    let representsTwitch = await global.api.Twitch.getUserByName(interaction.options.getString("represents-twitch"), true);
                    if (representsTwitch.length > 0) {
                        representsTwitch = representsTwitch[0];
                    } else {
                        interaction.reply(errorEmbed("Represents twitch user was not found!"));
                        return;
                    }

                    let identity = null;
                    if (representsTwitch.identity?.id) identity = representsTwitch.identity;
                    if (representsDiscord.identity?.id) {
                        if (!(identity?.id) || identity.id == representsDiscord.identity.id) {
                            identity = representsDiscord.identity;
                        } else {
                            interaction.reply(errorEmbed("Represents twitch and discord user both exist with two separate identities...That doesn't work!"));
                            return;
                        }
                    }

                    if (identity?.id) {
                        identity = await global.api.getFullIdentity(identity.id);
                    } else {
                        identity = new FullIdentity(null, representsTwitch.display_name, false, false, false, [representsTwitch], [representsDiscord])
                        identity = await identity.post();
                    }

                    if (!identity.twitchAccounts.find(x => x.id = representsTwitch.id)) identity.twitchAccounts = [...identity.twitchAccounts, representsTwitch];
                    if (!identity.discordAccounts.find(x => x.id = representsDiscord.id)) identity.discordAccounts = [...identity.discordAccounts, representsDiscord];

                    let guild = new DiscordGuild(
                        interaction.guild.id,
                        identity,
                        ownerDiscord,
                        interaction.guild.name
                    );

                    guild.post().then(guild => {
                        guild.addCommands(interaction.guild).then(() => {}, global.api.Logger.warning);
                        interaction.reply({content: "Registered!", ephemeral: true})
                        interaction.command?.delete().then(() => {}, global.api.Logger.warning);
                    }).catch(err => {
                        global.api.Logger.warning(err);
                        interaction.reply(errorEmbed("An error occurred: " + err));
                    });
                } catch(err) {
                    global.api.Logger.warning(err);
                    interaction.reply(errorEmbed("An error occurred: " + err));
                }
            });
        } else {
            interaction.reply(errorEmbed("You are not the owner of this guild!"));
        }
    }
};

module.exports = command;