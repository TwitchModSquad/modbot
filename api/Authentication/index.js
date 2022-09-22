const TwitchAuthentication = require("./TwitchAuthentication");
const DiscordAuthentication = require("./DiscordAuthentication");

class Authentication {
    
    /**
     * Methods relating to Discord authentication flow
     * @type {DiscordAuthentication}
     */
    Discord = new DiscordAuthentication()

    /**
     * Methods relating to Twitch authentication flow
     * @type {TwitchAuthentication}
     */
    Twitch = new TwitchAuthentication()

}

module.exports = Authentication;