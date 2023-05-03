const {Router} = require("express");
const {MessageEmbed} = require("discord.js");
const request = require('request');
const bodyParser = require("body-parser");

const config = require("../../../config.json");
 
const router = Router();

const discordRegex = /^.+#\d{4}$/;
const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());

router.get("/", (req, res) => {
    res.json({success: false, error: "GET is not allowed"});
});

router.post("/", (req, res) => {
    if(req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
        return res.json({success: false, error: "Please complete the captcha."});
    }
    const verificationURL = "https://www.google.com/recaptcha/api/siteverify?secret=" + config.recaptcha.secret + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;

    let error = "";

    let contactInfo = req.body["contact-info"];
    let subject = req.body["subject"];
    let reqBody = req.body["body"];

    function addError(addErr) {
        if (error !== "") error += "<br />";
        error += addErr;
    }

    if (!contactInfo.match(discordRegex) && !contactInfo.match(emailRegex)) {
        addError("Contact info does not match Discord or Email regex.");
    }

    if (subject.length < 4 || subject.length > 40) {
        addError("Subject must be between 4 and 40 characters.");
    }

    if (reqBody.length < 50 || reqBody.length > 1000) {
        addError("Body must be between 50 and 1000 characters.");
    }

    if (error !== "") return res.json({success: false, error: error});

    request(verificationURL, function(error,response,body) {
        body = JSON.parse(body);
        if (body.success !== undefined && !body.success) {
            return res.json({success: false, error: "Failed captcha verification. Try again"});
        }

        if (!global.client?.discord) res.json({success: false, error: "Unknown error. Please contact Twijn#8888 on Discord or twijn@twijn.net for support."});
        
        global.client.discord.channels.fetch(config.contact_us_response_channel).then(channel => {
            const embed = new MessageEmbed()
                    .setTitle(subject)
                    .setAuthor(contactInfo)
                    .setDescription(reqBody)
                    .setTimestamp(new Date());

            channel.send({message: ' ', embeds: [embed]}).then(() => {
                res.json({success: true})
            }).catch(err => {
                global.api.Logger.warning(err);
                res.json({success: false, error: "Unknown error. Please contact Twijn#8888 on Discord or twijn@twijn.net for support."});
            });
        }).catch(err => {
            global.api.Logger.warning(err);
            res.json({success: false, error: "Unknown error. Please contact Twijn#8888 on Discord or twijn@twijn.net for support."});
        });

        global.client.discord.users.fetch("267380687345025025").then(twijn => {
            const embed = new MessageEmbed()
                    .setTitle(subject)
                    .setAuthor(contactInfo)
                    .setDescription(reqBody)
                    .setTimestamp(new Date());
            
            twijn.createDM().then(channel => {
                channel.send({message: '<@267380687345025025>', embeds: [embed]}).then(() => {
                    res.json({success: true})
                }).catch(err => {
                    global.api.Logger.warning(err);
                    res.json({success: false, error: "Unknown error. Please contact Twijn#8888 on Discord or twijn@twijn.net for support."});
                });
            }).catch(err => {
                global.api.Logger.warning(err);
                res.json({success: false, error: "Unknown error. Please contact Twijn#8888 on Discord or twijn@twijn.net for support."});
            });
        }).catch(err => {
            global.api.Logger.warning(err);
            res.json({success: false, error: "Unknown error. Please contact Twijn#8888 on Discord or twijn@twijn.net for support."});
        });
    });
})
 
module.exports = router;