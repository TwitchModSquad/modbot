// src/types/express.d.ts
import {RawDiscordUser, RawTwitchUser, Session, RawIdentity} from "@modbot/utils";

declare global {
    namespace Express {
        interface Request {
            session?: Session;
            identity?: RawIdentity;
            users?: {
                twitch: RawTwitchUser[],
                discord: RawDiscordUser[],
            }
            flushCache(): void;
        }
    }
}
