const {Router} = require("express");

const router = Router();

router.use((req, res, next) => {
    if (req.authCode === 3) {
        next();
    } else {
        res.redirect("/signon/");
    }
});
 
module.exports = router;