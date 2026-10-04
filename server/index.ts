import express from "express";
import { verifySessionMiddleware } from "./middleware.ts";
import "dotenv/config";
import { CreateFolder, getEmailById, getMailAccountFolders, getMailAccountMessages, moveEmail, permanentlyDeleteEmail, searchMailMessages, sendEmail, setEmailReadState } from "./functions/mail.ts";
import { createMailAccount, createSharedMailAccount, deleteTenantMailAccount, getAccountByAddress, getAccountsByUserId, getMailAccountById, getMailAccountForUser, getTenantMailAccounts, updateSharedMailAccount } from "./functions/mailaccounts.ts";
import { receiveEmail } from "./functions/mail.ts";
import { ListTenantMailAccounts } from "./functions/admin.ts";
import { addDistributionListMember, createDistributionList, deleteDistributionList, listDistributionLists, receiveDistributionList, removeDistributionListMember, updateDistributionList } from "./functions/distributionlists.ts";
import { CreateCalendar, CreateCalendarEvent, CreateMeetingForCalendarEvent, DeleteCalendarEvent, GetMeetingForCalendarEvent, GetMeetingTokenForCalendarEvent, InvitePeopleToCalendarEvent, ListCalendarEvents, ListCalendars, ListInvitedCalendarEvents, RemoveCalendarInvitee, UpdateCalendarEvent, UpdateMeetingForCalendarEvent } from "./functions/calendar.ts";
import { verifyTenantAccountAccess } from "./functions/authorization.ts";
import { createNote, createTask, createTasksNotesList, deleteNote, deleteTask, deleteTasksNotesList, getNote, getTask, getTasksNotesList, listNotes, listTasks, listTasksNotesLists, updateNote, updateTask, updateTasksNotesList } from "./functions/tasksnotes.ts";
import { createContact, deleteContact, getContact, listContacts, updateContact } from "./functions/contacts.ts";

const app = express();

const sessionGroupIds = (req: express.Request) => {
    const user = req.sessionData.user as any;
    const memberships = [user.groups, user.groupIds, user.groupMemberships, user.memberships]
        .filter(Array.isArray)
        .flat();
    return [...new Set(memberships.flatMap((group: any) => [
        typeof group === "string" ? group : null,
        group?.id,
        group?.groupId,
        typeof group?.group === "string" ? group.group : null,
        group?.group?.id,
        group?.group?.groupId,
    ]).filter((groupId: unknown): groupId is string => typeof groupId === "string" && groupId.length > 0))];
};

const requiredAccountId = (value: unknown) => typeof value === "string" && value.trim().length > 0 ? value : null;

app.use("/mail", verifySessionMiddleware({ appId: process.env.APP_ID!, keystoneUrl: process.env.KEYSTONE_URL!, appSecret: process.env.APP_SECRET! }));
app.use("/admin", verifySessionMiddleware({ appId: process.env.APP_ID!, keystoneUrl: process.env.KEYSTONE_URL!, appSecret: process.env.APP_SECRET! }));
app.use("/calendar", verifySessionMiddleware({ appId: process.env.APP_ID!, keystoneUrl: process.env.KEYSTONE_URL!, appSecret: process.env.APP_SECRET! }));
app.use("/tasks", verifySessionMiddleware({ appId: process.env.APP_ID!, keystoneUrl: process.env.KEYSTONE_URL!, appSecret: process.env.APP_SECRET! }));
app.use("/notes", verifySessionMiddleware({ appId: process.env.APP_ID!, keystoneUrl: process.env.KEYSTONE_URL!, appSecret: process.env.APP_SECRET! }));
app.use("/tasks-notes", verifySessionMiddleware({ appId: process.env.APP_ID!, keystoneUrl: process.env.KEYSTONE_URL!, appSecret: process.env.APP_SECRET! }));
app.use("/contacts", verifySessionMiddleware({ appId: process.env.APP_ID!, keystoneUrl: process.env.KEYSTONE_URL!, appSecret: process.env.APP_SECRET! }));
app.use(express.json());

