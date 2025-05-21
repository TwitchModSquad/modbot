import {config} from "dotenv";
config();

import cron from "node-cron";
import {action} from "@pm2/io";

import {initialize, ServiceType, logger} from "@modbot/utils";
import {Job} from "./types";

import updateChatActivity from "./updateChatActivity";

const jobs: Job[] = [
    updateChatActivity,
];

initialize(ServiceType.JOBS).then(() => {
    logger.info(`Registering ${jobs.length} jobs: ${jobs.map(x => x.name).join(", ")}`);

    jobs.forEach(job => {
        cron.schedule(job.cron, job.execute);
        action(job.name, async (reply: unknown) => {
            logger.info(`Executing job '${job.name}'`);
            let success = false;
            try {
                await job.execute();
                success = true;
            } catch(err) {
                logger.error(err);
            }
            if (typeof reply === "function") {
                reply({ success });
            }
        })
    });
});
