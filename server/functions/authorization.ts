import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from '@prisma/adapter-pg'
import "dotenv/config";

var prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL
    })
});

export type AccountAccess = {
    organizationId?: string;
    groupIds?: string[];
};

export const accountAccessWhere = (userId: string, access: AccountAccess = {}) => ({
    ...(access.organizationId ? { organizationId: access.organizationId } : {}),
    OR: [
        { userId },
        ...(access.groupIds?.length ? [{ type: "shared" as const, groupId: { in: access.groupIds } }] : []),
    ],
});

/**
 * Verifies that a user has access to a specific folder
 * @param folderId - The folder ID to check
 * @param userId - The user ID attempting access
 * @returns true if authorized, false otherwise
 */
export async function verifyFolderAccess(folderId: string, userId: string, access: AccountAccess = {}): Promise<boolean> {
    const folder = await prisma.folder.findFirst({
        where: { id: folderId, account: accountAccessWhere(userId, access) },
        select: { id: true },
    });

    return Boolean(folder);
}

/**
 * Verifies that a user has access to a specific email
 * @param emailId - The email ID to check
 * @param userId - The user ID attempting access
 * @returns true if authorized, false otherwise
 */
export async function verifyEmailAccess(emailId: string, userId: string, access: AccountAccess = {}): Promise<boolean> {
    const email = await prisma.email.findFirst({
        where: { id: emailId, account: accountAccessWhere(userId, access) },
        select: { id: true },
    });

    return Boolean(email);
}

/**
 * Verifies that a user has access to a specific calendar
 * @param calendarId - The calendar ID to check
 * @param userId - The user ID attempting access
 * @returns true if authorized, false otherwise
 */
export async function verifyCalendarAccess(calendarId: string, userId: string, access: AccountAccess = {}): Promise<boolean> {
    const calendar = await prisma.calendar.findFirst({
        where: { id: calendarId, account: accountAccessWhere(userId, access) },
        select: { id: true },
    });

    return Boolean(calendar);
}

/**
 * Verifies that a user has access to a specific event
 * User has access if they own the calendar OR if they are an invitee
 * @param eventId - The event ID to check
 * @param userId - The user ID attempting access
 * @returns true if authorized, false otherwise
 */
export async function verifyEventAccess(eventId: string, userId: string, access: AccountAccess = {}): Promise<boolean> {
    const accessibleAccounts = await prisma.emailaccount.findMany({
        where: accountAccessWhere(userId, access),
        select: { id: true },
    });

    const event = await prisma.event.findFirst({
        where: {
            id: eventId,
            OR: [
                { calendar: { account: accountAccessWhere(userId, access) } },
                ...(accessibleAccounts.length > 0
                    ? [{ invitees: { some: { accountId: { in: accessibleAccounts.map((account) => account.id) } } } }]
                    : []),
            ],
        },
        select: { id: true },
    });

    return Boolean(event);
}

/**
 * Verifies that a user has access to a specific email account
 * @param accountId - The account ID to check
 * @param userId - The user ID attempting access
 * @returns true if authorized, false otherwise
 */
export async function verifyAccountAccess(accountId: string, userId: string, access: AccountAccess = {}): Promise<boolean> {
    const account = await prisma.emailaccount.findFirst({
        where: { id: accountId, ...accountAccessWhere(userId, access) },
        select: { id: true },
    });

    return Boolean(account);
}

/**
 * Verifies that an email account belongs to a specific tenant
 * @param accountId - The account ID to check
 * @param tenantId - The tenant ID attempting access
 * @returns true if authorized, false otherwise
 */
export async function verifyTenantAccountAccess(accountId: string, tenantId: string): Promise<boolean> {
    const account = await prisma.emailaccount.findUnique({
        where: { id: accountId }
    });

    if (!account) {
        return false;
    }

    return account.organizationId === tenantId;
}
