const express = require("express");
const router = express.Router();

const cache = require("./cache");
const logs = require("./logs");

router.use((req, res, next) => {
    if (req.session?.identity?.mod || req.session?.identity?.admin) {
        next();
    } else {
        res.redirect("/panel/no-permission");
    }
});

router.use("/cache", cache);
router.use("/logs", logs);

module.exports = router;