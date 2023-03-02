const {EmbedBuilder, SlashCommandBuilder, SlashCommandStringOption, PermissionFlagsBits} = require("discord.js");
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
        .addStringOption(
            new SlashCommandStringOption()
                .setName("twitch")
                .setDescription("Twitch name of the channel this Discord represents")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),
    global: false,
    /**
     * Called when this command is executed
     * @param {ChatInputCommandInteraction} interaction 
     */
    execute(interaction) {
        global.api.Discord.getGuild(interaction.guild.id).then(() => {
            interaction.error("This guild has already been registered!");
        }).catch(async err => {
            try {
                let ownerDiscord = await global.api.Discord.getUserById(interaction.guild.ownerId, false, true);
                
                let representsDiscord = await global.api.Discord.getUserById(interaction.user.id);
                let representsTwitch = await global.api.Twitch.getUserByName(interaction.options.getString("twitch"), true);
                if (representsTwitch.length > 0) {
                    representsTwitch = representsTwitch[0];
                } else {
                    interaction.error("Represents twitch user was not found!");
                    return;
                }

                let identity = null;
                if (representsTwitch.identity?.id) identity = representsTwitch.identity;
                if (representsDiscord.identity?.id) {
                    if (!(identity?.id) || identity.id == representsDiscord.identity.id) {
                        identity = representsDiscord.identity;
                    } else {
                        interaction.error("Represents twitch and discord user both exist with two separate identities...That doesn't work!");
                        return;
                    }
                }

                if (identity?.id) {
                    identity = await global.api.getFullIdentity(identity.id);
                } else {
                    interaction.error("The Twitch and Discord accounts have not been authenticated together!\nPlease have a TMS moderator generate an invite link and try again.");
                    return;
                }
                    
                if (!identity?.authenticated) {
                    interaction.error("The identities exist together, but the combination has not been authenticated using TMS!\nPlease have a moderator generate an invite link and try again.");
                    return;
                }

                authed = false;
                for (let i = 0; i < identity.twitchAccounts.length; i++) {
                    const acc = identity.twitchAccounts[i];

                    if (acc.affiliation === "partner" || acc.follower_count >= 5000) {
                        authed = true;
                        break;
                    }
                }

                if (!authed) {
                    interaction.error("Twitch account does not meet TMS streamer requirements.\n(Over 5000 followers or partnership)");
                    return;
                }

                let guild = new DiscordGuild(
                    interaction.guild.id,
                    identity,
                    ownerDiscord,
                    interaction.guild.name
                );

                guild.post().then(guild => {
                    guild.addCommands(interaction.guild).then(() => {}, global.api.Logger.warning);
                    interaction.success(`The guild \`${interaction.guild.name}\` has been successfully registered!`);
                    interaction.command?.delete().then(() => {}, global.api.Logger.warning);
                }).catch(err => {
                    global.api.Logger.warning(err);
                    interaction.error("An error occurred: " + err);
                });
            } catch(err) {
                global.api.Logger.warning(err);
                interaction.error("An error occurred: " + err);
            }
        });
    }
};

module.exports = command;