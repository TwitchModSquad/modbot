const {Router} = require("express");

const router = Router();

router.use((req, res, next) => {
    if (req.authCode === 3) {
        next();
    } else {
        res.json({success: false, error: "Not authenticated", authCode: req.authCode});
    }
});
 
module.exports = router;