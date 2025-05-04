import eventManager from "@modbot/utils/dist/managers/events/EventManager";

eventManager.register("twitch:ban", async ban => {
    console.log(ban);
});
