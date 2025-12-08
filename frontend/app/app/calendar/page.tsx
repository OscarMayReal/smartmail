"use client"
import { Calendar as BigCalendar, momentLocalizer, View, Views } from "react-big-calendar";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import moment from "moment";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, PlusIcon, CalendarDaysIcon, CalendarRangeIcon, ListIcon, XIcon, ChevronDownIcon } from "lucide-react";
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
import { CalendarSidebarGroup } from "@/components/components/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { calendar } from "../../../../server/generated/prisma/browser";
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
    return calendars.map((calendar) => ({
        ...calendar,
        selected: true,
    }));
}

const fetchEvents = async (auth: AuthState, calendarIds: string[]) => {
    const events = [];
    for (const calendarId of calendarIds) {
        const calendarEvents = await fetch(`/api/calendar/` + calendarId + "/events", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${auth.data?.sessionId}`
            }
        }).then(res => res.json());
        events.push(...calendarEvents);
    }
    return events.map((event) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
        title: event.name,
    }));
}

export default function CalendarPage() {
    const { auth } = useContext(GlobalContext);
    const DragAndDropCalendar = withDragAndDrop(BigCalendar);
    moment.locale("en", {
        week: {
            dow: 1,
        },
    });
    const [calendars, setCalendars] = useState<calendar[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    useEffect(() => {
        if (!auth?.data?.sessionId) return;
        fetchCalendars(auth).then(setCalendars);
    }, [auth]);

    useEffect(() => {
        if (!auth?.data?.sessionId) return;
        fetchEvents(auth, calendars.filter((calendar) => calendar.selected).map((calendar) => calendar.id)).then(setEvents);
    }, [calendars, auth]);

    const localizer = momentLocalizer(moment);
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState<View>(Views.WEEK);
    const [createCalendarDialogOpen, setCreateCalendarDialogOpen] = useState(false);
    const [open, setOpen] = useState(false)
    const [event, setEvent] = useState(null)
    const moveEvent = useCallback(
        async ({ event, start, end, isAllDay: droppedOnAllDaySlot = false }) => {
            if (!auth?.data?.sessionId) return;
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

            const updatedEvent = await fetch("/api/calendar/" + event.calendarId + "/events/" + event.id, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${auth.data?.sessionId}`
                },
                body: JSON.stringify({ ...event, start, end, allDay: event.allDay })
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
        async ({ event, start, end }) => {
            if (!auth?.data?.sessionId) return;
            setEvents((prev) => {
                const existing = prev.find((ev) => ev.id === event.id) ?? {}
                const filtered = prev.filter((ev) => ev.id !== event.id)
                return [...filtered, { ...existing, start, end }]
            })
            const updatedEvent = await fetch("/api/calendar/" + event.calendarId + "/events/" + event.id, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${auth.data?.sessionId}`
                },
                body: JSON.stringify({ ...event, start, end })
            }).then(res => res.json());
        },
        [setEvents, auth]
    )

    const newEvent = useCallback(
        async (event) => {
            if (!auth?.data?.sessionId) return;
            const calendarId = calendars.filter((calendar) => calendar.selected).map((calendar) => calendar.id)[0];
            if (!calendarId) return;
            const name = prompt("Event name");
            if (!name) return;
            const newEvent = await fetch("/api/calendar/" + calendarId + "/events", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${auth.data?.sessionId}`
                },
                body: JSON.stringify({ ...event, name })
            }).then(res => res.json());
            setEvents((prev) => [...prev, { ...newEvent, start: new Date(newEvent.start), end: new Date(newEvent.end), title: name }])
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
                <EventDialog event={event} open={open} onOpenChange={setOpen} />
            </div>
        </div>
    );
}

function eventWrapper(props) {
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

function EventDialog({ event, open, onOpenChange }: { event: any, open: boolean, onOpenChange: (open: boolean) => void }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>Open</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{event?.title}</DialogTitle>
                    <DialogDescription>
                        {new Date(event?.start).toLocaleString()} - {new Date(event?.end).toLocaleString()}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline"><XIcon />Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
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