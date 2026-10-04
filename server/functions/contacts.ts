import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { getAccountsByUserId, getMailAccountForUser } from "./mailaccounts.ts";

const prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
    }),
});

export type ContactsAccess = {
    userId: string;
    organizationId?: string;
    groupIds?: string[];
};

type AccountScopedInput = ContactsAccess & { accountId?: string | null };

const accountOptions = (context: ContactsAccess) => ({
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

async function accessibleAccountIds(context: ContactsAccess, accountId?: string | null) {
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

export async function listContacts({ accountId, query, ...context }: AccountScopedInput & { query?: string }) {
    const accountIds = await accessibleAccountIds(context, accountId);
    const normalizedQuery = query?.trim();

    return prisma.contact.findMany({
        where: {
            accountId: { in: accountIds },
            ...(normalizedQuery
                ? { name: { contains: normalizedQuery, mode: "insensitive" } }
                : {}),
        },
        orderBy: { name: "asc" },
    });
}

export async function getContact(id: string, context: ContactsAccess) {
    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) {
        throw new Error("Contact not found");
    }

    await resolveAccount({ accountId: contact.accountId, ...context });
    return contact;
}

export async function createContact({ name, info, accountId, ...context }: AccountScopedInput & {
    name: unknown;
    info?: unknown;
}) {
    const account = await resolveAccount({ accountId, ...context });

    return prisma.contact.create({
        data: {
            name: requiredText(name, "name"),
            info: (info === undefined ? {} : info) as any,
            accountId: account.id,
        },
    });
}

export async function updateContact(id: string, { name, info, ...context }: ContactsAccess & {
    name?: unknown;
    info?: unknown;
}) {
    await getContact(id, context);

    if (name === undefined && info === undefined) {
        throw new Error("At least one contact field is required");
    }

    return prisma.contact.update({
        where: { id },
        data: {
            ...(name === undefined ? {} : { name: requiredText(name, "name") }),
            ...(info === undefined ? {} : { info: info as any }),
        },
    });
}

export async function deleteContact(id: string, context: ContactsAccess) {
    await getContact(id, context);
    await prisma.contact.delete({ where: { id } });
    return { success: true };
}
