const con = require("../database");

const {EmbedBuilder, codeBlock, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle} = require("discord.js");

const Identity = require("./Identity");

const TwitchUser = require("./Twitch/TwitchUser");
const DiscordUser = require("./Discord/DiscordUser");

const ModeratorLink = require("./ModeratorLink");

/**
 * Represents a full user identity, including Twitch and Discord accounts.
 * 
 * @extends Identity
 */
class FullIdentity extends Identity {

    /**
     * List of all twitch accounts connected to this identity
     * @type {TwitchUser[]}
     */
    twitchAccounts;

    /**
     * List of all discord accounts connected to this identity
     * @type {DiscordUser[]}
     */
    discordAccounts;

    /**
     * Avatar URL determined for this identity
     * @type {string}
     */
    avatar_url;

    /**
     * Main constructor for a full identity
     * @param {number} id 
     * @param {string} name 
     * @param {boolean} authenticated
     * @param {boolean} admin
     * @param {boolean} mod
     * @param {TwitchUser[]} twitchAccounts 
     * @param {DiscordUser[]} discordAccounts 
     */
    constructor(id, name, authenticated, admin, mod, twitchAccounts, discordAccounts) {
        super(id, name, authenticated, admin, mod);

        this.twitchAccounts = twitchAccounts;
        this.discordAccounts = discordAccounts;

        if (this.twitchAccounts.length > 0) {
            this.avatar_url = this.twitchAccounts[0].profile_image_url;
        }

        this.discordAccounts.every(discordAccount => {
            if (discordAccount.avatar) {
                this.avatar_url = discordAccount.getAvatar();
                return false;
            }
            return true;
        });
    }

    /**
     * Gets a list of moderators that moderate for this user
     * @returns {Promise<ModeratorLink[]>}
     */
    getActiveModerators() {
        return new Promise((resolve, reject) => {
            con.query("select identity_id, active from identity__moderator where modfor_id = ?;", [this.id], async (err, res) => {
                if (!err) {
                    let result = [];
                    for (let i = 0; i < res.length; i++) {
                        try {
                            let link = new ModeratorLink(this, await api.getFullIdentity(res[i].identity_id), res[i].active == 1 ? true : false);
                            result = [
                                ...result,
                                link,
                            ];
                        } catch (e) {
                            global.api.Logger.warning(e);
                        }
                    }
                    resolve(result);
                } else {
                    reject(err);
                }
            });
        });
    }

    /**
     * Gets a list of user identities that this user moderates
     * @returns {Promise<ModeratorLink[]>}
     */
    getActiveModeratorChannels() {
        return new Promise((resolve, reject) => {
            con.query("select modfor_id, active from identity__moderator where identity_id = ?;", [this.id], async (err, res) => {
                if (!err) {
                    let result = [];
                    for (let i = 0; i < res.length; i++) {
                        try {
                            let link = new ModeratorLink(await api.getFullIdentity(res[i].modfor_id), this, res[i].active == 1 ? true : false);
                            result = [
                                ...result,
                                link,
                            ];
                        } catch (e) {
                            global.api.Logger.warning(e);
                        }
                    }
                    resolve(result);
                } else {
                    reject(err);
                }
            });
        });
    }

    /**
     * Generated a Discord Embed for the user.
     * 
     * @param {boolean} admin
     * @returns {Promise<EmbedBuilder[]>}
     */
    discordEmbed(admin = false) {
        return new Promise(async (resolve, reject) => {
            const moderatorIn = await this.getActiveModeratorChannels();

            let embeds = [];

            const identityEmbed = new EmbedBuilder()
                    .setAuthor({name: this.name, iconURL: this.avatar_url, url: this.getShortlink()})
                    .setDescription(this.name)
                    .setFooter({text: "TMS Identity #" + this.id, iconURL: "https://tms.to/assets/images/logos/logo.webp"})
                    .setThumbnail(this.avatar_url)
                    .setColor(0x772ce8);

            if (admin) {
                identityEmbed.setDescription(codeBlock(`Is Admin: ${this.admin ? "true" : "false"}\nIs Mod: ${this.mod ? "true" : "false"}\nIs Authenticated: ${this.authenticated ? "true" : "false"}`));
            }

            embeds = [identityEmbed];

            let moderatorInStr = "";
            moderatorIn.forEach(modLink => {
                if (moderatorInStr !== "") moderatorInStr += "\n";

                moderatorInStr += "**"+modLink.modForIdentity.name+"**";

                if (modLink.modForIdentity.twitchAccounts.length > 0)
                    moderatorInStr += " - [Profile](https://twitch.tv/" + modLink.modForIdentity.twitchAccounts[0].login + ")";

                if (modLink.modForIdentity.discordAccounts.length > 0)
                    moderatorInStr += ` - <@${modLink.modForIdentity.discordAccounts[0].id}>`;
            });

            if (moderatorInStr !== "") {
                identityEmbed.addFields({name: "Moderates For", value: moderatorInStr, inline: false});
            }

            for (let di = 0; di < this.discordAccounts.length; di ++) {
                embeds = [
                    ...embeds,
                    await this.discordAccounts[di].discordEmbed(),
                ]
            }

            for (let ti = 0; ti < this.twitchAccounts.length; ti ++) {
                embeds = [
                    ...embeds,
                    await this.twitchAccounts[ti].discordEmbed(),
                ]
            }

            resolve(embeds);
        });
    }

