const con = require("../../database");
const config = require("../../config.json");

const User = require("../User");
const Identity = require("../Identity");
const DiscordGuild = require("./DiscordGuild");

const {EmbedBuilder, codeBlock} = require("discord.js");

const DISCORD_CDN = "https://cdn.discordapp.com/";

/**
 * The class for a specific Discord user
 * @extends User
 */
class DiscordUser extends User {

    /**
     * Discord username
     * @type {string}
     */
    name;

    /**
     * Discord discriminator tag
     * @type {number}
     */
    discriminator;

    /**
     * Avatar string, used to generate a Discord avatar image URL
     * @type {?string}
     */
    avatar;
    
    /**
     * Avatar URL
     * @type {string}
     */
    avatar_url;

    /**
     * Constructor for a Discord user
     * @param {number} id 
     * @param {Identity} identity 
     * @param {string} name 
     * @param {number} discriminator 
     * @param {?string} avatar 
     */
    constructor(id, identity, name, discriminator, avatar) {
        super(id, identity);

        this.name = name;
        this.discriminator = discriminator;
        this.avatar = avatar;

        this.avatar_url = this.getAvatar();
    };

    /**
     * Generates the Discord avatar for this user.
     * 
     * @returns {string} Avatar URL
     */
    getAvatar() {
        if (this.avatar) {
            return DISCORD_CDN + `avatars/${this.id}/${this.avatar}.png`;
        } else {
            return DISCORD_CDN + `embed/avatars/${this.discriminator % 5}.png`;
        }
    }

    /**
     * Gets TMS short link to user's page
     * @returns {string}
     */
    getShortlink() {
        return `${config.pub_domain}panel/user/${this.id}`;
    }

    /**
     * Returns Guilds the user is a member of.
     * @returns {Promise<DiscordGuild[]>}
     */
    getGuilds() {
        return new Promise((resolve, reject) => {
            con.query("select dg.* from discord__guild_user as du join discord__guild as dg on dg.id = du.guild_id where du.user_id = ?;", [this.id], async (err, res) => {
                if (err) {
                    reject(err);
                    return;
                }

                let guilds = [];
                for (let i = 0; i < res.length; i++) {
                    let guild = new DiscordGuild(
                            res[i].id,
                            await global.api.getFullIdentity(res[i].represents_id),
                            await global.api.Discord.getUserById(res[i].owner_id),
                            res[i].name
                        );
                    
                    guilds = [
                        ...guilds,
                        guild
                    ];
                }
                resolve(guilds);
            });
        });
    }

    /**
     * Generated a Discord Embed for the user.
     * 
     * @returns {Promise<EmbedBuilder>}
     */
    discordEmbed() {
        return new Promise(async (resolve, reject) => {
            const embed = new EmbedBuilder()
                    .setAuthor({name: this.name + "#" + this.discriminator, iconURL: this.avatar_url, url: this.getShortlink()})
                    .setThumbnail(this.avatar_url)
                    .setColor(0x772ce8)
                    .setDescription(`\`\`\`${this.id}\`\`\`<@${this.id}>`)
                    .setFooter({text: "TMS Discord User #" + this.id, iconURL: "https://tms.to/assets/images/logos/logo.webp"});

            const mutualGuilds = await this.getGuilds();
            
            if (mutualGuilds.length > 0) {
                let guilds = "";
                mutualGuilds.forEach(guild => {
                    if (guilds !== "") guilds += "\n";
                    guilds += guild.name;
                });
                embed.addFields(
                    {
                        name: "Guilds",
                        value: codeBlock(guilds),
                    }
                );
            }

            resolve(embed);
        });
    }

    /**
     * Updates or creates the user with the information in this Object
     * 
     * @returns {Promise<DiscordUser>}
     */
    post() {
        return new Promise(async (resolve, reject) => {
            con.query("insert into discord__user (id, name, discriminator, avatar, identity_id) values (?, ?, ?, ?, ?) on duplicate key update name = ?, discriminator = ?, avatar = ?, identity_id = ?;", [
                this.id,
                this.name,
                this.discriminator,
                this.avatar,
                this.identity?.id,
                this.name,
                this.discriminator,
                this.avatar,
                this.identity?.id
            ], err => {
                if (err) {
                    reject(err);
                } else {
                    resolve(this);
                    global.api.Discord.userCache.remove(this.id);
                }
            });
        })
    }
    
}

module.exports = DiscordUser;