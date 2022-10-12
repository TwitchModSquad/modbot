const {Router} = require("express");
const con = require("../../../database");
const bodyParser = require("body-parser");

const requireAuthenticated = require("./requireAuthenticated");

const router = Router();

router.use(requireAuthenticated);

router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());

router.get("/", (req, res) => {
    res.json({success: false, error: "GET is not allowed"});
});

router.get("/:shortlink", (req, res) => {
    con.query("select * from shortlink where shortlink = ?;", [req.params.shortlink], (err, response) => {
        if (err) {
            res.json({success: false, error: err});
            return;
        }

        if (response.length > 0) {
            res.json({success: true, data: response[0]});
        } else {
            res.json({success: false, error: "Shortlink not found"});
        }
    });
});

router.post("/:shortlink", (req, res) => {

});

router.put("/:shortlink", (req, res) => {

});
 
module.exports = router;