import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from '@prisma/adapter-pg'
import "dotenv/config";
import { accountAccessWhere, verifyAccountAccess, verifyCalendarAccess, verifyEventAccess, type AccountAccess } from "./authorization.ts";
import { getAccountsByUserId } from "./mailaccounts.ts";
import type { calendarCreateInput, eventCreateInput } from "../generated/prisma/models.ts";
import type { SessionData } from "../keystone.ts";
import {
    createMeeting,
    getMeeting,
    getMeetingToken,
    updateMeeting,
    CommunicationServicesError,
    type CommunicationMeeting,
    type CalendarMeetingSchedule,
    type MeetingAccessPolicy,
    type MeetingParticipantInput,
} from "./communicationservices.ts";

var prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL
    })
});

export async function ListCalendarEvents(calendarId: string, userId: string, access: AccountAccess = {}) {
    const userAccounts = await getAccountsByUserId(userId, access.organizationId, access.groupIds || []);
    const userAccountIds = userAccounts.map((account) => account.id);

    // Return events where user owns the calendar OR is an invitee
    const events = await prisma.event.findMany({
        where: {
            calendarId: calendarId,
            OR: [
                {
                    // User owns the calendar
                    calendar: {
                        account: accountAccessWhere(userId, access),
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
        },
        include: { invitees: { include: { account: { select: { userId: true, address: true } } } } },
    });
    return expandAndDedupeCalendarEvents(events);
}

export async function ListInvitedCalendarEvents(userId: string, access: AccountAccess = {}) {
    const userAccounts = await getAccountsByUserId(userId, access.organizationId, access.groupIds || []);

    const events = await prisma.event.findMany({
        where: {
            invitees: {
                some: { accountId: { in: userAccounts.map((account) => account.id) } },
            },
        },
        include: { invitees: { include: { account: { select: { userId: true, address: true } } } } },
        orderBy: { start: "asc" },
    });
    return expandAndDedupeCalendarEvents(events);
}

export async function CreateCalendarEvent(data: eventCreateInput, calendarId: string, userId: string, access: AccountAccess = {}) {
    // Verify user owns the calendar
    const hasAccess = await verifyCalendarAccess(calendarId, userId, access);
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

const getEventData = (value: unknown): Record<string, any> => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value as Record<string, any>;
    }
    return {};
};

const getCommunicationMeetingId = (value: unknown) => {
    const meeting = getEventData(value).communicationMeeting;
    return meeting && typeof meeting.meetingId === "string" ? meeting.meetingId : null;
};

const getCalendarRecurrence = (value: unknown): { frequency: string; count?: number; until?: string } | null => {
    const recurrence = getEventData(value).recurrence;
    if (typeof recurrence === "string") {
        return recurrence === "NONE" ? null : { frequency: recurrence };
    }
    if (!recurrence || typeof recurrence !== "object" || typeof recurrence.frequency !== "string" || recurrence.frequency === "NONE") {
        return null;
    }
    return {
        frequency: recurrence.frequency,
        ...(typeof recurrence.count === "number" ? { count: recurrence.count } : {}),
        ...(typeof recurrence.until === "string" ? { until: recurrence.until } : {}),
    };
};

const advanceOccurrence = (date: Date, frequency: string) => {
    const next = new Date(date);
    if (frequency === "DAILY") next.setDate(next.getDate() + 1);
    else if (frequency === "WEEKLY") next.setDate(next.getDate() + 7);
    else if (frequency === "MONTHLY") next.setMonth(next.getMonth() + 1);
    else if (frequency === "YEARLY") next.setFullYear(next.getFullYear() + 1);
    else return null;
    return next;
};

const calendarExpansionWindowMs = 366 * 24 * 60 * 60 * 1000;
const maxExpandedCalendarOccurrences = 500;

const expandCalendarEvent = (event: any) => {
    const recurrence = getCalendarRecurrence(event.data);
    if (!recurrence) return [event];

    const duration = new Date(event.end).getTime() - new Date(event.start).getTime();
    const windowStart = Date.now() - calendarExpansionWindowMs;
    const windowEnd = Date.now() + calendarExpansionWindowMs;
    let occurrenceStart = new Date(event.start);
    let occurrenceIndex = 0;
    const occurrences = [];

    while (occurrenceStart.getTime() <= windowEnd && occurrences.length < maxExpandedCalendarOccurrences) {
        if (recurrence.count !== undefined && occurrenceIndex >= recurrence.count) break;
        if (recurrence.until && occurrenceStart.getTime() > new Date(recurrence.until).getTime()) break;
        const occurrenceEnd = new Date(occurrenceStart.getTime() + duration);
        if (occurrenceEnd.getTime() >= windowStart) {
            occurrences.push({
                ...event,
                id: `${event.id}::${occurrenceStart.toISOString()}`,
                seriesEventId: event.id,
                seriesStart: event.start,
                seriesEnd: event.end,
                occurrenceStart,
                occurrenceEnd,
                start: occurrenceStart,
                end: occurrenceEnd,
            });
        }
        const nextStart = advanceOccurrence(occurrenceStart, recurrence.frequency);
        if (!nextStart) break;
        occurrenceStart = nextStart;
        occurrenceIndex += 1;
    }
    // A recurring series with no occurrence in the expansion window should not
    // fall back to the parent event. That fallback made an expired series look
    // like one extra copy of its first occurrence.
    return occurrences;
};

const expandAndDedupeCalendarEvents = (events: any[]) => {
    const byOccurrence = new Map<string, any>();
    for (const event of events.flatMap(expandCalendarEvent)) {
        const seriesId = event.seriesEventId || event.id;
        const start = new Date(event.occurrenceStart || event.start);
        const end = new Date(event.occurrenceEnd || event.end);
        const key = `${event.calendarId}:${seriesId}:${start.toISOString()}:${end.toISOString()}`;
        // Prefer expanded rows because they carry occurrence metadata.
        if (!byOccurrence.has(key) || event.seriesEventId) {
            byOccurrence.set(key, event);
        }
    }
    return [...byOccurrence.values()];
};

const getCalendarOccurrence = (event: { id: string; start: Date; end: Date; data: unknown }) => {
    const recurrence = getCalendarRecurrence(event.data);
    const duration = event.end.getTime() - event.start.getTime();
    let occurrenceStart = new Date(event.start);
    let occurrenceEnd = new Date(event.end);
    let occurrenceIndex = 0;
    const now = Date.now();
    while (occurrenceEnd.getTime() <= now) {
        if (!recurrence || (recurrence.count !== undefined && occurrenceIndex + 1 >= recurrence.count)) {
            return null;
        }
        const nextStart = advanceOccurrence(occurrenceStart, recurrence.frequency);
        if (!nextStart) return null;
        if (recurrence.until && nextStart.getTime() > new Date(recurrence.until).getTime()) {
            return null;
        }
        occurrenceStart = nextStart;
        occurrenceEnd = new Date(nextStart.getTime() + duration);
        occurrenceIndex += 1;
        if (occurrenceIndex > 10000) return null;
    }
    return { occurrenceStart, occurrenceEnd, recurrence };
};

const getCalendarMeetingSchedule = (event: { id: string; start: Date; end: Date; data: unknown }, occurrenceStart?: string, occurrenceEnd?: string): CalendarMeetingSchedule | null => {
    if (occurrenceStart && occurrenceEnd) {
        const start = new Date(occurrenceStart);
        const end = new Date(occurrenceEnd);
        if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start) {
            return {
                eventId: event.id,
                occurrenceStart: start.toISOString(),
                occurrenceEnd: end.toISOString(),
                recurrence: getCalendarRecurrence(event.data),
            };
        }
    }
    const occurrence = getCalendarOccurrence(event);
    if (!occurrence) return null;
    return {
        eventId: event.id,
        occurrenceStart: occurrence.occurrenceStart.toISOString(),
        occurrenceEnd: occurrence.occurrenceEnd.toISOString(),
        recurrence: occurrence.recurrence,
    };
};

const sameCalendarOccurrence = (meeting: CommunicationMeeting, schedule: CalendarMeetingSchedule) =>
    meeting.calendarEventId === schedule.eventId
    && meeting.calendarOccurrenceStart === schedule.occurrenceStart
    && meeting.calendarOccurrenceEnd === schedule.occurrenceEnd;

const meetingOccurrenceIsActive = (meeting: CommunicationMeeting) =>
    Boolean(meeting.calendarOccurrenceEnd && new Date(meeting.calendarOccurrenceEnd).getTime() > Date.now());

const getOwnedEvent = async (eventId: string, calendarId: string, userId: string, access: AccountAccess = {}) => {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { calendar: { include: { account: true } } },
    });
    if (!event || event.calendarId !== calendarId) {
        throw new Error("Event not found");
    }
    if (!await verifyCalendarAccess(event.calendarId, userId, access)) {
        throw new Error("Unauthorized: You do not have access to this event");
    }
    return event;
};

