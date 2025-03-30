import crypto from "crypto";
import RedisObjectManager from "../classes/RedisObjectManager";

const SESSION_EXPIRATION = 24 * 60 * 60; // session expiration, in seconds

export interface Session {
    id: string;
    identityId: number;
    createdAt: number;
    expiresAt: number;
}

class SessionManager extends RedisObjectManager<Session> {

    constructor() {
        super("session", SESSION_EXPIRATION);
    }

    async createSession(identityId: number): Promise<Session> {
        let sessionId: string;
        while (!sessionId) {
            sessionId = crypto.randomBytes(32).toString("hex");
            if (await this.get(sessionId)) {
                sessionId = null;
            }
        }
        const session: Session = {
            id: sessionId,
            identityId,
            createdAt: Date.now(),
            expiresAt: Date.now() + SESSION_EXPIRATION * 1000,
        }
        await this.set(sessionId, session);
        return session;
    }

}

export default new SessionManager();