app.get("/mail/folders", async (req, res) => {
    try {
        const accountId = requiredAccountId(req.query.accountId);
        const account = accountId
            ? await getMailAccountForUser({ accountId, userId: req.sessionData.user.id, organizationId: req.sessionData.tenant.id, groupIds: sessionGroupIds(req) })
            : (await getAccountsByUserId(req.sessionData.user.id, req.sessionData.tenant.id, sessionGroupIds(req)))[0];
        if (!account) {
            res.status(404).json({ error: "No mail account is configured for this user" });
            return;
        }
        const folders = await getMailAccountFolders(account.id, req.sessionData.user.id, { organizationId: req.sessionData.tenant.id, groupIds: sessionGroupIds(req) });
        res.json(folders);
    } catch (error: any) {
        if (error.message?.includes("Unauthorized")) {
            res.status(403).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal server error" });
        }
    }
});

app.get("/mail/accounts", async (req, res) => {
    try {
        const accounts = await getAccountsByUserId(req.sessionData.user.id, req.sessionData.tenant.id, sessionGroupIds(req));
        res.json(accounts.map((account) => ({
            id: account.id,
            address: account.address,
            type: account.type,
            userId: account.userId,
            groupId: account.groupId,
            color: account.color,
        })));
    } catch (error: any) {
        res.status(500).json({ error: error.message || "Unable to load mailboxes" });
    }
});

app.get("/mail/search", async (req, res) => {
    try {
        const query = typeof req.query.q === "string" ? req.query.q : "";
        const accountId = requiredAccountId(req.query.accountId) || undefined;
        const folderId = requiredAccountId(req.query.folderId) || undefined;
        const messages = await searchMailMessages({
            query,
            accountId,
            folderId,
            userId: req.sessionData.user.id,
            organizationId: req.sessionData.tenant.id,
            groupIds: sessionGroupIds(req),
        });
        res.json(messages);
    } catch (error: any) {
        if (error.message?.includes("Unauthorized")) {
            res.status(403).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Unable to search mail" });
        }
    }
});

app.get("/mail/folders/:folderId/messages", async (req, res) => {
    try {
        const accountId = requiredAccountId(req.query.accountId);
        const messages = await getMailAccountMessages(req.params.folderId, req.sessionData.user.id, { organizationId: req.sessionData.tenant.id, groupIds: sessionGroupIds(req) }, accountId);
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
        const accountId = requiredAccountId(req.query.accountId);
        const message = await getEmailById(req.params.messageId, req.sessionData.user.id, { organizationId: req.sessionData.tenant.id, groupIds: sessionGroupIds(req) }, accountId);
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
        const accountId = requiredAccountId(req.body.accountId);
        const message = await moveEmail({ id: req.params.messageId, folderId, accountId, userId: req.sessionData.user.id, organizationId: req.sessionData.tenant.id, groupIds: sessionGroupIds(req) });
        res.json(message);
    } catch (error: any) {
        if (error.message?.includes("Unauthorized")) {
            res.status(403).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal server error" });
        }
    }
});

app.patch("/mail/messages/:messageId/read", async (req, res) => {
    try {
        const accountId = requiredAccountId(req.body.accountId);
        const message = await setEmailReadState({
            id: req.params.messageId,
            accountId,
            userId: req.sessionData.user.id,
            organizationId: req.sessionData.tenant.id,
            groupIds: sessionGroupIds(req),
            unseen: false,
        });
        res.json(message);
    } catch (error: any) {
        res.status(error.message?.includes("Unauthorized") ? 403 : 500).json({ error: error.message || "Unable to mark email as read" });
    }
});

app.patch("/mail/messages/:messageId/unread", async (req, res) => {
    try {
        const accountId = requiredAccountId(req.body.accountId);
        const message = await setEmailReadState({
            id: req.params.messageId,
            accountId,
            userId: req.sessionData.user.id,
            organizationId: req.sessionData.tenant.id,
            groupIds: sessionGroupIds(req),
            unseen: true,
        });
        res.json(message);
    } catch (error: any) {
        res.status(error.message?.includes("Unauthorized") ? 403 : 500).json({ error: error.message || "Unable to mark email as unread" });
    }
});

app.delete("/mail/messages/:messageId", async (req, res) => {
    try {
        const accountId = requiredAccountId(req.query.accountId);
        res.json(await permanentlyDeleteEmail({
            id: req.params.messageId,
            accountId,
            userId: req.sessionData.user.id,
            organizationId: req.sessionData.tenant.id,
            groupIds: sessionGroupIds(req),
        }));
    } catch (error: any) {
        res.status(error.message?.includes("Unauthorized") ? 403 : 500).json({ error: error.message || "Unable to permanently delete email" });
    }
});