export async function UpdateCalendarEvent(data: any, userId: string, session?: SessionData, access: AccountAccess = {}) {
    // Verify user owns the event
    const hasAccess = await verifyEventAccess(data.id, userId, access);
    if (!hasAccess) {
        throw new Error("Unauthorized: You do not have access to this event");
    }

    const currentEvent = await prisma.event.findUnique({ where: { id: data.id } });
    if (!currentEvent) {
        throw new Error("Event not found");
    }
    if (data.calendarId && data.calendarId !== currentEvent.calendarId && !await verifyCalendarAccess(data.calendarId, userId, access)) {
        throw new Error("Unauthorized: You do not have access to the target calendar");
    }
    const incomingData = data.data === undefined ? {} : getEventData(data.data);
    const preservedData = {
        ...getEventData(currentEvent.data),
        ...incomingData,
    };

    const updatedEvent = await prisma.event.update({
        where: {
            id: data.id
        },
        data: {
            start: data.start,
            end: data.end,
            allDay: data.allDay,
            calendarId: data.calendarId,
            data: preservedData,
            name: data.name ?? data.title
        }
    });

    const meetingId = getCommunicationMeetingId(updatedEvent.data);
    if (meetingId && session) {
        await updateMeeting({
            meetingId,
            session,
            title: updatedEvent.name,
            calendar: getCalendarMeetingSchedule(updatedEvent) || undefined,
        });
    }

    return updatedEvent;
}

