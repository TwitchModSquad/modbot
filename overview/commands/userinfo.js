const con = require("../../database");
const api = require("../../api/");
const TwitchUser = require("../../api/Twitch/TwitchUser");

function comma(x) {
    if (!x) return "0";
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

let rankTable = null;

setTimeout(async () => {
    rankTable = await con.pquery("SELECT chatter_id, sum(chat_count) as sm FROM twitch__chat_chatters group by chatter_id order by sm desc;");
    rankTable = rankTable.map(x => String(x.chatter_id));
    api.Logger.info(`Loaded ${rankTable.length} chatters for the rank table`);
}, 30000);

module.exports = {
    name: "userinfo",
    description: "View your TMS user info!",
    /**
     * 
     * @param {TwitchUser} streamer 
     * @param {TwitchUser} chatter 
     * @param {*} tags 
     * @param {*} args 
     * @param {string} message 
     */
    async execute(streamer, chatter, tags, args, message) {
        let target = chatter;

        if (args.length > 0) {
            try {
                target = (await api.Twitch.getUserByName(args[0], true))[0];
            } catch(err) {
                global.client.overview.say("twitchmodsquad", `An error occurred: ${err}`);
                return;
            }
        }

        const communities = await target.getActiveCommunities();
        let totalChat = 0;
        let mostActive = null;

        communities.forEach(community => {
            totalChat += community.chatCount;
            if (!mostActive || mostActive.chatCount < community.chatCount)
                mostActive = community;
        });

        let rank = null;
        if (rankTable)
            rank = rankTable.indexOf(String(target.id));
        
        let you = chatter.id === target.id ? "You" : "They";
        let your = chatter.id === target.id ? "Your" : "Their";

        global.client.overview.say("twitchmodsquad", `Hello @${chatter.display_name}!!${target.id === chatter.id ? "" : ` You are viewing user info for ${target.display_name}.`} ${you} have sent ${comma(totalChat)} message${totalChat === 1 ? "" : "s"} across ${communities.length} communities.${mostActive ? ` ${your} most active community is ${mostActive.user.display_name}, with ${comma(mostActive.chatCount)} message${mostActive.chatCount === 1 ? "" : "s"}!` : ""}${rank && rank >= 0 ? ` ${you} are the #${comma(rank + 1)} highest chatter on TMS!` : ""}`);
    },
};
