import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { getAccountsByUserId, getMailAccountForUser } from "./mailaccounts.ts";

const prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
    }),
});

export type TasksNotesAccess = {
    userId: string;
    organizationId?: string;
    groupIds?: string[];
};

type AccountScopedInput = TasksNotesAccess & { accountId?: string | null };

const accountOptions = (context: TasksNotesAccess) => ({
    userId: context.userId,
    organizationId: context.organizationId,
    groupIds: context.groupIds || [],
});

const requiredText = (value: unknown, field: string) => {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(`${field} is required`);
    }
    return value.trim();
};

async function resolveAccount({ accountId, ...context }: AccountScopedInput) {
    if (accountId) {
        const account = await getMailAccountForUser({
            accountId,
            ...accountOptions(context),
        });
        if (!account) {
            throw new Error("Unauthorized: You do not have access to this account");
        }
        return account;
    }

    const accounts = await getAccountsByUserId(
        context.userId,
        context.organizationId,
        context.groupIds || [],
    );
    if (!accounts[0]) {
        throw new Error("No mail account is configured for this user");
    }
    return accounts[0];
}

async function accessibleAccountIds(context: TasksNotesAccess, accountId?: string | null) {
    if (accountId) {
        const account = await resolveAccount({ accountId, ...context });
        return [account.id];
    }
    const accounts = await getAccountsByUserId(
        context.userId,
        context.organizationId,
        context.groupIds || [],
    );
    return accounts.map((account) => account.id);
}

async function assertListAccess(listId: string, context: TasksNotesAccess, accountId?: string) {
    const list = await prisma.tasksNotesList.findUnique({ where: { id: listId } });
    if (!list) {
        throw new Error("Tasks/notes list not found");
    }

    const account = await resolveAccount({ accountId: list.accountId, ...context });
    if (account.id !== list.accountId || (accountId && accountId !== list.accountId)) {
        throw new Error("Tasks/notes list does not belong to the selected account");
    }
    return list;
}

export async function listTasks({ accountId, listId, completed, ...context }: AccountScopedInput & {
    listId?: string | null;
    completed?: boolean;
}) {
    const accountIds = await accessibleAccountIds(context, accountId);
    if (listId) {
        await assertListAccess(listId, context, accountId || undefined);
    }

    return prisma.task.findMany({
        where: {
            accountId: { in: accountIds },
            ...(listId ? { listId } : {}),
            ...(completed === undefined ? {} : { completed }),
        },
        include: { list: true },
        orderBy: [{ completed: "asc" }, { createdAt: "desc" }],
    });
}

export async function getTask(id: string, context: TasksNotesAccess) {
    const task = await prisma.task.findUnique({ where: { id }, include: { list: true } });
    if (!task) {
        throw new Error("Task not found");
    }
    await resolveAccount({ accountId: task.accountId, ...context });
    return task;
}

export async function createTask({ name, completed, config, listId, accountId, ...context }: AccountScopedInput & {
    name: unknown;
    completed?: unknown;
    config?: unknown;
    listId?: unknown;
}) {
    const account = await resolveAccount({ accountId, ...context });
    const normalizedListId = listId === undefined || listId === null || listId === "" ? null : requiredText(listId, "listId");
    if (normalizedListId) {
        await assertListAccess(normalizedListId, context, account.id);
    }
    if (completed !== undefined && typeof completed !== "boolean") {
        throw new Error("completed must be a boolean");
    }

    return prisma.task.create({
        data: {
            name: requiredText(name, "name"),
            accountId: account.id,
            ...(completed === undefined ? {} : { completed }),
            ...(config === undefined ? {} : { config: config as any }),
            ...(normalizedListId ? { listId: normalizedListId } : {}),
        },
        include: { list: true },
    });
}

export async function updateTask(id: string, { name, completed, config, listId, ...context }: TasksNotesAccess & {
    name?: unknown;
    completed?: unknown;
    config?: unknown;
    listId?: unknown;
}) {
    const task = await getTask(id, context);
    if (name !== undefined) requiredText(name, "name");
    if (completed !== undefined && typeof completed !== "boolean") {
        throw new Error("completed must be a boolean");
    }

    let normalizedListId: string | null | undefined;
    if (listId !== undefined) {
        normalizedListId = listId === null || listId === "" ? null : requiredText(listId, "listId");
        if (normalizedListId) {
            await assertListAccess(normalizedListId, context, task.accountId);
        }
    }

    return prisma.task.update({
        where: { id },
        data: {
            ...(name === undefined ? {} : { name: requiredText(name, "name") }),
            ...(completed === undefined ? {} : { completed }),
            ...(config === undefined ? {} : { config: config as any }),
            ...(normalizedListId === undefined ? {} : { listId: normalizedListId }),
        },
        include: { list: true },
    });
}

