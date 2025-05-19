require("dotenv").config();
const cron = require("node-cron");
const tx2 = require("tx2");

const jobs = [
    require("./updateChatActivity.js"),
];

console.log(`Registering ${jobs.length} jobs: ${jobs.map(x => x.name).join(", ")}`);

jobs.forEach(job => {
    cron.schedule(job.cron, job.execute);
    tx2.action(job.name, async (reply) => {
        console.log(`Executing job '${job.name}'`);
        let success = false;
        try {
            await job.execute();
            success = true;
        } catch(err) {
            console.error(err);
        }
        reply({ success });
    });
});

// Prevent app from closing
setInterval(() => {}, 1000);
