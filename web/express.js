const express = require("express");
const path = require("path");
const config = require("../config.json");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const controllers = require("./controllers/");

const routes = require("./routes/");
const authenticate = require("./authenticate");

const app = express();

app.set("view engine", "ejs");

app.use(cookieParser());
app.use(cors());

app.set('views', path.join(__dirname, '/views'));

app.use(express.static("web/static"));
app.use("/join", express.static("web/static"))

app.use('/', (req, res, next) => {
    let elapsed_start = Date.now();

    res.elapsedJson = json => {
        json.elapsed = Date.now() - elapsed_start;
        res.json(json);
    }
    next();
});

app.use('/', routes.noAuth);
app.use('/', controllers.noAuth);

app.use('/', authenticate);

app.use('/', routes.auth);
app.use('/', controllers.auth);

app.listen(config.backend.port, () => {
    global.api.Logger.info("Express server started on port " + config.backend.port);
});
