const con = require("../database");
const config = require("../config.json");

const {EmbedBuilder} = require("discord.js");

/**
 * Identities a specific "identity," which can consist of Twitch users and/or Discord users.
 */
class Identity {
    /**
     * The ID for this identity. This is a surrogate key defined by TMS.
     * @type {integer}
     */
    id;

    /**
     * The Name for this identity. This is usually defined by the discord user or twitch user that was originally linked with this identity.
     * @type {string}
     */
    name;

    /**
     * Whether the user has authenticated properly with TMS or not
     * 
     * @type {boolean}
     */
    authenticated;

    /**
     * Whether the user is a TMS administrator
     * 
     * @type {boolean}
     */
    admin;

    /**
     * Whether the user is a TMS moderator
     * 
     * @type {boolean}
     */
    mod;

    /**
     * Constructor for the Identity class.
     * @param {number} id 
     * @param {string} name 
     * @param {boolean} authenticated
     * @param {boolean} admin
     * @param {boolean} mod
     */
    constructor(id, name, authenticated, admin, mod) {
        this.id = id;
        this.name = name;
        this.authenticated = authenticated;
        this.admin = admin;
        this.mod = mod;
    }

    /**
     * Generated a Discord Embed for the user.
     * 
     * @returns {Promise<EmbedBuilder[]>}
     */
    discordEmbed() {
        return new Promise(async (resolve, reject) => {
            let embeds = [];

            const identityEmbed = new EmbedBuilder()
                    .setAuthor({name: this.name, url: this.getShortlink()})
                    .setDescription(this.name)
                    .setFooter({text: "TMS Identity #" + this.id, iconURL: "https://tms.to/assets/images/logos/logo.webp"})
                    .setColor(0x772ce8);

            embeds = [identityEmbed];

            resolve(embeds);
        });
    }

    /**
     * Gets TMS short link to user's page
     * @returns {string}
     */
    getShortlink() {
        return `${config.pub_domain}i/${this.id}`;
    }

    /**
     * Updates or creates the identity with the information in this Object
     * 
     * @returns {Promise<Identity>}
     */
    post() {
        return new Promise((resolve, reject) => {
            con.query("insert into identity (id, name, authenticated, admin, moderator) values (?, ?, ?, ?, ?) on duplicate key update name = ?, authenticated = ?, admin = ?, moderator = ?;", [
                this.id,
                this.name,
                this.authenticated,
                this.admin,
                this.mod,
                this.name,
                this.authenticated,
                this.admin,
                this.mod,
            ], err => {
                if (err) {
                    reject(err);
                } else {
                    if (this.id === null || this.id === undefined) {
                        con.query("select id, name, authenticated, admin, moderator from identity where name = ? order by id desc limit 1;", [this.name], (err, res) => {
                            if (err) {
                                reject(err);
                            } else if (res.length < 1) {
                                reject("Could not retrieve inserted id.");
                            } else {
                                this.id = res[0].id;
                                resolve(new Identity(res[0].id, res[0].name, res[0].authenticated, res[0].admin, res[0].mod));
                            }
                        });
                    } else {
                        resolve(new Identity(this.id, this.name, this.authenticated, this.admin, this.mod));
                    }
                }
            });
        })
    }
}

module.exports = Identity;