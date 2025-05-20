require("dotenv").config();
const cron = require("node-cron");
const io = require("@pm2/io");

const {initialize, ServiceType, logger} = require("@modbot/utils");

const jobs = [
    require("./updateChatActivity.js"),
];

initialize(ServiceType.JOBS).then(() => {
    logger.info(`Registering ${jobs.length} jobs: ${jobs.map(x => x.name).join(", ")}`);

    jobs.forEach(job => {
        cron.schedule(job.cron, job.execute);
        io.action(job.name, async (reply) => {
            logger.info(`Executing job '${job.name}'`);
            let success = false;
            try {
                await job.execute();
                success = true;
            } catch(err) {
                logger.error(err);
            }
            reply({ success });
        });
    });
});
