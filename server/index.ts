import express from "express";
import { verifySessionMiddleware } from "./middleware.ts";
import "dotenv/config";
import { CreateFolder, getEmailById, getMailAccountFolders, getMailAccountMessages, moveEmail, sendEmail } from "./functions/mail.ts";
import { deleteMailAccount, getAccountByAddress, getAccountsByUserId } from "./functions/mailaccounts.ts";
import { receiveEmail } from "./functions/mail.ts";
import { CreateTenantMailAccount, ListTenantMailAccounts } from "./functions/admin.ts";

const app = express();

app.use("/mail", verifySessionMiddleware({ appId: process.env.APP_ID!, keystoneUrl: process.env.KEYSTONE_URL!, appSecret: process.env.APP_SECRET! }));
app.use("/admin", verifySessionMiddleware({ appId: process.env.APP_ID!, keystoneUrl: process.env.KEYSTONE_URL!, appSecret: process.env.APP_SECRET! }));
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

app.get("/mail/messages/:messageId", async (req, res) => {
    const message = await getEmailById(req.params.messageId);
    res.json(message);
});

app.post("/mail/messages/:messageId/move", async (req, res) => {
    const { folderId } = req.body;
    const message = await moveEmail({ id: req.params.messageId, folderId });
    res.json(message);
});

app.post("/mail/folders", async (req, res) => {
    const accounts = await getAccountsByUserId(req.sessionData.userId);
    const folder = await CreateFolder({ accountId: accounts[0].id, name: req.body.name, type: "smartmail.folder.custom" });
    const folders = await getMailAccountFolders(accounts[0].id);
    res.json(folders);
});

app.post("/mail/send", async (req, res) => {
    console.log("Sending email");
    const accounts = await getAccountsByUserId(req.sessionData.userId);
    const { email } = req.body;
    await sendEmail({ accountId: accounts[0].id, email, user: req.sessionData.user });
    res.json({ success: true });
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

app.get("/admin/accounts", async (req, res) => {
    const accounts = await ListTenantMailAccounts(req.sessionData.tenantId);
    res.json(accounts);
});

app.post("/admin/accounts", async (req, res) => {
    const { userId, address, domainId, color } = req.body;
    const account = await CreateTenantMailAccount(req.sessionData.tenantId!, userId, address, domainId, color);
    res.json(account);
});

app.delete("/admin/accounts/:id", async (req, res) => {
    const account = await deleteMailAccount(req.params.id);
    res.json({ success: true });
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});