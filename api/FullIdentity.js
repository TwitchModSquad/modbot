const con = require("../database");

const {MessageEmbed} = require("discord.js");

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
     * Gets a list of user identities that this user moderates
     * @param {boolean} fromCache 
     * @returns {Promise<ModeratorLink[]>}
     */
    getActiveModeratorChannels(fromCache = true) {
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
     * @returns {Promise<MessageEmbed[]>}
     */
    discordEmbed() {
        return new Promise(async (resolve, reject) => {
            const moderatorIn = await this.getActiveModeratorChannels();

            let embeds = [];

            const identityEmbed = new MessageEmbed()
                    .setAuthor({name: this.name, iconURL: this.avatar_url, url: this.getShortlink()})
                    .setDescription(this.name)
                    .setFooter({text: "TMS Identity #" + this.id, iconURL: "https://twitchmodsquad.com/assets/images/logo.webp"})
                    .setThumbnail(this.avatar_url)
                    .setColor(0x772ce8);

            embeds = [identityEmbed];

            let moderatorInStr = "";
            moderatorIn.forEach(modLink => {
                if (moderatorInStr !== "") moderatorInStr += "\n";

                moderatorInStr += "**"+modLink.modForIdentity.name+"**";

                if (modLink.modForIdentity.twitchAccounts.length > 0)
                    moderatorInStr += " - [Profile](https://twitch.tv/" + modLink.modForIdentity.twitchAccounts[0].display_name.toLowerCase() + ")";

                if (modLink.modForIdentity.discordAccounts.length > 0)
                    moderatorInStr += ` - <@${modLink.modForIdentity.discordAccounts[0].id}>`;
            });

            if (moderatorInStr !== "") {
                identityEmbed.addField("Moderates For", moderatorInStr, false);
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