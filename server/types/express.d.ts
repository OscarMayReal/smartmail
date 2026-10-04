import type { SessionData } from "../keystone.ts";

declare global {
    namespace Express {
        interface Request {
            sessionData: SessionData;
        }
    }
}

export {};
