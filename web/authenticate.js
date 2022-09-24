const {Router} = require("express");
const api = require("../api/index");
const con = require("../database");
 
const router = Router();

router.use('/', (req, res, next) => {
    let session = req.cookies?.session;

    if (req.headers.authorization) {
        session = req.headers.authorization;
    }

    if (session === null || session === undefined) {
        req.authCode = 0;
        next();
        return;
    }

    con.query("select s.id as sid, s.created as screated, i.id as iid, i.name as iname from session as s left join identity as i on i.id = s.identity_id where s.id = ?;", [session], (err, result) => {
        if (err) {
            res.status(401);
            res.json({success: false, error: err});
            return;
        } else {
            if (result.length > 0) {
                let row = result[0];
                api.getFullIdentity(row["iid"]).then(identity => {
                    if (!identity.authenticated) {
                        req.session = {id: row.sid, created: row.screated, identity: identity};
                        req.authCode = 2;
                    } else {
                        req.session = {id: row.sid, created: row.screated, identity: identity};
                        req.authCode = 3;
                    }
                    next();
                }).catch(err => {
                    res.json({success: false, error: err});
                });
            } else {
                req.authCode = 1;
                next();
            }
        }
    });
});
 
module.exports = router;