app.post("/mail/folders", async (req, res) => {
    try {
        const accountId = requiredAccountId(req.body.accountId);
        const account = accountId
            ? await getMailAccountForUser({ accountId, userId: req.sessionData.user.id, organizationId: req.sessionData.tenant.id, groupIds: sessionGroupIds(req) })
            : (await getAccountsByUserId(req.sessionData.user.id, req.sessionData.tenant.id, sessionGroupIds(req)))[0];
        if (!account) {
            res.status(404).json({ error: "No mail account is configured for this user" });
            return;
        }
        const folder = await CreateFolder({ accountId: account.id, name: req.body.name, type: "smartmail.folder.custom", userId: req.sessionData.user.id, organizationId: req.sessionData.tenant.id, groupIds: sessionGroupIds(req) });
        const folders = await getMailAccountFolders(account.id, req.sessionData.user.id, { organizationId: req.sessionData.tenant.id, groupIds: sessionGroupIds(req) });
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
        const accountId = requiredAccountId(req.body.accountId);
        const account = accountId
            ? await getMailAccountForUser({ accountId, userId: req.sessionData.user.id, organizationId: req.sessionData.tenant.id, groupIds: sessionGroupIds(req) })
            : (await getAccountsByUserId(req.sessionData.user.id, req.sessionData.tenant.id, sessionGroupIds(req)))[0];
        if (!account) {
            res.status(404).json({ error: "No mail account is configured for this user" });
            return;
        }
        const { email } = req.body;
        await sendEmail({ accountId: account.id, email, user: req.sessionData.user, userId: req.sessionData.user.id, organizationId: req.sessionData.tenant.id, groupIds: sessionGroupIds(req) });
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
    const distributionListResult = await receiveDistributionList(address, email);
    if (distributionListResult.found) {
        if (!distributionListResult.accepted) {
            res.status(403).json({ success: false, error: distributionListResult.reason });
            return;
        }
        res.json({ success: true, delivered: distributionListResult.delivered });
        return;
    }
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
    try {
        const { userId, address, domainId, color } = req.body;
        if (!userId || !address || !domainId) {
            res.status(400).json({ error: "userId, address, and domainId are required" });
            return;
        }
        const account = await createMailAccount({ userId, address, domainId, color: color || "default", organizationId: req.sessionData.tenant.id });
        res.json(account);
    } catch (error: any) {
        if (error.message?.includes("Unauthorized")) {
            res.status(403).json({ error: error.message });
        } else if (error.code === "P2002") {
            res.status(409).json({ error: "An email account with this address already exists" });
        } else {
            res.status(500).json({ error: "Unable to create email account" });
        }
    }
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

        await deleteTenantMailAccount(req.params.id, req.sessionData.tenant.id);
        res.json({ success: true });
    } catch (error: any) {
        if (error.message?.includes("Unauthorized")) {
            res.status(403).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal server error" });
        }
    }
});

app.post("/admin/shared-mailboxes", async (req, res) => {
    try {
        const { address, domainId, groupId, color } = req.body;
        if (!address || !domainId || !groupId) {
            res.status(400).json({ error: "address, domainId, and groupId are required" });
            return;
        }
        res.status(201).json(await createSharedMailAccount({
            address,
            domainId,
            groupId,
            color: color || "default",
            organizationId: req.sessionData.tenant.id,
        }));
    } catch (error: any) {
        res.status(error.code === "P2002" ? 409 : 400).json({ error: error.message || "Unable to create shared mailbox" });
    }
});

app.patch("/admin/shared-mailboxes/:id", async (req, res) => {
    try {
        res.json(await updateSharedMailAccount({
            id: req.params.id,
            organizationId: req.sessionData.tenant.id,
            address: req.body.address,
            domainId: req.body.domainId,
            groupId: req.body.groupId,
            color: req.body.color,
        }));
    } catch (error: any) {
        res.status(error.code === "P2002" ? 409 : error.message?.includes("not found") ? 404 : 400).json({ error: error.message || "Unable to update shared mailbox" });
    }
});

app.get("/admin/shared-mailboxes", async (req, res) => {
    const accounts = await getTenantMailAccounts(req.sessionData.tenant.id);
    res.json(accounts.filter((account) => account.type === "shared"));
});

