import {initialize, ServiceType} from "@modbot/utils";



initialize(ServiceType.API).then(() => {
    import("./app");
}, e => {
    console.error(e);
});
