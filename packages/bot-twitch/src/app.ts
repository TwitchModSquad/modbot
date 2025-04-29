import startChat from "./tmi";
import startEventSub from "./eventsub";
import {ListenSetting, TwitchUser} from "@modbot/utils";
import {Op} from "sequelize";

export const startApp = async () => {
    const members = await TwitchUser.findAll({
        where: {
            listen_setting: {
                [Op.ne]: ListenSetting.NONE,
            }
        },
    });

    await startChat(members);
    await startEventSub(members);
}
