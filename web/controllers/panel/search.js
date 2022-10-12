const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
    res.render("pages/panel/search", {session: req.session});
});

module.exports = router;