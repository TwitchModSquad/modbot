const {Router} = require("express");
const api = require("../../../api/index");

const con = require("../../../database");
const mime = require("mime-types");
const Jimp = require("jimp");
const fs = require("fs");

const requireAuthenticated = require("./requireAuthenticated");

const router = Router();

router.use(requireAuthenticated);

router.get("/", (req, res) => {
    res.status(404);
    res.json({success: false, error: "Not found"});
});

const NAME_REGEX = /^[A-Za-z0-9]{32}\.[a-z]+$/;

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

const TEXT_COLOR = '000';
const TEXT_OPACITY = 0.05;

const FILES_DIRECTORY = global.app_dir + "/files/";
const OUTPUT_FILE = FILES_DIRECTORY + "output.jpg";
 
router.get('/:file', (req, res) => {
    if (req.params.file.match(NAME_REGEX)) {
        con.query("select * from archive__files where local_path is not null and name = ?;", [req.params.file], (err, result) => {
            if (err || result.length === 0) {
                console.log(err);
                res.status(404);
                res.json({success: false, error: "File not found", stage: 3});
                return;
            }
            
            let fileData = result[0];

            if (IMAGE_TYPES.includes(fileData.content_type)) {
                Jimp.read(FILES_DIRECTORY + req.params.file).then(image => {
                    let w = image.bitmap.width;
                    let h = image.bitmap.height;

                    let font = Jimp.FONT_SANS_32_BLACK;

                    if (w > 500 && h > 500) {
                        font = Jimp.FONT_SANS_128_BLACK;
                    } else if (w > 250 && h > 250) {
                        font = Jimp.FONT_SANS_64_BLACK;
                    } else if (w > 100 && h > 100) {
                        font = Jimp.FONT_SANS_32_BLACK;
                    } else if (w > 50 && h > 50) {
                        font = Jimp.FONT_SANS_16_BLACK;
                    } else {
                        font = Jimp.FONT_SANS_8_BLACK;
                    }

                    let textImage = new Jimp(w,h, 0x0, (err, textImage) => {  
                        if (err) throw err;
                    })

                    Jimp.loadFont(font).then(async font => {
                        const text = " " + req.session.identity.id + " ";
                        let tw = Jimp.measureText(font, text);
                        let th = Jimp.measureTextHeight(font, text, 1000);

                        let numberOfPrintsX = Math.max(1, Math.floor(w / tw));
                        let numberOfPrintsY = Math.max(1, Math.floor(h / th));

                        for (let i = 0; i < numberOfPrintsY; i++) {
                            if (i % 2 === 1) {
                                textImage.print(font, 0, th * i, text.repeat(numberOfPrintsX));
                            } else {
                                textImage.print(font, tw / -2, th * i, text.repeat(numberOfPrintsX + 1));
                            }
                        }

                        textImage.color([{ apply: 'xor', params: [TEXT_COLOR] }])
                            .opacity(TEXT_OPACITY);

                        await image.blit(textImage, 0, 0)
                            .writeAsync(OUTPUT_FILE);
                        res.sendFile(OUTPUT_FILE);
                    });
                }, err => {
                    console.log(err);
                    res.status(404);
                    res.json({success: false, error: "File not found", stage: 2});
                });
            } else {
                res.sendFile(FILES_DIRECTORY + req.params.file);
            }
        });
    } else {
        res.json({success: false, error: "File not found", stage: 1});
    }
});
 
module.exports = router;