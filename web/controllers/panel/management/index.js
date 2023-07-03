const express = require("express");
const router = express.Router();

const bot = require("./bot");

router.use("/bot", bot);

module.exports = router;