app.get("/admin/distribution-lists", async (req, res) => {
    try {
        res.json(await listDistributionLists(req.sessionData.tenant.id));
    } catch (error: any) {
        res.status(500).json({ error: error.message || "Unable to list distribution lists" });
    }
});

app.get("/admin/distribution-lists/:id", async (req, res) => {
    try {
        const lists = await listDistributionLists(req.sessionData.tenant.id);
        const list = lists.find((candidate) => candidate.id === req.params.id);
        if (!list) {
            res.status(404).json({ error: "Distribution list not found" });
            return;
        }
        res.json(list);
    } catch (error: any) {
        res.status(500).json({ error: error.message || "Unable to get distribution list" });
    }
});

app.post("/admin/distribution-lists", async (req, res) => {
    try {
        const { name, address, notes } = req.body;
        res.status(201).json(await createDistributionList({ tenantId: req.sessionData.tenant.id, name, address, notes }));
    } catch (error: any) {
        res.status(error.code === "P2002" ? 409 : 400).json({ error: error.message || "Unable to create distribution list" });
    }
});

app.patch("/admin/distribution-lists/:id", async (req, res) => {
    try {
        res.json(await updateDistributionList({ tenantId: req.sessionData.tenant.id, id: req.params.id, name: req.body.name, address: req.body.address, notes: req.body.notes }));
    } catch (error: any) {
        res.status(error.code === "P2002" ? 409 : error.message?.includes("not found") ? 404 : 400).json({ error: error.message || "Unable to update distribution list" });
    }
});

app.delete("/admin/distribution-lists/:id", async (req, res) => {
    try {
        res.json(await deleteDistributionList(req.params.id, req.sessionData.tenant.id));
    } catch (error: any) {
        res.status(error.message?.includes("not found") ? 404 : 400).json({ error: error.message || "Unable to delete distribution list" });
    }
});

app.post("/admin/distribution-lists/:id/members", async (req, res) => {
    try {
        const { name, email } = req.body;
        res.status(201).json(await addDistributionListMember({ tenantId: req.sessionData.tenant.id, distributionListId: req.params.id, name, email }));
    } catch (error: any) {
        res.status(error.code === "P2002" ? 409 : error.message?.includes("not found") ? 404 : 400).json({ error: error.message || "Unable to add distribution list member" });
    }
});

app.delete("/admin/distribution-lists/:id/members/:memberId", async (req, res) => {
    try {
        res.json(await removeDistributionListMember({ tenantId: req.sessionData.tenant.id, distributionListId: req.params.id, memberId: req.params.memberId }));
    } catch (error: any) {
        res.status(error.message?.includes("not found") ? 404 : 400).json({ error: error.message || "Unable to remove distribution list member" });
    }
});

const tasksNotesContext = (req: express.Request) => ({
    userId: req.sessionData.user.id,
    organizationId: req.sessionData.tenant.id,
    groupIds: sessionGroupIds(req),
});

const optionalBoolean = (value: unknown) => {
    if (value === undefined) return undefined;
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    throw new Error("completed must be a boolean");
};

const tasksNotesStatus = (error: any) => {
    const message = error?.message || "Unable to process tasks/notes request";
    if (message.includes("Unauthorized")) return 403;
    if (message.includes("not found")) return 404;
    if (message.includes("No mail account")) return 404;
    if (message.includes("required") || message.includes("must be") || message.includes("does not belong")) return 400;
    return 500;
};

const contactsContext = (req: express.Request) => ({
    userId: req.sessionData.user.id,
    organizationId: req.sessionData.tenant.id,
    groupIds: sessionGroupIds(req),
});

const calendarContext = (req: express.Request) => ({
    organizationId: req.sessionData.tenant.id,
    groupIds: sessionGroupIds(req),
});

const contactsStatus = (error: any) => {
    const message = error?.message || "Unable to process contacts request";
    if (message.includes("Unauthorized")) return 403;
    if (message.includes("not found")) return 404;
    if (message.includes("No mail account")) return 404;
    if (message.includes("required")) return 400;
    return 500;
};

