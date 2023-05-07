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
}, 5000);

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
        const communities = await chatter.getActiveCommunities();
        let totalChat = 0;
        let mostActive = null;

        communities.forEach(community => {
            totalChat += community.chatCount;
            if (!mostActive || mostActive.chatCount < community.chatCount)
                mostActive = community;
        });

        global.client.overview.say("twitchmodsquad", `Hello @${chatter.display_name}!! You have sent ${comma(totalChat)} message${totalChat === 1 ? "" : "s"} across ${communities.length} communities.${mostActive ? ` Your most active community is ${mostActive.user.display_name}, with ${mostActive.chatCount} message${mostActive.chatCount === 1 ? "" : "s"}` : ""}!${rankTable ? ` You are the #${comma(rankTable.indexOf(String(chatter.id)) + 1)} highest chatter on TMS!` : ""}`);
    },
};