export async function DeleteCalendarEvent(id: string, userId: string, calendarId?: string, access: AccountAccess = {}) {
    if (calendarId) {
        await getOwnedEvent(id, calendarId, userId, access);
    } else if (!await verifyEventAccess(id, userId, access)) {
        throw new Error("Unauthorized: You do not have access to this event");
    }

    return await prisma.event.delete({
        where: {
            id: id
        }
    })
}

export async function ListCalendars(userId: string, access: AccountAccess = {}) {
    const accounts = await getAccountsByUserId(userId, access.organizationId, access.groupIds || []);
    return await prisma.calendar.findMany({
        where: { accountId: { in: accounts.map((account) => account.id) } },
    })
}

export async function CreateCalendar(data: calendarCreateInput, accountId: string, userId: string, access: AccountAccess = {}) {
    // Verify user owns the account
    const hasAccess = await verifyAccountAccess(accountId, userId, access);
    if (!hasAccess) {
        throw new Error("Unauthorized: You do not have access to this account");
    }

    return await prisma.calendar.create({
        data: data
    })
}

export async function getEventById(id: string, userId: string, access: AccountAccess = {}) {
    // Verify user owns the event
    const hasAccess = await verifyEventAccess(id, userId, access);
    if (!hasAccess) {
        throw new Error("Unauthorized: You do not have access to this event");
    }

    return await prisma.event.findUnique({
        where: {
            id: id
        }
    })
}

export async function getCalendarById(id: string, userId: string, access: AccountAccess = {}) {
    // Verify user owns the calendar
    const hasAccess = await verifyCalendarAccess(id, userId, access);
    if (!hasAccess) {
        throw new Error("Unauthorized: You do not have access to this calendar");
    }

    return await prisma.calendar.findUnique({
        where: {
            id: id
        }
    })
}

