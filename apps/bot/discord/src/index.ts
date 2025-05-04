import {initialize, ServiceType} from "@modbot/utils";

initialize(ServiceType.DISCORD, "DISCORD_UPTIME_ENDPOINT").then(async () => {
    import("./app");
}, e => {
    console.error(e);
});
