const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
    res.render("pages/panel/modbomb", {session: req.session});
});

module.exports = router;