export async function deleteTask(id: string, context: TasksNotesAccess) {
    await getTask(id, context);
    await prisma.task.delete({ where: { id } });
    return { success: true };
}

export async function listNotes({ accountId, listId, ...context }: AccountScopedInput & { listId?: string | null }) {
    const accountIds = await accessibleAccountIds(context, accountId);
    if (listId) {
        await assertListAccess(listId, context, accountId || undefined);
    }

    return prisma.note.findMany({
        where: {
            accountId: { in: accountIds },
            ...(listId ? { listId } : {}),
        },
        include: { list: true },
        orderBy: { updatedAt: "desc" },
    });
}

export async function getNote(id: string, context: TasksNotesAccess) {
    const note = await prisma.note.findUnique({ where: { id }, include: { list: true } });
    if (!note) {
        throw new Error("Note not found");
    }
    await resolveAccount({ accountId: note.accountId, ...context });
    return note;
}

export async function createNote({ title, content, config, listId, accountId, ...context }: AccountScopedInput & {
    title: unknown;
    content: unknown;
    config?: unknown;
    listId?: unknown;
}) {
    const account = await resolveAccount({ accountId, ...context });
    const normalizedListId = listId === undefined || listId === null || listId === "" ? null : requiredText(listId, "listId");
    if (content !== undefined && typeof content !== "string") {
        throw new Error("content must be a string");
    }
    if (normalizedListId) {
        await assertListAccess(normalizedListId, context, account.id);
    }

    return prisma.note.create({
        data: {
            title: requiredText(title, "title"),
            content: typeof content === "string" ? content : "",
            accountId: account.id,
            ...(config === undefined ? {} : { config: config as any }),
            ...(normalizedListId ? { listId: normalizedListId } : {}),
        },
        include: { list: true },
    });
}

export async function updateNote(id: string, { title, content, config, listId, ...context }: TasksNotesAccess & {
    title?: unknown;
    content?: unknown;
    config?: unknown;
    listId?: unknown;
}) {
    const note = await getNote(id, context);
    if (title !== undefined) requiredText(title, "title");
    if (content !== undefined && typeof content !== "string") {
        throw new Error("content must be a string");
    }

    let normalizedListId: string | null | undefined;
    if (listId !== undefined) {
        normalizedListId = listId === null || listId === "" ? null : requiredText(listId, "listId");
        if (normalizedListId) {
            await assertListAccess(normalizedListId, context, note.accountId);
        }
    }

    return prisma.note.update({
        where: { id },
        data: {
            ...(title === undefined ? {} : { title: requiredText(title, "title") }),
            ...(content === undefined ? {} : { content }),
            ...(config === undefined ? {} : { config: config as any }),
            ...(normalizedListId === undefined ? {} : { listId: normalizedListId }),
        },
        include: { list: true },
    });
}

export async function deleteNote(id: string, context: TasksNotesAccess) {
    await getNote(id, context);
    await prisma.note.delete({ where: { id } });
    return { success: true };
}

export async function listTasksNotesLists(context: TasksNotesAccess & { accountId?: string | null }) {
    const accountIds = await accessibleAccountIds(context, context.accountId);
    return prisma.tasksNotesList.findMany({
        where: { accountId: { in: accountIds } },
        include: { _count: { select: { tasks: true, notes: true } } },
        orderBy: { name: "asc" },
    });
}

export async function getTasksNotesList(id: string, context: TasksNotesAccess) {
    const list = await assertListAccess(id, context);
    return prisma.tasksNotesList.findUnique({
        where: { id: list.id },
        include: { tasks: true, notes: true, _count: { select: { tasks: true, notes: true } } },
    });
}

export async function createTasksNotesList({ name, accountId, ...context }: AccountScopedInput & { name: unknown }) {
    const account = await resolveAccount({ accountId, ...context });
    return prisma.tasksNotesList.create({
        data: { name: requiredText(name, "name"), accountId: account.id },
        include: { _count: { select: { tasks: true, notes: true } } },
    });
}

export async function updateTasksNotesList(id: string, { name, ...context }: TasksNotesAccess & { name?: unknown }) {
    await assertListAccess(id, context);
    return prisma.tasksNotesList.update({
        where: { id },
        data: { ...(name === undefined ? {} : { name: requiredText(name, "name") }) },
        include: { _count: { select: { tasks: true, notes: true } } },
    });
}

export async function deleteTasksNotesList(id: string, context: TasksNotesAccess) {
    await assertListAccess(id, context);
    await prisma.tasksNotesList.delete({ where: { id } });
    return { success: true };
}
