import {RedisObjectManager} from "../../";
import {AccessTokenWithUserId} from "@twurple/auth";

class TwitchTokenManager extends RedisObjectManager<AccessTokenWithUserId> {

    constructor() {
        super("twitch:token");
    }

}

export default new TwitchTokenManager();