// Contacts
app.get("/contacts", async (req, res) => {
    try {
        res.json(await listContacts({
            ...contactsContext(req),
            accountId: requiredAccountId(req.query.accountId),
            query: typeof req.query.q === "string" ? req.query.q : undefined,
        }));
    } catch (error: any) {
        res.status(contactsStatus(error)).json({ error: error.message || "Unable to list contacts" });
    }
});

app.post("/contacts", async (req, res) => {
    try {
        res.status(201).json(await createContact({
            ...contactsContext(req),
            name: req.body.name,
            info: req.body.info,
            accountId: requiredAccountId(req.body.accountId),
        }));
    } catch (error: any) {
        res.status(contactsStatus(error)).json({ error: error.message || "Unable to create contact" });
    }
});

app.get("/contacts/:id", async (req, res) => {
    try {
        res.json(await getContact(req.params.id, contactsContext(req)));
    } catch (error: any) {
        res.status(contactsStatus(error)).json({ error: error.message || "Unable to get contact" });
    }
});

app.patch("/contacts/:id", async (req, res) => {
    try {
        res.json(await updateContact(req.params.id, {
            ...contactsContext(req),
            name: req.body.name,
            info: req.body.info,
        }));
    } catch (error: any) {
        res.status(contactsStatus(error)).json({ error: error.message || "Unable to update contact" });
    }
});

app.delete("/contacts/:id", async (req, res) => {
    try {
        res.json(await deleteContact(req.params.id, contactsContext(req)));
    } catch (error: any) {
        res.status(contactsStatus(error)).json({ error: error.message || "Unable to delete contact" });
    }
});

// Tasks
app.get("/tasks", async (req, res) => {
    try {
        res.json(await listTasks({
            ...tasksNotesContext(req),
            accountId: requiredAccountId(req.query.accountId),
            listId: requiredAccountId(req.query.listId),
            completed: optionalBoolean(req.query.completed),
        }));
    } catch (error: any) {
        res.status(tasksNotesStatus(error)).json({ error: error.message || "Unable to list tasks" });
    }
});

app.post("/tasks", async (req, res) => {
    try {
        res.status(201).json(await createTask({
            ...tasksNotesContext(req),
            name: req.body.name,
            completed: req.body.completed,
            config: req.body.config,
            listId: req.body.listId,
            accountId: requiredAccountId(req.body.accountId),
        }));
    } catch (error: any) {
        res.status(tasksNotesStatus(error)).json({ error: error.message || "Unable to create task" });
    }
});

app.get("/tasks/:id", async (req, res) => {
    try {
        res.json(await getTask(req.params.id, tasksNotesContext(req)));
    } catch (error: any) {
        res.status(tasksNotesStatus(error)).json({ error: error.message || "Unable to get task" });
    }
});

app.patch("/tasks/:id", async (req, res) => {
    try {
        res.json(await updateTask(req.params.id, {
            ...tasksNotesContext(req),
            name: req.body.name,
            completed: req.body.completed,
            config: req.body.config,
            listId: req.body.listId,
        }));
    } catch (error: any) {
        res.status(tasksNotesStatus(error)).json({ error: error.message || "Unable to update task" });
    }
});

app.delete("/tasks/:id", async (req, res) => {
    try {
        res.json(await deleteTask(req.params.id, tasksNotesContext(req)));
    } catch (error: any) {
        res.status(tasksNotesStatus(error)).json({ error: error.message || "Unable to delete task" });
    }
});

// Notes
app.get("/notes", async (req, res) => {
    try {
        res.json(await listNotes({
            ...tasksNotesContext(req),
            accountId: requiredAccountId(req.query.accountId),
            listId: requiredAccountId(req.query.listId),
        }));
    } catch (error: any) {
        res.status(tasksNotesStatus(error)).json({ error: error.message || "Unable to list notes" });
    }
});

app.post("/notes", async (req, res) => {
    try {
        res.status(201).json(await createNote({
            ...tasksNotesContext(req),
            title: req.body.title,
            content: req.body.content,
            config: req.body.config,
            listId: req.body.listId,
            accountId: requiredAccountId(req.body.accountId),
        }));
    } catch (error: any) {
        res.status(tasksNotesStatus(error)).json({ error: error.message || "Unable to create note" });
    }
});

app.get("/notes/:id", async (req, res) => {
    try {
        res.json(await getNote(req.params.id, tasksNotesContext(req)));
    } catch (error: any) {
        res.status(tasksNotesStatus(error)).json({ error: error.message || "Unable to get note" });
    }
});

