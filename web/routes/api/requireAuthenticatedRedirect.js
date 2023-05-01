const {Router} = require("express");
const config = require("../../../config.json");

const router = Router();

router.use((req, res, next) => {
    if (req.authCode === 3) {
        next();
    } else {
        res.cookie("return_uri", req.originalUrl, {
            domain: config.main_domain,
            path: "/",
            secure: true,
        });

        res.redirect(config.pub_domain + "signon/");
    }
});
 
module.exports = router;