import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from '@prisma/adapter-pg'
import "dotenv/config";
import { verifyAccountAccess, verifyCalendarAccess, verifyEventAccess } from "./authorization.ts";
import type { calendarCreateInput, eventCreateInput } from "../generated/prisma/models.ts";

var prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL
    })
});

export async function ListCalendarEvents(calendarId: string, userId: string) {
    // Get user's email accounts to check for invitations
    const userAccounts = await prisma.emailaccount.findMany({
        where: { userId },
        select: { id: true }
    });

    const userAccountIds = userAccounts.map(acc => acc.id);

    // Return events where user owns the calendar OR is an invitee
    return await prisma.event.findMany({
        where: {
            calendarId: calendarId,
            OR: [
                {
                    // User owns the calendar
                    calendar: {
                        account: {
                            userId: userId
                        }
                    }
                },
                {
                    // User is an invitee (via any of their email accounts)
                    invitees: {
                        some: {
                            accountId: {
                                in: userAccountIds
                            }
                        }
                    }
                }
            ]
        }
    })
}

export async function CreateCalendarEvent(data: eventCreateInput, calendarId: string, userId: string) {
    // Verify user owns the calendar
    const hasAccess = await verifyCalendarAccess(calendarId, userId);
    if (!hasAccess) {
        throw new Error("Unauthorized: You do not have access to this calendar");
    }

    return await prisma.event.create({
        data: {
            start: data.start,
            end: data.end,
            allDay: data.allDay,
            calendarId,
            data: data.data || {},
            name: data.name
        }
    })
}

export async function UpdateCalendarEvent(data: any, userId: string) {
    // Verify user owns the event
    const hasAccess = await verifyEventAccess(data.id, userId);
    if (!hasAccess) {
        throw new Error("Unauthorized: You do not have access to this event");
    }

    return await prisma.event.update({
        where: {
            id: data.id
        },
        data: {
            start: data.start,
            end: data.end,
            allDay: data.allDay,
            calendarId: data.calendarId,
            data: data.data || {},
            name: data.title
        }
    })
}

export async function DeleteCalendarEvent(id: string, userId: string) {
    // Verify user owns the event
    const hasAccess = await verifyEventAccess(id, userId);
    if (!hasAccess) {
        throw new Error("Unauthorized: You do not have access to this event");
    }

    return await prisma.event.delete({
        where: {
            id: id
        }
    })
}

export async function ListCalendars(userId: string) {
    return await prisma.calendar.findMany({
        where: {
            account: {
                userId: userId
            }
        }
    })
}

export async function CreateCalendar(data: calendarCreateInput, accountId: string, userId: string) {
    // Verify user owns the account
    const hasAccess = await verifyAccountAccess(accountId, userId);
    if (!hasAccess) {
        throw new Error("Unauthorized: You do not have access to this account");
    }

    return await prisma.calendar.create({
        data: data
    })
}

export async function getEventById(id: string, userId: string) {
    // Verify user owns the event
    const hasAccess = await verifyEventAccess(id, userId);
    if (!hasAccess) {
        throw new Error("Unauthorized: You do not have access to this event");
    }

    return await prisma.event.findUnique({
        where: {
            id: id
        }
    })
}

export async function getCalendarById(id: string, userId: string) {
    // Verify user owns the calendar
    const hasAccess = await verifyCalendarAccess(id, userId);
    if (!hasAccess) {
        throw new Error("Unauthorized: You do not have access to this calendar");
    }

    return await prisma.calendar.findUnique({
        where: {
            id: id
        }
    })
}