    /**
     * Returns the edit embeds and action rows for this Identity
     * @param {boolean} admin
     * @returns {Promise<{embeds: EmbedBuilder[], components: ActionRowBuilder[], ephemeral: true}>}
     */
    editEmbed(admin = false) {
        return new Promise(async (resolve, reject) => {
            try {
                const embeds = await this.discordEmbed(true);
                const removeTwitch = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId("id-rt-" + this.id)
                            .setPlaceholder("Remove Twitch Users")
                            .setMinValues(1)
                            .setMaxValues(Math.max(this.twitchAccounts.length, 1))
                            .setDisabled(this.twitchAccounts.length === 0)
                            .setOptions(
                                this.twitchAccounts.length > 0 ? this.twitchAccounts.map(x => {
                                    return {
                                        label: x.display_name,
                                        value: String(x.id),
                                    };
                                }) : [{label: "none", value: "none"}]
                            )
                    );
                const removeDiscord = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId("id-rd-" + this.id)
                            .setPlaceholder("Remove Discord Users")
                            .setMinValues(1)
                            .setMaxValues(Math.max(this.discordAccounts.length, 1))
                            .setDisabled(this.discordAccounts.length === 0)
                            .setOptions(
                                this.discordAccounts.length > 0 ? this.discordAccounts.map(x => {
                                    return {
                                        label: `${x.name}#${x.discriminator}`,
                                        value: String(x.id),
                                    };
                                }) : [{label: "none", value: "none"}]
                            )
                    );
                
                const streamers = await this.getActiveModeratorChannels();
                const removeStreamers = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId("id-rs-" + this.id)
                            .setPlaceholder("Remove Streamers")
                            .setMinValues(1)
                            .setMaxValues(Math.max(streamers.length, 1))
                            .setDisabled(streamers.length === 0)
                            .setOptions(
                                streamers.length > 0 ? streamers.map(x => {
                                    return {
                                        label: `${x.modForIdentity.name}`,
                                        value: String(x.modForIdentity.id),
                                    };
                                }) : [{label: "none", value: "none"}]
                            )
                    );
            
                const moderators = await this.getActiveModerators();
                const removeModerators = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId("id-rm-" + this.id)
                            .setPlaceholder("Remove Moderators")
                            .setMinValues(1)
                            .setMaxValues(Math.max(moderators.length, 1))
                            .setDisabled(moderators.length === 0)
                            .setOptions(
                                moderators.length > 0 ? moderators.map(x => {
                                    return {
                                        label: `${x.modIdentity.name}`,
                                        value: String(x.modIdentity.id),
                                    };
                                }) : [{label: "none", value: "none"}]
                            )
                    );
    
                const buttons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("id-at-" + this.id)
                            .setLabel("Add Twitch Users")
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId("id-ad-" + this.id)
                            .setLabel("Add Discord Users")
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId("id-as-" + this.id)
                            .setLabel("Add Streamer")
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId("id-am-" + this.id)
                            .setLabel("Add Moderator")
                            .setStyle(ButtonStyle.Secondary)
                    );

                if (admin) {
                    buttons.addComponents(
                        new ButtonBuilder()
                            .setCustomId("id-mo-" + this.id)
                            .setLabel("More Options")
                            .setStyle(ButtonStyle.Danger)
                    );
                }

                resolve({
                    embeds: embeds,
                    components: [
                        removeTwitch,
                        removeDiscord,
                        removeStreamers,
                        removeModerators,
                        buttons,
                    ],
                    ephemeral: true,
                });
            } catch(e) {
                reject(e);
            }
        });
    }

    /**
     * Updates or creates the identity with the information in this Object
     * 
     * @returns {Promise<FullIdentity>}
     */
    post() {
        return new Promise(async (resolve, reject) => {
            let identity = await super.post();

            for (let i = 0;i < this.twitchAccounts.length;i++) {
                this.twitchAccounts[i].identity = identity;
                this.twitchAccounts[i] = await this.twitchAccounts[i].post();
            }
            
            for (let i = 0;i < this.discordAccounts.length;i++) {
                this.discordAccounts[i].identity = identity;
                this.discordAccounts[i] = await this.discordAccounts[i].post();
            }

            resolve(this);
        })
    }

}

module.exports = FullIdentity;