export async function InvitePeopleToCalendarEvent({
    eventId,
    calendarId,
    userId,
    invitees,
    session,
    access = {},
}: {
    eventId: string;
    calendarId: string;
    userId: string;
    invitees: Array<{ userId?: string; accountId?: string; email?: string; name?: string }>;
    session?: SessionData;
    access?: AccountAccess;
}) {
    const event = await getOwnedEvent(eventId, calendarId, userId, access);
    const accountIds = new Set<string>();
    const rows: Array<{ name: string; accountId: string; eventId: string; calendarId: string }> = [];

    for (const invitee of invitees) {
        const account = invitee.userId
            ? await prisma.emailaccount.findFirst({ where: { userId: invitee.userId } })
            : invitee.accountId
                ? await prisma.emailaccount.findUnique({ where: { id: invitee.accountId } })
                : invitee.email
                    ? await prisma.emailaccount.findUnique({ where: { address: invitee.email } })
                    : null;
        if (!account) {
            throw new Error(`Invitee account not found: ${invitee.email || invitee.userId || invitee.accountId || "unknown"}`);
        }
        if (session && account.organizationId && account.organizationId !== session.tenant.id) {
            throw new Error("Invitee does not belong to your organization");
        }
        if (accountIds.has(account.id)) {
            continue;
        }
        accountIds.add(account.id);
        rows.push({
            name: invitee.name || account.address,
            accountId: account.id,
            eventId: event.id,
            calendarId: event.calendarId,
        });
    }

    const existing = accountIds.size > 0
        ? await prisma.invitee.findMany({
            where: { eventId: event.id, accountId: { in: [...accountIds] } },
            select: { accountId: true },
        })
        : [];
    const existingIds = new Set(existing.map((item) => item.accountId));
    const newRows = rows.filter((row) => !existingIds.has(row.accountId));
    if (newRows.length > 0) {
        await prisma.invitee.createMany({ data: newRows });
    }

    const meetingId = getCommunicationMeetingId(event.data);
    if (meetingId && session) {
        const meeting = await getMeeting(meetingId, session);
        if (meeting.accessPolicy === "INVITE_ONLY") {
            const invitedAccounts = await prisma.invitee.findMany({
                where: { eventId: event.id },
                include: { account: { select: { userId: true } } },
            });
            const existingParticipants = meeting.participants || [];
            const participantIds = new Set(existingParticipants.map((participant) => participant.userId));
            const participants = [...existingParticipants];
            for (const invitedAccount of invitedAccounts) {
                if (!participantIds.has(invitedAccount.account.userId!)) {
                    participants.push({ userId: invitedAccount.account.userId!, role: "MEMBER" });
                }
            }
            await updateMeeting({ meetingId, session, participants });
        }
    }

    return prisma.event.findUnique({
        where: { id: event.id },
        include: { invitees: { include: { account: { select: { userId: true, address: true } } } } },
    });
}

export async function RemoveCalendarInvitee({
    eventId,
    calendarId,
    inviteeId,
    userId,
    access = {},
}: {
    eventId: string;
    calendarId: string;
    inviteeId: string;
    userId: string;
    access?: AccountAccess;
}) {
    const event = await getOwnedEvent(eventId, calendarId, userId, access);
    const result = await prisma.invitee.deleteMany({ where: { id: inviteeId, eventId: event.id } });
    if (result.count === 0) {
        throw new Error("Invitee not found");
    }
    return { success: true };
}

export async function CreateMeetingForCalendarEvent({
    eventId,
    calendarId,
    userId,
    session,
    accessPolicy = "ANYONE",
    participants,
    occurrenceStart,
    occurrenceEnd,
    access = {},
}: {
    eventId: string;
    calendarId: string;
    userId: string;
    session: SessionData;
    accessPolicy?: MeetingAccessPolicy;
    participants?: MeetingParticipantInput[];
    occurrenceStart?: string;
    occurrenceEnd?: string;
    access?: AccountAccess;
}): Promise<{ event: any; meeting: CommunicationMeeting }> {
    const event = await getOwnedEvent(eventId, calendarId, userId, access);
    const calendar = getCalendarMeetingSchedule(event, occurrenceStart, occurrenceEnd);
    if (!calendar) {
        throw new Error("This calendar event has ended");
    }
    const existingMeetingId = getCommunicationMeetingId(event.data);
    if (existingMeetingId) {
        let existingMeeting: CommunicationMeeting | null = null;
        try {
            existingMeeting = await getMeeting(existingMeetingId, session);
        } catch (error) {
            if (!(error instanceof CommunicationServicesError) || error.status !== 404) throw error;
        }
        if (existingMeeting && existingMeeting.calendarGenerated && !sameCalendarOccurrence(existingMeeting, calendar)) {
            if (meetingOccurrenceIsActive(existingMeeting)) {
                return { event, meeting: existingMeeting };
            }
            const nextParticipants = participants ?? (accessPolicy === "INVITE_ONLY"
                ? (await prisma.invitee.findMany({
                    where: { eventId: event.id },
                    include: { account: { select: { userId: true } } },
                })).map((invitee) => ({ userId: invitee.account.userId!, role: "MEMBER" as const }))
                : undefined);
            const meeting = await createMeeting({ title: event.name, accessPolicy, participants: nextParticipants, calendar, session });
            const eventData = getEventData(event.data);
            const updatedEvent = await prisma.event.update({
                where: { id: event.id },
                data: {
                    data: {
                        ...eventData,
                        communicationMeeting: {
                            ...getEventData(eventData.communicationMeeting),
                            meetingId: meeting.id,
                            accessPolicy: meeting.accessPolicy,
                            roomName: meeting.roomName,
                            calendarGenerated: true,
                            occurrenceStart: calendar.occurrenceStart,
                            occurrenceEnd: calendar.occurrenceEnd,
                            linkedAt: new Date().toISOString(),
                        },
                    },
                },
            });
            return { event: updatedEvent, meeting };
        }
        if (existingMeeting) return { event, meeting: existingMeeting };
    }

    const meetingParticipants = participants ?? (accessPolicy === "INVITE_ONLY"
        ? (await prisma.invitee.findMany({
            where: { eventId: event.id },
            include: { account: { select: { userId: true } } },
        })).map((invitee) => ({ userId: invitee.account.userId!, role: "MEMBER" as const }))
        : undefined);
    const meeting = await createMeeting({ title: event.name, accessPolicy, participants: meetingParticipants, calendar, session });
    const updatedEvent = await prisma.event.update({
        where: { id: event.id },
        data: {
            data: {
                ...getEventData(event.data),
                communicationMeeting: {
                    meetingId: meeting.id,
                    accessPolicy: meeting.accessPolicy,
                    roomName: meeting.roomName,
                    calendarGenerated: true,
                    occurrenceStart: calendar.occurrenceStart,
                    occurrenceEnd: calendar.occurrenceEnd,
                    linkedAt: new Date().toISOString(),
                },
            },
        },
    });
    return { event: updatedEvent, meeting };
}

