import {initialize, ServiceType} from "@modbot/utils";

initialize(ServiceType.DISCORD).then(async () => {
    import("./app");
}, e => {
    console.error(e);
});