app.patch("/notes/:id", async (req, res) => {
    try {
        res.json(await updateNote(req.params.id, {
            ...tasksNotesContext(req),
            title: req.body.title,
            content: req.body.content,
            config: req.body.config,
            listId: req.body.listId,
        }));
    } catch (error: any) {
        res.status(tasksNotesStatus(error)).json({ error: error.message || "Unable to update note" });
    }
});

app.delete("/notes/:id", async (req, res) => {
    try {
        res.json(await deleteNote(req.params.id, tasksNotesContext(req)));
    } catch (error: any) {
        res.status(tasksNotesStatus(error)).json({ error: error.message || "Unable to delete note" });
    }
});

// Shared task/note lists
app.get("/tasks-notes/lists", async (req, res) => {
    try {
        res.json(await listTasksNotesLists({ ...tasksNotesContext(req), accountId: requiredAccountId(req.query.accountId) }));
    } catch (error: any) {
        res.status(tasksNotesStatus(error)).json({ error: error.message || "Unable to list task/note lists" });
    }
});

app.post("/tasks-notes/lists", async (req, res) => {
    try {
        res.status(201).json(await createTasksNotesList({
            ...tasksNotesContext(req),
            name: req.body.name,
            accountId: requiredAccountId(req.body.accountId),
        }));
    } catch (error: any) {
        res.status(tasksNotesStatus(error)).json({ error: error.message || "Unable to create task/note list" });
    }
});

app.get("/tasks-notes/lists/:id", async (req, res) => {
    try {
        res.json(await getTasksNotesList(req.params.id, tasksNotesContext(req)));
    } catch (error: any) {
        res.status(tasksNotesStatus(error)).json({ error: error.message || "Unable to get task/note list" });
    }
});

app.patch("/tasks-notes/lists/:id", async (req, res) => {
    try {
        res.json(await updateTasksNotesList(req.params.id, {
            ...tasksNotesContext(req),
            name: req.body.name,
        }));
    } catch (error: any) {
        res.status(tasksNotesStatus(error)).json({ error: error.message || "Unable to update task/note list" });
    }
});

