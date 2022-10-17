const express = require("express");
const router = express.Router();

const ban = require("./ban");

router.use("/ban", ban);

module.exports = router;