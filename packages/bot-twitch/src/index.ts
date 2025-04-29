import {initialize, ServiceType} from "@modbot/utils";
import {startApp} from "./app";

initialize(ServiceType.TWITCH).then(async () => {
    await startApp();
}, e => {
    console.error(e);
});