export async function GetMeetingForCalendarEvent({ eventId, calendarId, userId, session, access = {} }: {
    eventId: string;
    calendarId: string;
    userId: string;
    session: SessionData;
    access?: AccountAccess;
}) {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { calendar: { include: { account: true } } },
    });
    if (!event || event.calendarId !== calendarId) {
        throw new Error("Event not found");
    }
    if (!await verifyEventAccess(eventId, userId, access)) {
        throw new Error("Unauthorized: You do not have access to this event");
    }
    const meetingId = getCommunicationMeetingId(event.data);
    return meetingId ? { event, meeting: await getMeeting(meetingId, session) } : null;
}

export async function UpdateMeetingForCalendarEvent({
    eventId,
    calendarId,
    userId,
    session,
    accessPolicy,
    participants,
    occurrenceStart,
    occurrenceEnd,
    access = {},
}: {
    eventId: string;
    calendarId: string;
    userId: string;
    session: SessionData;
    accessPolicy?: MeetingAccessPolicy;
    participants?: MeetingParticipantInput[];
    occurrenceStart?: string;
    occurrenceEnd?: string;
    access?: AccountAccess;
}) {
    const event = await getOwnedEvent(eventId, calendarId, userId, access);
    const meetingId = getCommunicationMeetingId(event.data);
    if (!meetingId) {
        throw new Error("This event does not have a communication meeting");
    }
    const calendar = getCalendarMeetingSchedule(event, occurrenceStart, occurrenceEnd);
    let existingMeeting: CommunicationMeeting;
    try {
        existingMeeting = await getMeeting(meetingId, session);
    } catch (error) {
        if (!(error instanceof CommunicationServicesError) || error.status !== 404) throw error;
        const storedPolicy = getEventData(event.data).communicationMeeting?.accessPolicy as MeetingAccessPolicy | undefined;
        return CreateMeetingForCalendarEvent({
            eventId,
            calendarId,
            userId,
            session,
            accessPolicy: accessPolicy || storedPolicy || "ANYONE",
            participants,
            occurrenceStart,
            occurrenceEnd,
            access,
        });
    }
    if (calendar && existingMeeting.calendarGenerated && !sameCalendarOccurrence(existingMeeting, calendar)) {
        if (meetingOccurrenceIsActive(existingMeeting)) {
            const meeting = await updateMeeting({ meetingId, session, accessPolicy, participants });
            return { event, meeting };
        }
        const nextAccessPolicy = accessPolicy || existingMeeting.accessPolicy;
        const nextParticipants = participants ?? (nextAccessPolicy === "INVITE_ONLY"
            ? (await prisma.invitee.findMany({
                where: { eventId: event.id },
                include: { account: { select: { userId: true } } },
            })).map((invitee) => ({ userId: invitee.account.userId!, role: "MEMBER" as const }))
            : undefined);
        const replacement = await createMeeting({ title: event.name, accessPolicy: nextAccessPolicy, participants: nextParticipants, calendar, session });
        const eventData = getEventData(event.data);
        const updatedEvent = await prisma.event.update({
            where: { id: event.id },
            data: {
                data: {
                    ...eventData,
                    communicationMeeting: {
                        ...getEventData(eventData.communicationMeeting),
                        meetingId: replacement.id,
                        accessPolicy: replacement.accessPolicy,
                        roomName: replacement.roomName,
                        calendarGenerated: true,
                        occurrenceStart: calendar.occurrenceStart,
                        occurrenceEnd: calendar.occurrenceEnd,
                        linkedAt: new Date().toISOString(),
                    },
                },
            },
        });
        return { event: updatedEvent, meeting: replacement };
    }
    const meeting = await updateMeeting({
        meetingId,
        session,
        accessPolicy,
        participants,
        calendar: calendar || undefined,
    });
    const eventData = getEventData(event.data);
    const updatedEvent = await prisma.event.update({
        where: { id: event.id },
        data: {
            data: {
                ...eventData,
                communicationMeeting: {
                    ...getEventData(eventData.communicationMeeting),
                    accessPolicy: meeting.accessPolicy,
                },
            },
        },
    });
    return { event: updatedEvent, meeting };
}

