import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from '@prisma/adapter-pg'
import "dotenv/config";

var prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL
    })
});

/**
 * Verifies that a user has access to a specific folder
 * @param folderId - The folder ID to check
 * @param userId - The user ID attempting access
 * @returns true if authorized, false otherwise
 */
export async function verifyFolderAccess(folderId: string, userId: string): Promise<boolean> {
    const folder = await prisma.folder.findUnique({
        where: { id: folderId },
        include: {
            account: true
        }
    });

    if (!folder) {
        return false;
    }

    return folder.account.userId === userId;
}

/**
 * Verifies that a user has access to a specific email
 * @param emailId - The email ID to check
 * @param userId - The user ID attempting access
 * @returns true if authorized, false otherwise
 */
export async function verifyEmailAccess(emailId: string, userId: string): Promise<boolean> {
    const email = await prisma.email.findUnique({
        where: { id: emailId },
        include: {
            account: true
        }
    });

    if (!email) {
        return false;
    }

    return email.account.userId === userId;
}

/**
 * Verifies that a user has access to a specific calendar
 * @param calendarId - The calendar ID to check
 * @param userId - The user ID attempting access
 * @returns true if authorized, false otherwise
 */
export async function verifyCalendarAccess(calendarId: string, userId: string): Promise<boolean> {
    const calendar = await prisma.calendar.findUnique({
        where: { id: calendarId },
        include: {
            account: true
        }
    });

    if (!calendar) {
        return false;
    }

    return calendar.account.userId === userId;
}

/**
 * Verifies that a user has access to a specific event
 * User has access if they own the calendar OR if they are an invitee
 * @param eventId - The event ID to check
 * @param userId - The user ID attempting access
 * @returns true if authorized, false otherwise
 */
export async function verifyEventAccess(eventId: string, userId: string): Promise<boolean> {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
            calendar: {
                include: {
                    account: true
                }
            },
            invitees: {
                include: {
                    account: true
                }
            }
        }
    });

    if (!event) {
        return false;
    }

    // Check if user owns the calendar
    if (event.calendar.account.userId === userId) {
        return true;
    }

    // Check if user is an invitee (any of their email accounts is listed as an invitee)
    const isInvitee = event.invitees.some(invitee => invitee.account.userId === userId);

    return isInvitee;
}

/**
 * Verifies that a user has access to a specific email account
 * @param accountId - The account ID to check
 * @param userId - The user ID attempting access
 * @returns true if authorized, false otherwise
 */
export async function verifyAccountAccess(accountId: string, userId: string): Promise<boolean> {
    const account = await prisma.emailaccount.findUnique({
        where: { id: accountId }
    });

    if (!account) {
        return false;
    }

    return account.userId === userId;
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
