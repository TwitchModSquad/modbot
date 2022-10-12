const {Router} = require("express");

const con = require("../../../database");
const api = require("../../../api/index");

const requireAuthenticated = require("./requireAuthenticated");

const router = Router();

router.use(requireAuthenticated);

const checkNumber = _string => !(Number.isNaN(Number(_string)));


const search = async (req, res) => {
    let result = {success: true, identityResults: [], twitchAccountResults: [], discordAccountResults: []};
    let limit = 10;

    if (req.params?.limit && checkNumber(req.params.limit)) {
        limit = Math.min(10, Number(req.params.limit));
    }

    let query = req.params.query.replace(/(?:%|_|\\)/g, '\\$&');

    let identities = await con.pquery("select id from identity where name like ? limit ?;", [query + "%", limit]);
    
    for (let ii = 0; ii < identities.length; ii++) {
        let identity = await (api.getFullIdentity(identities[ii].id));
        result.identityResults = [
            ...result.identityResults,
            identity,
        ];
    }

    let twitchAccounts = await con.pquery("select id from twitch__user where display_name like ? limit ?;", [query + "%", limit]);
    
    for (let ti = 0; ti < twitchAccounts.length; ti++) {
        let twitchAccount = await (api.Twitch.getUserById(twitchAccounts[ti].id));
        result.twitchAccountResults = [
            ...result.twitchAccountResults,
            twitchAccount,
        ];
    }

    let discordAccounts = await con.pquery("select id from discord__user where name like ? limit ?;", [query + "%", limit]);
    
    for (let di = 0; di < discordAccounts.length; di++) {
        let discordAccount = await (api.Discord.getUserById(discordAccounts[di].id));
        result.discordAccountResults = [
            ...result.discordAccountResults,
            discordAccount,
        ];
    }

    res.json(result);
}

router.get('/:query', search);
router.get('/:query/limit/:limit', search);

 
module.exports = router;