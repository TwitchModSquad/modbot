import logger from "../logger";

export class UptimeHeartbeat {
    private readonly heartbeatUrl: string;
    private readonly heartbeatInterval: number;

    private async sendHeartbeat() {
        try {
            await fetch(this.heartbeatUrl);
            logger.debug("Sent heartbeat");
        } catch(err) {
            logger.error("Failed to send heartbeat: " + err);
        }
    }

    constructor(heartbeatUrl: string, heartbeatInterval: number) {
        this.heartbeatUrl = heartbeatUrl;
        this.heartbeatInterval = heartbeatInterval;

        setInterval(() => this.sendHeartbeat(), this.heartbeatInterval);
        this.sendHeartbeat().catch(e => logger.error(e));
    }

}
