const {Router} = require("express");
const api = require("../../../api/index");
 
const router = Router();

router.get("/", (req, res) => {
    res.json({success: false, error: "Not found"});
});
 
module.exports = router;