const {Router} = require("express");
const api = require("../../../api/index");

const twitch = require("../../../twitch/twitch");

const requireAuthenticated = require("./requireAuthenticated");

const router = Router();

router.use(requireAuthenticated);

router.get("/", async (req, res) => {
    let clients = twitch.getClients();

    let result = [];

    for (let i = 0; i < clients.length; i++) {
        let client = clients[i];
        let channels = [];

        for (let ic = 0; ic < client.channels.length; ic++) {
            let channel = client.channels[ic];

            channels = [
                ...channels,
                (await api.Twitch.getUserByName(channel, true))[0]
            ];
        }

        result[i] = {id: i, status: client.status, channels: channels};
    }

    res.json({success: true, data: result});
});
 
module.exports = router;