const { ButtonInteraction } = require("discord.js");
const api = require("../../../api/");

const {interactions} = require("../../commands/manage");
const FullIdentity = require("../../../api/FullIdentity");

const listener = {
    name: 'manageCreateIdentity',
    /**
     * Verifies a button press should be sent to this listener
     * @param {ButtonInteraction} interaction 
     */
    verify(interaction) {
        return interaction.component.customId.startsWith("id-create-");
    },
    /**
     * Listener for a button press
     * @param {ButtonInteraction} interaction 
     */
    async listener (interaction) {
        const user = await api.Discord.getUserById(interaction.user.id);

        if (!user.identity?.id) {
            interaction.error("You do not have permission to manage this user.");
            return;
        }

        let targetId = interaction.component.customId.split("-").pop();
        let target;

        try {
            target = await api.Twitch.getUserById(targetId);
        } catch(err) {
            api.Logger.warning(err);
        }

        if (!target) {
            interaction.error("Target could not be found.");
            return;
        }

        if (target.identity?.id) {
            interaction.error("User already has an identity!");
            return;
        }

        let targetIdentity;

        const updateInteraction = async () => {
            if (!interactions.hasOwnProperty(interaction.user.id)) return;
            if (!targetIdentity) return;

            try {
                const message = await targetIdentity.editEmbed(user.identity.admin);
                await interactions[interaction.user.id].editReply(message);
            } catch(err) {
                api.Logger.severe(err);
            }
        }

        try {
            targetIdentity = new FullIdentity(null, target.display_name, false, false, false, [target], []);
            await targetIdentity.post();
            await updateInteraction();

            interaction.success(`Identity has been created! \`${targetIdentity.id} - ${targetIdentity.name}\``);
        } catch(err) {
            api.Logger.severe(err);
            interaction.error(err);
        }
    }
};

module.exports = listener;