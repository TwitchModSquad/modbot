import {initialize, ServiceType} from "@modbot/utils";

initialize(ServiceType.TWITCH).then(() => {
    // import("./app");
}, e => {
    console.error(e);
});
