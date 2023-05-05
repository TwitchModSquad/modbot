const express = require("express");
const router = express.Router();

const lookup = require("./lookup");

router.use("/lookup", lookup);

module.exports = router;
