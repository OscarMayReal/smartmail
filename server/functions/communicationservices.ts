import "dotenv/config";
import type { SessionData } from "../keystone.ts";

export type MeetingAccessPolicy = "ANYONE" | "ORGANIZATION" | "INVITE_ONLY";
export type MeetingParticipantRole = "VIEWER" | "MEMBER" | "ORGANIZER";

export type MeetingParticipantInput = {
    userId: string;
    role?: MeetingParticipantRole;
};

export type CalendarMeetingSchedule = {
    eventId: string;
    occurrenceStart: string;
    occurrenceEnd: string;
    recurrence?: unknown;
};

export type CommunicationMeeting = {
    id: string;
    title?: string | null;
    roomName: string;
    accessPolicy: MeetingAccessPolicy;
    meetingStarted?: boolean;
    meetingStartedAt?: string | null;
    calendarGenerated?: boolean;
    calendarEventId?: string | null;
    calendarOccurrenceStart?: string | null;
    calendarOccurrenceEnd?: string | null;
    calendarRecurrence?: unknown;
    participants?: Array<{
        userId: string;
        role: MeetingParticipantRole;
    }>;
    participantIds?: string[];
    [key: string]: unknown;
};

export class CommunicationServicesError extends Error {
    status: number;

    constructor(message: string, status = 502) {
        super(message);
        this.name = "CommunicationServicesError";
        this.status = status;
    }
}

const getBaseUrl = () => {
    const baseUrl = process.env.COMMUNICATIONSERVICES_URL?.trim();
    if (!baseUrl) {
        throw new CommunicationServicesError("Communication services integration is not configured", 503);
    }
    return baseUrl.replace(/\/$/, "");
};

const request = async <T>(path: string, session: SessionData, init: RequestInit = {}): Promise<T> => {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${session.sessionId}`);
    headers.set("x-tenant-id", session.tenant.id);
    if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    let response: Response;
    try {
        response = await fetch(`${getBaseUrl()}${path}`, {
            ...init,
            headers,
        });
    } catch (error) {
        throw new CommunicationServicesError(`Unable to reach communication services: ${error instanceof Error ? error.message : "request failed"}`);
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = typeof payload?.error === "string" ? payload.error : `Communication services returned ${response.status}`;
        throw new CommunicationServicesError(message, response.status);
    }
    return payload as T;
};

export const createMeeting = async ({
    title,
    accessPolicy,
    participants,
    calendar,
    session,
}: {
    title: string;
    accessPolicy: MeetingAccessPolicy;
    participants?: MeetingParticipantInput[];
    calendar?: CalendarMeetingSchedule;
    session: SessionData;
}) => request<CommunicationMeeting>("/meetings", session, {
    method: "POST",
    body: JSON.stringify({ title, accessPolicy, participants, calendar }),
});

export const getMeeting = async (meetingId: string, session: SessionData) =>
    request<CommunicationMeeting>(`/meetings/${encodeURIComponent(meetingId)}`, session);

export const updateMeeting = async ({
    meetingId,
    session,
    accessPolicy,
    participants,
    title,
    calendar,
}: {
    meetingId: string;
    session: SessionData;
    accessPolicy?: MeetingAccessPolicy;
    participants?: MeetingParticipantInput[];
    title?: string | null;
    calendar?: CalendarMeetingSchedule;
}) => request<CommunicationMeeting>(`/meetings/${encodeURIComponent(meetingId)}`, session, {
    method: "PATCH",
    body: JSON.stringify({ title, accessPolicy, participants, calendar }),
});

export const getMeetingToken = async (meetingId: string, session: SessionData) =>
    request<{ token: string; livekitUrl?: string; role: MeetingParticipantRole; meeting: CommunicationMeeting }>(
        `/meetings/${encodeURIComponent(meetingId)}/token`,
        session,
        { method: "POST", body: JSON.stringify({}) },
    );
