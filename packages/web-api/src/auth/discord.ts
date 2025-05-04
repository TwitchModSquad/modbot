import {Router} from "express";
import {discordUsers, getTwitchURL} from "@modbot/utils";
import discordTokenManager from "@modbot/utils/dist/managers/discord/DiscordTokenManager";
const router = Router();

router.get("/", async (req, res) => {
    const {query, cookies} = req;
    const {code} = query;

    if (!req.session || !req.identity?.id) {
        res.redirect(await getTwitchURL());
        return;
    }

    const successRedirect = () => {
        if (cookies?.v3_redirect && cookies.v3_redirect.startsWith(process.env.DASHBOARD_URI)) {
            res.redirect(cookies.v3_redirect);
        } else {
            res.redirect(process.env.DASHBOARD_URI);
        }
    }

    if (code) {
        const result = await discordTokenManager.exchangeCode(String(code));

        if (result) {
            await discordUsers.update(result.user.id, {
                identity: req.identity.id,
            });
            req.flushCache();

            return successRedirect();
        }
    }

    res.redirect(discordTokenManager.getURI());
});

export default router;
