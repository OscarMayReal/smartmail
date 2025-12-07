import express from "express";
import { verifySessionMiddleware } from "./middleware.ts";
import "dotenv/config";
import { CreateFolder, getEmailById, getMailAccountFolders, getMailAccountMessages, moveEmail, sendEmail } from "./functions/mail.ts";
import { createMailAccount, deleteMailAccount, getAccountByAddress, getAccountsByUserId, getMailAccountById } from "./functions/mailaccounts.ts";
import { receiveEmail } from "./functions/mail.ts";
import { ListTenantMailAccounts } from "./functions/admin.ts";
import { CreateCalendar, CreateCalendarEvent, DeleteCalendarEvent, ListCalendarEvents, ListCalendars, UpdateCalendarEvent } from "./functions/calendar.ts";
import { verifyTenantAccountAccess } from "./functions/authorization.ts";

const app = express();

app.use("/mail", verifySessionMiddleware({ appId: process.env.APP_ID!, keystoneUrl: process.env.KEYSTONE_URL!, appSecret: process.env.APP_SECRET! }));
app.use("/admin", verifySessionMiddleware({ appId: process.env.APP_ID!, keystoneUrl: process.env.KEYSTONE_URL!, appSecret: process.env.APP_SECRET! }));
app.use("/calendar", verifySessionMiddleware({ appId: process.env.APP_ID!, keystoneUrl: process.env.KEYSTONE_URL!, appSecret: process.env.APP_SECRET! }));
app.use(express.json());

app.get("/mail/folders", async (req, res) => {
    try {
        const accounts = await getAccountsByUserId(req.sessionData.user.id);
        const folders = await getMailAccountFolders(accounts[0].id, req.sessionData.user.id);
        res.json(folders);
    } catch (error: any) {
        if (error.message?.includes("Unauthorized")) {
            res.status(403).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal server error" });
        }
    }
});

app.get("/mail/folders/:folderId/messages", async (req, res) => {
    try {
        const messages = await getMailAccountMessages(req.params.folderId, req.sessionData.user.id);
        res.json(messages);
    } catch (error: any) {
        if (error.message?.includes("Unauthorized")) {
            res.status(403).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal server error" });
        }
    }
});

app.get("/mail/messages/:messageId", async (req, res) => {
    try {
        const message = await getEmailById(req.params.messageId, req.sessionData.user.id);
        res.json(message);
    } catch (error: any) {
        if (error.message?.includes("Unauthorized")) {
            res.status(403).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal server error" });
        }
    }
});

app.post("/mail/messages/:messageId/move", async (req, res) => {
    try {
        const { folderId } = req.body;
        const message = await moveEmail({ id: req.params.messageId, folderId, userId: req.sessionData.user.id });
        res.json(message);
    } catch (error: any) {
        if (error.message?.includes("Unauthorized")) {
            res.status(403).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal server error" });
        }
    }
});

app.post("/mail/folders", async (req, res) => {
    try {
        const accounts = await getAccountsByUserId(req.sessionData.user.id);
        const folder = await CreateFolder({ accountId: accounts[0].id, name: req.body.name, type: "smartmail.folder.custom", userId: req.sessionData.user.id });
        const folders = await getMailAccountFolders(accounts[0].id, req.sessionData.user.id);
        res.json(folders);
    } catch (error: any) {
        if (error.message?.includes("Unauthorized")) {
            res.status(403).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal server error" });
        }
    }
});

app.post("/mail/send", async (req, res) => {
    try {
        console.log("Sending email");
        const accounts = await getAccountsByUserId(req.sessionData.user.id);
        const { email } = req.body;
        await sendEmail({ accountId: accounts[0].id, email, user: req.sessionData.user, userId: req.sessionData.user.id });
        res.json({ success: true });
    } catch (error: any) {
        if (error.message?.includes("Unauthorized")) {
            res.status(403).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal server error" });
        }
    }
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
    const accounts = await ListTenantMailAccounts(req.sessionData.tenant.id);
    res.json(accounts);
});

app.post("/admin/accounts", async (req, res) => {
    const { userId, address, domainId, color } = req.body;
    const account = await createMailAccount({ userId, address, domainId, color, organizationId: req.sessionData.tenant.id });
    res.json(account);
});

app.delete("/admin/accounts/:id", async (req, res) => {
    try {
        // Verify the account belongs to the tenant
        const getAccount = await getMailAccountById(req.params.id);
        const hasAccess = getAccount?.organizationId === req.sessionData.tenant.id;
        if (!hasAccess) {
            res.status(403).json({ error: "Unauthorized: Account does not belong to your organization" });
            return;
        }

        // Note: We're using the account owner's userId for deletion, not the admin's userId
        // This is acceptable for admin operations within the same tenant
        const account = await deleteMailAccount(req.params.id, getAccount?.userId);
        res.json({ success: true });
    } catch (error: any) {
        if (error.message?.includes("Unauthorized")) {
            res.status(403).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal server error" });
        }
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});

//calendar
app.get("/calendar/calendars", async (req, res) => {
    const calendars = await ListCalendars(req.sessionData.user.id);
    res.json(calendars);
});
app.post("/calendar/calendars", async (req, res) => {
    const accounts = await getAccountsByUserId(req.sessionData.user.id);
    const { name } = req.body;
    const calendar = await CreateCalendar({
        name,
        account: {
            connect: {
                id: accounts[0].id
            }
        }
    }, accounts[0].id, req.sessionData.user.id);
    res.json(calendar);
});
app.get("/calendar/:calendarId/events", async (req, res) => {
    try {
        const events = await ListCalendarEvents(req.params.calendarId, req.sessionData.user.id);
        res.json(events);
    } catch (error: any) {
        if (error.message?.includes("Unauthorized")) {
            res.status(403).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal server error" });
        }
    }
});

app.post("/calendar/:calendarId/events", async (req, res) => {
    try {
        const event = await CreateCalendarEvent(req.body, req.params.calendarId, req.sessionData.user.id);
        res.json(event);
    } catch (error: any) {
        if (error.message?.includes("Unauthorized")) {
            res.status(403).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal server error" });
        }
    }
});

app.put("/calendar/:calendarId/events/:id", async (req, res) => {
    try {
        const event = await UpdateCalendarEvent(req.body, req.sessionData.user.id);
        res.json(event);
    } catch (error: any) {
        if (error.message?.includes("Unauthorized")) {
            res.status(403).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal server error" });
        }
    }
});

app.delete("/calendar/:calendarId/events/:id", async (req, res) => {
    try {
        const event = await DeleteCalendarEvent(req.params.id, req.sessionData.user.id);
        res.json({ success: true });
    } catch (error: any) {
        if (error.message?.includes("Unauthorized")) {
            res.status(403).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal server error" });
        }
    }
});
