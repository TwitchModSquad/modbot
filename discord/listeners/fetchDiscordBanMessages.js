const client = global.client.discord;
const config = require("../../config.json");
const con = require("../../database");

const listener = {
    name: 'fetchDiscordBanMessages',
    eventName: 'ready',
    eventType: 'once',
    listener () {
        if (config.hasOwnProperty("liveban_channel")) {
            client.channels.fetch(config.liveban_channel).then(channel => {
                con.query("select discord_message from discord__ban where discord_message is not null order by time_banned desc limit 95, 1;", (err, afterBan) => {
                    if (err) {global.api.Logger.warning(err);return;}
                    if (afterBan.length !== 1) {return;}
    
                    channel.messages.fetch({
                        limit: 100,
                        after: afterBan[0].discord_message
                    }).then(messages => global.api.Logger.info(messages.size + " messages were successfully fetched from the #bans channel")).catch(global.api.Logger.warning);
                });
            }).catch(global.api.Logger.warning);
        }
    }
};

module.exports = listener;