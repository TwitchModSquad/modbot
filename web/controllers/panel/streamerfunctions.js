const express = require("express");
const router = express.Router();

const api = require("../../../api/");
const config = require("../../../config.json");

router.get("/", async (req, res) => {
    res.render("pages/panel/streamerfunctions", {session: req.session});
});

module.exports = router;