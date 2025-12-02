import express from "express";
import { verifySessionMiddleware } from "./middleware.ts";
import "dotenv/config";
import { getMailAccountFolders, getMailAccountMessages } from "./functions/mail.ts";
import { getAccountByAddress, getAccountsByUserId } from "./functions/mailaccounts.ts";
import { receiveEmail } from "./functions/mail.ts";

const app = express();

app.use("/mail", verifySessionMiddleware({ appId: process.env.APP_ID!, keystoneUrl: process.env.KEYSTONE_URL!, appSecret: process.env.APP_SECRET! }));
app.use(express.json());

app.get("/mail/folders", async (req, res) => {
    const accounts = await getAccountsByUserId(req.sessionData.userId);
    const folders = await getMailAccountFolders(accounts[0].id);
    res.json(folders);
});

app.get("/mail/folders/:folderId/messages", async (req, res) => {
    const messages = await getMailAccountMessages(req.params.folderId);
    res.json(messages);
});

app.post("/externalmail/receive", async (req, res) => {
    console.log("Received email");
    const { address, email } = req.body;
    const account = await getAccountByAddress(address);
    if (!account) {
        res.json({ success: false, error: "Account not found" });
        return;
    }
    await receiveEmail({ accountId: account.id, email });
    res.json({ success: true });
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});