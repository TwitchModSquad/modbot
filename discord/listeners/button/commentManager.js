const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");
const api = require("../../../api/index");
const con = require("../../../database");

const getComments = async () => {
    const comments = (await con.pquery("select id, comment, emoji from comment order by comment asc;")).map(x => {
        return {
            label: x.comment,
            value: String(x.id),
            emoji: x.emoji,
        };
    });
    return comments;
}

const listener = {
    name: 'commentManager',
    getComments: getComments,
    /**
     * Verifies a button press should be sent to this listener
     * @param {ButtonInteraction} interaction 
     */
    verify(interaction) {
        return interaction.isButton() && interaction.component.customId.startsWith("comment-");
    },
    /**
     * Listener for a button press
     * @param {ButtonInteraction} interaction 
     */
    listener (interaction) {
        const handleError = (err, method = "reply") => {
            global.api.Logger.warning(err);
            interaction[method]({embeds: [new EmbedBuilder().setTitle("Uh oh!").setDescription(err).setColor(0x9e392f)], ephemeral: true})
        }

        api.Discord.getUserById(interaction.member.id, false, true).then(user => {
            if (user.identity?.id) {
                api.getFullIdentity(user.identity.id).then(async identity => {
                    const twitchUser = await api.Twitch.getUserById(interaction.component.customId.replace("comment-",""));

                    const comments = [
                        {
                            label: "Write a Comment",
                            value: "custom",
                            emoji: "📝",
                        },
                        ...(await getComments()),
                    ]

                    const embed = new EmbedBuilder()
                        .setTitle("Add a Mod Comment")
                        .setDescription(`Use the select menu below to add a pre-defined comment for \`${twitchUser.display_name}\`, or write your own!`)
                        .setColor(0x772ce8);

                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId(interaction.component.customId)
                        .setMinValues(1)
                        .setMaxValues(1)
                        .setPlaceholder("Select a comment, or write your own!")
                        .setOptions(comments);

                    interaction.reply({
                        ephemeral: true,
                        embeds: [embed],
                        components: [
                            new ActionRowBuilder()
                                .addComponents(selectMenu)
                        ]
                    });
                }).catch(err => handleError(err + ""));
            } else {
                handleError("You must link your account with TMS before you can use Crossban functions!\nAsk a user for an invite link.");
            }
        }).catch(handleError);
    }
};

module.exports = listener;