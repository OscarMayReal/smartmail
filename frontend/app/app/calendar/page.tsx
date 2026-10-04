"use client"
import { Calendar as BigCalendar, momentLocalizer, View, Views } from "react-big-calendar";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import moment from "moment";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, PlusIcon, CalendarDaysIcon, CalendarRangeIcon, ListIcon, XIcon, ChevronDownIcon, MapPinIcon, UsersIcon, VideoIcon, Trash2Icon, RepeatIcon, BellIcon, LockIcon, TagIcon, PaperclipIcon } from "lucide-react";
import { ButtonGroup } from "@/components/ui/button-group";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import "./styles.css";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AuthState } from "keystone-lib";
import { GlobalContext } from "../layout";
import { FolderSidebarGroup } from "@/components/components/folder";
import { CalendarSidebarGroup, CalendarWithSelection } from "@/components/components/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const fetchCalendars = async (auth: AuthState) => {
    const calendars = await fetch("/api/calendar/calendars", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth.data?.sessionId}`
        }
    }).then(res => res.json());
    return calendars.map((calendar: any) => ({
        ...calendar,
        selected: true,
    }));
}

const getVisibleCalendarRange = (date: Date, view: View) => {
    const current = moment(date);
    if (view === Views.DAY) {
        return { start: current.clone().startOf("day"), end: current.clone().endOf("day") };
    }
    if (view === Views.MONTH) {
        return { start: current.clone().startOf("month").startOf("week"), end: current.clone().endOf("month").endOf("week") };
    }
    if (view === Views.AGENDA) {
        return { start: current.clone().startOf("day"), end: current.clone().add(30, "days").endOf("day") };
    }
    return { start: current.clone().startOf("week"), end: current.clone().endOf("week") };
};

const fetchEvents = async (auth: AuthState, calendarIds: string[], date: Date, view: View) => {
    const ownedEvents = await Promise.all(calendarIds.map(async (calendarId) => {
        const calendarEvents = await fetch(`/api/calendar/` + calendarId + "/events", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${auth.data?.sessionId}`
            }
        }).then(res => res.json());
        return calendarEvents;
    }));
    const invitedEvents = await fetch("/api/calendar/invited-events", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth.data?.sessionId}`
        }
    }).then(res => res.ok ? res.json() : []);
    const events = Array.from(new Map([...ownedEvents.flat(), ...invitedEvents].map((event: any) => {
        // A recurring event can arrive through both the owned-calendar and
        // invited-event feeds. Use the occurrence timestamp as the stable key.
        const seriesId = event.seriesEventId || event.id;
        const occurrenceStart = event.occurrenceStart || event.start;
        const occurrenceEnd = event.occurrenceEnd || event.end;
        const start = new Date(occurrenceStart).getTime();
        const end = new Date(occurrenceEnd).getTime();
        const occurrenceKey = Number.isNaN(start) || Number.isNaN(end)
            ? `${event.calendarId}:${seriesId}`
            : `${event.calendarId}:${seriesId}:${start}:${end}`;
        return [occurrenceKey, event];
    })).values());
    const range = getVisibleCalendarRange(date, view);
    return events.map((event) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
        title: event.name,
    })).filter((event) => event.end >= range.start.toDate() && event.start <= range.end.toDate());
}

const getSeriesEventId = (event: any) => event.seriesEventId || event.id;

export default function CalendarPage() {
    const { auth } = useContext(GlobalContext);
    const DragAndDropCalendar = withDragAndDrop(BigCalendar);
    moment.locale("en", {
        week: {
            dow: 1,
        },
    });
    const [calendars, setCalendars] = useState<CalendarWithSelection[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState<View>(Views.WEEK);
    useEffect(() => {
        if (!auth?.data?.sessionId) return;
        fetchCalendars(auth).then(setCalendars);
    }, [auth]);

    useEffect(() => {
        if (!auth?.data?.sessionId) return;
        fetchEvents(auth, calendars.filter((calendar) => calendar.selected).map((calendar) => calendar.id), date, view).then(setEvents);
    }, [calendars, auth, date, view]);

    const localizer = momentLocalizer(moment);
    const [createCalendarDialogOpen, setCreateCalendarDialogOpen] = useState(false);
    const [open, setOpen] = useState(false)
    const [event, setEvent] = useState<any>(null)
    const [createOpen, setCreateOpen] = useState(false)
    const [slot, setSlot] = useState<any>(null)
    const moveEvent = useCallback(
        async ({ event, start, end, isAllDay: droppedOnAllDaySlot = false }: any) => {
            if (!auth?.data?.sessionId) return;
            const seriesEventId = getSeriesEventId(event);
            const { allDay } = event
            if (!allDay && droppedOnAllDaySlot) {
                event.allDay = true
            }
            if (allDay && !droppedOnAllDaySlot) {
                event.allDay = false;
            }

            setEvents((prev) => {
                const existing = prev.find((ev) => ev.id === event.id) ?? {}
                const filtered = prev.filter((ev) => ev.id !== event.id)
                return [...filtered, { ...existing, start, end, allDay: event.allDay }]
            })

            const updatedEvent = await fetch("/api/calendar/" + event.calendarId + "/events/" + seriesEventId, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${auth.data?.sessionId}`
                },
                body: JSON.stringify({ ...event, id: seriesEventId, start, end, allDay: event.allDay })
            }).then(res => res.json());
            setEvents((prev) => {
                const existing = prev.find((ev) => ev.id === event.id) ?? {}
                const filtered = prev.filter((ev) => ev.id !== event.id)
                return [...filtered, { ...existing, start, end, allDay: event.allDay }]
            })
        },
        [setEvents, auth]
    )

    const resizeEvent = useCallback(
        async ({ event, start, end }: any) => {
            if (!auth?.data?.sessionId) return;
            const seriesEventId = getSeriesEventId(event);
            setEvents((prev) => {
                const existing = prev.find((ev) => ev.id === event.id) ?? {}
                const filtered = prev.filter((ev) => ev.id !== event.id)
                return [...filtered, { ...existing, start, end }]
            })
            const updatedEvent = await fetch("/api/calendar/" + event.calendarId + "/events/" + seriesEventId, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${auth.data?.sessionId}`
                },
                body: JSON.stringify({ ...event, id: seriesEventId, start, end })
            }).then(res => res.json());
        },
        [setEvents, auth]
    )

    const newEvent = useCallback(
        async (event: any) => {
            if (!auth?.data?.sessionId) return;
            const calendarId = calendars.filter((calendar) => calendar.selected).map((calendar) => calendar.id)[0];
            if (!calendarId) return;
            setSlot(event);
            setCreateOpen(true);
        },
        [setEvents, calendars, auth]
    )
    return (
        <div className="flex flex-row h-full w-full">
            <div className="folder-sidebar">
                {/* <ButtonGroup className="w-full p-[10px]">
                    <Button variant="outline" className="flex-1"><PlusIcon /> Event</Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline"><ChevronDownIcon /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setCreateCalendarDialogOpen(true)}><CalendarIcon />Calendar</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </ButtonGroup> */}
                <div className="w-full p-[10px]">
                    <Button variant="outline" onClick={() => setCreateCalendarDialogOpen(true)} className="w-full"><PlusIcon /> Calendar</Button>
                </div>
                <CreateCalendarDialog open={createCalendarDialogOpen} onOpenChange={setCreateCalendarDialogOpen} setCalendars={setCalendars} />
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    required
                    weekStartsOn={1}
                    style={{ maxWidth: "100%", padding: 0, backgroundColor: "transparent" }}
                />
                <CalendarSidebarGroup setCalendars={setCalendars} calendars={calendars} title="Calendars" />
            </div>
            <div className="h-full w-full">
                <div className="mail-header" style={{ paddingLeft: "7px", paddingRight: "7px" }}>
                    <ButtonGroup>
                        <Button size={"sm"} onClick={() => setDate(moment(date).subtract(1, "month").toDate())} variant="outline"><ChevronLeftIcon />Previous</Button>
                        <Button size={"sm"} disabled={moment(date).isSame(moment(), "month")} variant="outline" onClick={() => setDate(moment().toDate())}><CalendarIcon />Now</Button>
                        <Button size={"sm"} onClick={() => setDate(moment(date).add(1, "month").toDate())} variant="outline"><ChevronRightIcon />Next</Button>
                    </ButtonGroup>
                    <div className="flex-1 display-flex flex-row align-center justify-center">
                        <div className="mail-header-title text-center">{moment(date).format("MMMM YYYY")}</div>
                    </div>
                    <Tabs value={view} onValueChange={setView as any}>
                        <TabsList className="w-fit">
                            <TabsTrigger value={Views.MONTH}><CalendarIcon />Month</TabsTrigger>
                            <TabsTrigger value={Views.WEEK}><CalendarRangeIcon /> Week</TabsTrigger>
                            <TabsTrigger value={Views.DAY}><CalendarDaysIcon />Day</TabsTrigger>
                            <TabsTrigger value={Views.AGENDA}><ListIcon />Agenda</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                <DragAndDropCalendar
                    date={date}
                    onNavigate={(date, view) => {
                        setDate(date)
                        setView(view)
                    }}
                    view={view}
                    toolbar={false}
                    localizer={localizer}
                    style={{ height: "100%", width: "100%", borderWidth: "0px" }}
                    events={events}
                    onSelectEvent={(event) => {
                        setEvent(event)
                        setOpen(true)
                    }}
                    popup
                    // components={{
                    //     eventWrapper
                    // }}
                    onEventDrop={moveEvent}
                    onEventResize={resizeEvent}
                    onSelectSlot={newEvent}
                    resizable
                    selectable
                    step={15}
                />
                <CreateEventDialog
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    slot={slot}
                    calendarId={calendars.find((calendar) => calendar.selected)?.id}
                    auth={auth}
                    onCreated={() => {
                        if (auth?.data?.sessionId) {
                            fetchEvents(auth, calendars.filter((calendar) => calendar.selected).map((calendar) => calendar.id), date, view).then(setEvents);
                        }
                    }}
                />
                <EventDialog
                    event={event}
                    open={open}
                    onOpenChange={setOpen}
                    auth={auth}
                    onSaved={() => {
                        if (auth?.data?.sessionId) {
                            fetchEvents(auth, calendars.filter((calendar) => calendar.selected).map((calendar) => calendar.id), date, view).then(setEvents);
                        }
                    }}
                    onDeleted={(id) => {
                        setEvents((prev) => prev.filter((item) => getSeriesEventId(item) !== id));
                        setOpen(false);
                    }}
                />
            </div>
        </div>
    );
}

function eventWrapper(props: any) {
    // Some data that you might have inserted into the event object
    const data = props.event;
    const customDiv = (
        <div className="yourClass">
            <div>{data.name}</div>
            <div>{moment(data.start).format("HH:mm")} - {moment(data.end).format("HH:mm")}</div>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline">Open</Button>
                </PopoverTrigger>
                <PopoverContent>
                    <div>{data.name}</div>
                    <div>{moment(data.start).format("HH:mm")} - {moment(data.end).format("HH:mm")}</div>
                </PopoverContent>
            </Popover>
        </div>
    );
    const eventDiv = React.cloneElement(props.children.props.children, {}, customDiv);
    const wrapper = React.cloneElement(props.children, {}, eventDiv);
    return (<div>
        {wrapper}
    </div>
    );
}

type EventFormValues = {
    title: string;
    location: string;
    start: string;
    end: string;
    allDay: boolean;
    privacy: "PUBLIC" | "PRIVATE";
    recurrence: string;
    reminderMinutes: string;
    showAs: string;
    category: string;
    description: string;
    attendees: string;
    attendeeUserIds: string;
    attachments: string;
    communicationMeeting: boolean;
    meetingAccessPolicy: "ANYONE" | "ORGANIZATION" | "INVITE_ONLY";
};

const toDateTimeLocal = (value: Date | string | undefined) => {
    if (!value) return "";
    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const fromEvent = (event: any, slot?: any): EventFormValues => {
    const data = event?.data && typeof event.data === "object" ? event.data : {};
    return {
        title: event?.name || event?.title || "",
        location: data.location || "",
        start: toDateTimeLocal(event?.start || slot?.start),
        end: toDateTimeLocal(event?.end || slot?.end),
        allDay: Boolean(event?.allDay),
        privacy: data.privacy === "PRIVATE" ? "PRIVATE" : "PUBLIC",
        recurrence: data.recurrence?.frequency || data.recurrence || "NONE",
        reminderMinutes: String(data.reminderMinutes ?? 15),
        showAs: data.showAs || "BUSY",
        category: data.category || "",
        description: data.description || "",
        attendees: event?.invitees?.map((invitee: any) => invitee.name).join(", ") || "",
        attendeeUserIds: event?.invitees?.map((invitee: any) => invitee.account?.userId).filter(Boolean).join(", ") || "",
        attachments: Array.isArray(data.attachments) ? data.attachments.join(", ") : "",
        communicationMeeting: Boolean(data.communicationMeeting),
        meetingAccessPolicy: data.communicationMeeting?.accessPolicy || "ANYONE",
    };
};

const eventPayload = (values: EventFormValues) => ({
    name: values.title,
    start: new Date(values.start).toISOString(),
    end: new Date(values.end).toISOString(),
    allDay: values.allDay,
    data: {
        location: values.location,
        privacy: values.privacy,
        recurrence: values.recurrence === "NONE" ? null : { frequency: values.recurrence },
        reminderMinutes: Number(values.reminderMinutes),
        showAs: values.showAs,
        category: values.category,
        description: values.description,
        attachments: values.attachments.split(",").map((item) => item.trim()).filter(Boolean),
    },
});

const attendeesPayload = (emails: string, userIds: string) => [
    ...emails.split(",").map((email) => email.trim()).filter(Boolean).map((email) => ({ email })),
    ...userIds.split(",").map((userId) => userId.trim()).filter(Boolean).map((userId) => ({ userId })),
];

function EventFields({ values, setValues }: { values: EventFormValues; setValues: React.Dispatch<React.SetStateAction<EventFormValues>> }) {
    const update = (field: keyof EventFormValues, value: any) => setValues((current) => ({ ...current, [field]: value }));
    return (
        <div className="flex flex-col gap-4 py-2">
            <Input value={values.title} onChange={(event) => update("title", event.target.value)} placeholder="Add a title for the event" aria-label="Event title" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm"><MapPinIcon size={16} /><Input value={values.location} onChange={(event) => update("location", event.target.value)} placeholder="Location or room" /></label>
                <label className="flex items-center gap-2 text-sm"><TagIcon size={16} /><Input value={values.category} onChange={(event) => update("category", event.target.value)} placeholder="Category" /></label>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm"><span>Start</span><Input type="datetime-local" value={values.start} onChange={(event) => update("start", event.target.value)} /></label>
                <label className="flex flex-col gap-1 text-sm"><span>End</span><Input type="datetime-local" value={values.end} onChange={(event) => update("end", event.target.value)} /></label>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" checked={values.allDay} onChange={(event) => update("allDay", event.target.checked)} />All day</label>
                <label className="flex items-center gap-2"><LockIcon size={16} /><input type="checkbox" checked={values.privacy === "PRIVATE"} onChange={(event) => update("privacy", event.target.checked ? "PRIVATE" : "PUBLIC")} />Private</label>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm"><RepeatIcon size={16} /><span className="sr-only">Repeat</span><select className="h-9 w-full rounded-md border bg-background px-3" value={values.recurrence} onChange={(event) => update("recurrence", event.target.value)}><option value="NONE">Does not repeat</option><option value="DAILY">Daily</option><option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option><option value="YEARLY">Yearly</option></select></label>
                <label className="flex items-center gap-2 text-sm"><BellIcon size={16} /><span className="sr-only">Reminder</span><select className="h-9 w-full rounded-md border bg-background px-3" value={values.reminderMinutes} onChange={(event) => update("reminderMinutes", event.target.value)}><option value="0">No reminder</option><option value="5">5 minutes before</option><option value="15">15 minutes before</option><option value="30">30 minutes before</option><option value="60">1 hour before</option></select></label>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm"><span className="w-4 text-center">●</span><span className="sr-only">Show as</span><select className="h-9 w-full rounded-md border bg-background px-3" value={values.showAs} onChange={(event) => update("showAs", event.target.value)}><option value="BUSY">Busy</option><option value="FREE">Free</option><option value="TENTATIVE">Tentative</option><option value="OOF">Out of office</option></select></label>
                <label className="flex items-center gap-2 text-sm"><PaperclipIcon size={16} /><Input value={values.attachments} onChange={(event) => update("attachments", event.target.value)} placeholder="Attachment links, comma separated" /></label>
            </div>
            <label className="flex flex-col gap-1 text-sm"><span className="flex items-center gap-2"><UsersIcon size={16} />People</span><Input value={values.attendees} onChange={(event) => update("attendees", event.target.value)} placeholder="Invite email addresses, comma separated" /></label>
            <Input value={values.attendeeUserIds} onChange={(event) => update("attendeeUserIds", event.target.value)} placeholder="User IDs for meeting access, comma separated" />
            <textarea className="min-h-32 rounded-md border bg-background p-3 text-sm" value={values.description} onChange={(event) => update("description", event.target.value)} placeholder="Add a description, agenda, or meeting notes" />
        </div>
    );
}

function CreateEventDialog({ open, onOpenChange, slot, calendarId, auth, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; slot: any; calendarId?: string; auth: AuthState | undefined; onCreated: (event: any) => void }) {
    const [values, setValues] = useState<EventFormValues>(fromEvent(null));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (open) {
            setValues(fromEvent(null, slot));
            setError("");
        }
    }, [open, slot]);

    const save = async () => {
        if (!auth?.data?.sessionId || !calendarId || !slot) return;
        setSaving(true);
        setError("");
        try {
            const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${auth.data.sessionId}` };
            const eventResponse = await fetch(`/api/calendar/${calendarId}/events`, { method: "POST", headers, body: JSON.stringify(eventPayload(values)) });
            const created = await eventResponse.json();
            if (!eventResponse.ok) throw new Error(created.error || "Unable to create event");
            let result = created;
            if (values.attendees || values.attendeeUserIds) {
                const inviteResponse = await fetch(`/api/calendar/${calendarId}/events/${created.id}/invitees`, { method: "POST", headers, body: JSON.stringify({ invitees: attendeesPayload(values.attendees, values.attendeeUserIds) }) });
                result = await inviteResponse.json();
                if (!inviteResponse.ok) throw new Error(result.error || "Unable to invite people");
            }
            if (values.communicationMeeting) {
                const meetingResponse = await fetch(`/api/calendar/${calendarId}/events/${created.id}/meeting`, { method: "POST", headers, body: JSON.stringify({ accessPolicy: values.meetingAccessPolicy }) });
                const meetingResult = await meetingResponse.json();
                if (!meetingResponse.ok) throw new Error(meetingResult.error || "Unable to create meeting");
                result = meetingResult.event || result;
            }
            onCreated(result);
            onOpenChange(false);
        } catch (error: any) {
            setError(error.message || "Unable to create event");
        } finally {
            setSaving(false);
        }
    };

    return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>New event</DialogTitle><DialogDescription>Create an event with attendees, reminders, availability, and optional communication meeting.</DialogDescription></DialogHeader><EventFields values={values} setValues={setValues} /><MeetingOptions values={values} setValues={setValues} />{error && <p className="text-sm text-red-600">{error}</p>}<DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Discard</Button><Button onClick={save} disabled={saving || !values.title}>{saving ? "Saving…" : "Save"}</Button></DialogFooter></DialogContent></Dialog>;
}

