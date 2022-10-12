const express = require("express");
const router = express.Router();

const api = require("../../../api/");

router.get("/:id", async (req, res) => {
    try {
        let entry = await api.Archive.getEntryById(req.params.id);
        for (let i = 0; i < entry.users.length; i++) {
            if (entry.users[i].user)
                entry.users[i].resolvedUser = await entry.users[i].resolveUser();
        }
        res.render("pages/panel/entry", {session: req.session, entry: entry});
    } catch (err) {
        api.Logger.severe(err);
        res.status(404);
        res.send("no");
    }
});

module.exports = router;