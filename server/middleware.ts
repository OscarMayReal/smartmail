import { VerifySession } from "./keystone.ts";
import express from "express";

export function verifySessionMiddleware({appId, keystoneUrl, appSecret}: {appId: string, keystoneUrl: string, appSecret: string}) {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            const sessionData = await VerifySession({appId, keystoneUrl, sessionId: req.headers.authorization?.split(" ")[1]!, appSecret});
            req.sessionData = sessionData;
            next();
        } catch (error) {
            res.status(401).send(error);
        }
    }
}