app.delete("/tasks-notes/lists/:id", async (req, res) => {
    try {
        res.json(await deleteTasksNotesList(req.params.id, tasksNotesContext(req)));
    } catch (error: any) {
        res.status(tasksNotesStatus(error)).json({ error: error.message || "Unable to delete task/note list" });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});

//calendar
app.get("/calendar/calendars", async (req, res) => {
    const calendars = await ListCalendars(req.sessionData.user.id, calendarContext(req));
    res.json(calendars);
});
app.get("/calendar/invited-events", async (req, res) => {
    try {
        const events = await ListInvitedCalendarEvents(req.sessionData.user.id, calendarContext(req));
        res.json(events);
    } catch (error) {
        console.error("Unable to list invited calendar events", error);
        res.status(500).json({ error: "Unable to list invited events" });
    }
});
app.post("/calendar/calendars", async (req, res) => {
    const access = calendarContext(req);
    const requestedAccountId = requiredAccountId(req.body.accountId);
    const account = requestedAccountId
        ? await getMailAccountForUser({ accountId: requestedAccountId, userId: req.sessionData.user.id, ...access })
        : (await getAccountsByUserId(req.sessionData.user.id, access.organizationId, access.groupIds))[0];
    if (!account) {
        if (requestedAccountId) {
            res.status(403).json({ error: "Unauthorized: You do not have access to this account" });
            return;
        }
        res.status(404).json({ error: "No mail account is configured for this user" });
        return;
    }
    const { name } = req.body;
    const calendar = await CreateCalendar({
        name,
        account: {
            connect: {
                id: account.id
            }
        }
    }, account.id, req.sessionData.user.id, access);
    res.json(calendar);
});
app.get("/calendar/:calendarId/events", async (req, res) => {
    try {
        const events = await ListCalendarEvents(req.params.calendarId, req.sessionData.user.id, calendarContext(req));
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
        const event = await CreateCalendarEvent(req.body, req.params.calendarId, req.sessionData.user.id, calendarContext(req));
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
        const event = await UpdateCalendarEvent(req.body, req.sessionData.user.id, req.sessionData, calendarContext(req));
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
        await DeleteCalendarEvent(req.params.id, req.sessionData.user.id, req.params.calendarId, calendarContext(req));
        res.json({ success: true });
    } catch (error: any) {
        if (error.message?.includes("Unauthorized")) {
            res.status(403).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal server error" });
        }
    }
});

app.post("/calendar/:calendarId/events/:id/invitees", async (req, res) => {
    try {
        const event = await InvitePeopleToCalendarEvent({
            eventId: req.params.id,
            calendarId: req.params.calendarId,
            userId: req.sessionData.user.id,
            invitees: Array.isArray(req.body.invitees) ? req.body.invitees : [],
            session: req.sessionData,
            access: calendarContext(req),
        });
        res.json(event);
    } catch (error: any) {
        const status = error.message?.includes("Unauthorized") ? 403 : error.message?.includes("not found") ? 404 : 400;
        res.status(status).json({ error: error.message || "Unable to invite people" });
    }
});

app.delete("/calendar/:calendarId/events/:id/invitees/:inviteeId", async (req, res) => {
    try {
        res.json(await RemoveCalendarInvitee({
            eventId: req.params.id,
            calendarId: req.params.calendarId,
            inviteeId: req.params.inviteeId,
            userId: req.sessionData.user.id,
            access: calendarContext(req),
        }));
    } catch (error: any) {
        const status = error.message?.includes("Unauthorized") ? 403 : error.message?.includes("not found") ? 404 : 400;
        res.status(status).json({ error: error.message || "Unable to remove invitee" });
    }
});

app.post("/calendar/:calendarId/events/:id/meeting", async (req, res) => {
    try {
        res.json(await CreateMeetingForCalendarEvent({
            eventId: req.params.id,
            calendarId: req.params.calendarId,
            userId: req.sessionData.user.id,
            session: req.sessionData,
            accessPolicy: req.body.accessPolicy,
            participants: req.body.participants,
            occurrenceStart: req.body.occurrenceStart,
            occurrenceEnd: req.body.occurrenceEnd,
            access: calendarContext(req),
        }));
    } catch (error: any) {
        const status = error.status || (error.message?.includes("Unauthorized") ? 403 : 500);
        res.status(status).json({ error: error.message || "Unable to create meeting" });
    }
});

app.get("/calendar/:calendarId/events/:id/meeting", async (req, res) => {
    try {
        const result = await GetMeetingForCalendarEvent({
            eventId: req.params.id,
            calendarId: req.params.calendarId,
            userId: req.sessionData.user.id,
            session: req.sessionData,
            access: calendarContext(req),
        });
        if (!result) {
            res.status(404).json({ error: "This event does not have a communication meeting" });
            return;
        }
        res.json(result);
    } catch (error: any) {
        const status = error.status || (error.message?.includes("Unauthorized") ? 403 : 500);
        res.status(status).json({ error: error.message || "Unable to get meeting" });
    }
});

app.patch("/calendar/:calendarId/events/:id/meeting", async (req, res) => {
    try {
        res.json(await UpdateMeetingForCalendarEvent({
            eventId: req.params.id,
            calendarId: req.params.calendarId,
            userId: req.sessionData.user.id,
            session: req.sessionData,
            accessPolicy: req.body.accessPolicy,
            participants: req.body.participants,
            occurrenceStart: req.body.occurrenceStart,
            occurrenceEnd: req.body.occurrenceEnd,
            access: calendarContext(req),
        }));
    } catch (error: any) {
        const status = error.status || (error.message?.includes("Unauthorized") ? 403 : 500);
        res.status(status).json({ error: error.message || "Unable to update meeting" });
    }
});

app.post("/calendar/:calendarId/events/:id/meeting/token", async (req, res) => {
    try {
        res.json(await GetMeetingTokenForCalendarEvent({
            eventId: req.params.id,
            calendarId: req.params.calendarId,
            userId: req.sessionData.user.id,
            session: req.sessionData,
            occurrenceStart: req.body.occurrenceStart,
            occurrenceEnd: req.body.occurrenceEnd,
            access: calendarContext(req),
        }));
    } catch (error: any) {
        const status = error.status || (error.message?.includes("Unauthorized") ? 403 : 500);
        res.status(status).json({ error: error.message || "Unable to get meeting token" });
    }
});
