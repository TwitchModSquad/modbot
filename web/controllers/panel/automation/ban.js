const express = require("express");
const router = express.Router();

router.get("/list", (req, res) => {
    let data = {
        session: req.session,
    };

    res.render("pages/panel/automation/ban/list", data);
});

module.exports = router;