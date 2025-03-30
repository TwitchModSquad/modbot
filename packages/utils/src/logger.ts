import pino, {Logger} from "pino";

const isDev = process.env.NODE_ENV !== "production";

let logger: Logger<never, boolean>;

// If/else because passing them into variable options was giving TS errors
if (isDev) {
    logger = pino({
        level: process.env.LOG_LEVEL || "info",
        transport: {
            target: "pino-pretty",
            options: {
                colorize: true,
                ignore: "pid,hostname",
            },
        },
    });
} else {
    logger = pino({
        level: process.env.LOG_LEVEL || "info",
    });
}

export default logger;
