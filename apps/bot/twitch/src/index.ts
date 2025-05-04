import {initialize, ServiceType} from "@modbot/utils";
import {startApp} from "./app";

initialize(ServiceType.TWITCH, "TWITCH_UPTIME_ENDPOINT").then(async () => {
    await startApp();
}, e => {
    console.error(e);
});