function MeetingOptions({ values, setValues }: { values: EventFormValues; setValues: React.Dispatch<React.SetStateAction<EventFormValues>> }) {
    const update = (field: keyof EventFormValues, value: any) => setValues((current) => ({ ...current, [field]: value }));
    return <div className="rounded-md border p-3"><label className="flex items-center gap-2 text-sm"><VideoIcon size={16} /><input type="checkbox" checked={values.communicationMeeting} onChange={(event) => update("communicationMeeting", event.target.checked)} />Add communication meeting</label>{values.communicationMeeting && <select className="mt-3 h-9 w-full rounded-md border bg-background px-3 text-sm" value={values.meetingAccessPolicy} onChange={(event) => update("meetingAccessPolicy", event.target.value)}><option value="ANYONE">Anyone with the link</option><option value="ORGANIZATION">My organization</option><option value="INVITE_ONLY">Specific people only</option></select>}</div>;
}

function EventDialog({ event, open, onOpenChange, auth, onSaved, onDeleted }: { event: any; open: boolean; onOpenChange: (open: boolean) => void; auth: AuthState | undefined; onSaved: (event: any) => void; onDeleted: (id: string) => void }) {
    const [values, setValues] = useState<EventFormValues>(fromEvent(event));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (event) {
            setValues(fromEvent(event));
            setError("");
        }
    }, [event]);

    if (!event) return null;
    const seriesEventId = getSeriesEventId(event);
    const meetingId = event.data?.communicationMeeting?.meetingId;
    const occurrenceSchedule = event.occurrenceStart && event.occurrenceEnd
        ? { occurrenceStart: new Date(event.occurrenceStart).toISOString(), occurrenceEnd: new Date(event.occurrenceEnd).toISOString() }
        : {};
    const seriesEventPayload = event.seriesEventId && event.seriesStart && event.seriesEnd
        ? { ...eventPayload(values), start: new Date(event.seriesStart).toISOString(), end: new Date(event.seriesEnd).toISOString() }
        : eventPayload(values);

    const save = async () => {
        if (!auth?.data?.sessionId) return;
        setSaving(true);
        setError("");
        try {
            const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${auth.data.sessionId}` };
            const updatedResponse = await fetch(`/api/calendar/${event.calendarId}/events/${seriesEventId}`, { method: "PUT", headers, body: JSON.stringify({ id: seriesEventId, calendarId: event.calendarId, ...seriesEventPayload }) });
            const updated = await updatedResponse.json();
            if (!updatedResponse.ok) throw new Error(updated.error || "Unable to save event");
            let result = updated;
            if (values.attendees || values.attendeeUserIds) {
                const inviteResponse = await fetch(`/api/calendar/${event.calendarId}/events/${seriesEventId}/invitees`, { method: "POST", headers, body: JSON.stringify({ invitees: attendeesPayload(values.attendees, values.attendeeUserIds) }) });
                result = await inviteResponse.json();
                if (!inviteResponse.ok) throw new Error(result.error || "Unable to invite people");
            }
            if (meetingId) {
                const meetingResponse = await fetch(`/api/calendar/${event.calendarId}/events/${seriesEventId}/meeting`, { method: "PATCH", headers, body: JSON.stringify({ accessPolicy: values.meetingAccessPolicy, ...occurrenceSchedule }) });
                const meetingResult = await meetingResponse.json();
                if (!meetingResponse.ok) throw new Error(meetingResult.error || "Unable to update meeting");
                result = meetingResult.event || result;
            } else if (values.communicationMeeting) {
                const meetingResponse = await fetch(`/api/calendar/${event.calendarId}/events/${seriesEventId}/meeting`, { method: "POST", headers, body: JSON.stringify({ accessPolicy: values.meetingAccessPolicy, ...occurrenceSchedule }) });
                const meetingResult = await meetingResponse.json();
                if (!meetingResponse.ok) throw new Error(meetingResult.error || "Unable to create meeting");
                result = meetingResult.event || result;
            }
            onSaved(result);
            onOpenChange(false);
        } catch (error: any) {
            setError(error.message || "Unable to save event");
        } finally {
            setSaving(false);
        }
    };

    const deleteEvent = async () => {
        if (!auth?.data?.sessionId || !window.confirm("Delete this event?")) return;
        const response = await fetch(`/api/calendar/${event.calendarId}/events/${seriesEventId}`, { method: "DELETE", headers: { "Authorization": `Bearer ${auth.data.sessionId}` } });
        if (response.ok) onDeleted(seriesEventId);
        else setError((await response.json()).error || "Unable to delete event");
    };

    return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Edit event</DialogTitle><DialogDescription>{new Date(event.start).toLocaleString()} – {new Date(event.end).toLocaleString()}</DialogDescription></DialogHeader><EventFields values={values} setValues={setValues} /><MeetingOptions values={{ ...values, communicationMeeting: Boolean(meetingId) || values.communicationMeeting }} setValues={setValues} />{meetingId && <div className="rounded-md border bg-muted/30 p-3 text-sm"><div className="text-muted-foreground">Communication meeting ID</div><code className="mt-1 block break-all font-mono text-xs">{meetingId}</code></div>}{error && <p className="text-sm text-red-600">{error}</p>}<DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between"><Button variant="destructive" onClick={deleteEvent}><Trash2Icon size={16} />Delete</Button><div className="flex gap-2"><Button variant="outline" onClick={() => onOpenChange(false)}>Discard</Button><Button onClick={save} disabled={saving || !values.title}>{saving ? "Saving…" : "Save"}</Button></div></DialogFooter></DialogContent></Dialog>;
}

function CreateCalendarDialog({ open, onOpenChange, setCalendars }: { open: boolean, onOpenChange: (open: boolean) => void, setCalendars: (calendars: any[]) => void }) {
    const [name, setName] = useState("")
    const { auth } = useContext(GlobalContext)
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Calendar</DialogTitle>
                    <DialogDescription>
                        Create a new calendar
                    </DialogDescription>
                </DialogHeader>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Calendar Name" />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline"><XIcon />Close</Button>
                    </DialogClose>
                    <Button onClick={() => {
                        if (!auth?.data?.sessionId) return
                        fetch("/api/calendar/calendars", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Accept": "application/json",
                                "Authorization": `Bearer ${auth?.data?.sessionId}`
                            },
                            body: JSON.stringify({ name })
                        }).then(res => res.json()).then(data => {
                            onOpenChange(false)
                            fetchCalendars(auth).then(calendars => {
                                setCalendars(calendars)
                            })
                        })
                    }}><PlusIcon />Create</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
