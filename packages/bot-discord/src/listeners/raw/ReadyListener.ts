import {Client, Events} from "discord.js";
import {logger} from "@modbot/utils";

import {Listener, ListenerType} from "../../interfaces";

export class ReadyListener implements Listener<Events.ClientReady> {
    public type = ListenerType.ONCE;

    public event = Events.ClientReady;

    public async execute(client: Client): Promise<void> {
        logger.info(`Client logged in as ${client.user?.tag}!`);
    }
}
