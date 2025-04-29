import PunishmentStore from "../classes/PunishmentStore";
import {RawTwitchBan, TwitchBan} from "@modbot/utils";

class BanStore extends PunishmentStore<RawTwitchBan, TwitchBan> {

    constructor() {
        super(TwitchBan);
    }

}

export default new BanStore();
