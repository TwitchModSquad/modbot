import {Sequelize} from "sequelize";
import logger from "../logger";

const sequelize = new Sequelize({
    dialect: "mariadb",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    logging: msg => logger.debug(msg),
});

export default sequelize;