export async function GetMeetingTokenForCalendarEvent({ eventId, calendarId, userId, session, occurrenceStart, occurrenceEnd, access = {} }: {
    eventId: string;
    calendarId: string;
    userId: string;
    session: SessionData;
    occurrenceStart?: string;
    occurrenceEnd?: string;
    access?: AccountAccess;
}) {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { calendar: { include: { account: true } }, invitees: { include: { account: { select: { userId: true } } } } },
    });
    if (!event || event.calendarId !== calendarId) {
        throw new Error("Event not found");
    }
    if (!await verifyEventAccess(eventId, userId, access)) {
        throw new Error("Unauthorized: You do not have access to this event");
    }

    const schedule = getCalendarMeetingSchedule(event, occurrenceStart, occurrenceEnd);
    if (!schedule) {
        throw new Error("This calendar event has ended");
    }

    const eventData = getEventData(event.data);
    const meetingData = getEventData(eventData.communicationMeeting);
    const accessPolicy = (meetingData.accessPolicy || "ANYONE") as MeetingAccessPolicy;
    const participants = accessPolicy === "INVITE_ONLY"
        ? event.invitees.map((invitee) => ({ userId: invitee.account.userId!, role: "MEMBER" as const }))
        : undefined;
    const linkedMeetingId = getCommunicationMeetingId(event.data);
    let linkedMeeting: CommunicationMeeting | null = null;
    if (linkedMeetingId) {
        try {
            linkedMeeting = await getMeeting(linkedMeetingId, session);
        } catch (error) {
            if (!(error instanceof CommunicationServicesError) || error.status !== 404) {
                throw error;
            }
        }
    }

    if (linkedMeeting && (!linkedMeeting.calendarGenerated || sameCalendarOccurrence(linkedMeeting, schedule) || meetingOccurrenceIsActive(linkedMeeting))) {
        return {
            ...(await getMeetingToken(linkedMeeting.id, session)),
            event,
        };
    }

    // The previous occurrence has ended, or cleanup removed its empty room.
    // Create exactly one room for the occurrence that is currently active or next.
    const meeting = await createMeeting({ title: event.name, accessPolicy, participants, calendar: schedule, session });
    const updatedEvent = await prisma.event.update({
        where: { id: event.id },
        data: {
            data: {
                ...eventData,
                communicationMeeting: {
                    ...meetingData,
                    meetingId: meeting.id,
                    accessPolicy: meeting.accessPolicy,
                    roomName: meeting.roomName,
                    calendarGenerated: true,
                    occurrenceStart: schedule.occurrenceStart,
                    occurrenceEnd: schedule.occurrenceEnd,
                    linkedAt: new Date().toISOString(),
                },
            },
        },
    });
    return {
        ...(await getMeetingToken(meeting.id, session)),
        event: updatedEvent,
    };
}
