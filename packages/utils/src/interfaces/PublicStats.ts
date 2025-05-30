import {RawTwitchUser} from "../models";

export interface PublicStats {
    channels: number;
    discordMembers: number;
    modSquadMembers: number;
    twitchBans: number;
    twitchChats: number;
    twitchTimeouts: number;
    members: RawTwitchUser[];
}
