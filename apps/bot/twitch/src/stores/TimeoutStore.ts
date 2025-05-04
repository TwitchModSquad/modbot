import PunishmentStore from "../classes/PunishmentStore";
import {RawTwitchTimeout, TwitchTimeout} from "@modbot/utils";

class TimeoutStore extends PunishmentStore<RawTwitchTimeout, TwitchTimeout> {

    constructor() {
        super(TwitchTimeout);
    }

}

export default new TimeoutStore();
