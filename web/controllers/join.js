const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.render("pages/join/index");
});

module.exports = router;