"use client"
import { Calendar as BigCalendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, PlusIcon, CalendarDaysIcon, CalendarRangeIcon, ListIcon } from "lucide-react";
import { ButtonGroup } from "@/components/ui/button-group";
import { useEffect, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";

export default function CalendarPage() {
    const localizer = momentLocalizer(moment);
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState<View>(Views.MONTH);
    return (
        <div className="flex flex-row h-full w-full">
            <div className="folder-sidebar">
                <div className="p-[10px]">
                    <Button variant="outline" className="w-full"><PlusIcon /> Event</Button>
                </div>
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    required
                    weekStartsOn={1}
                    style={{ maxWidth: "100%", padding: 0, backgroundColor: "transparent" }}
                />
            </div>
            <div className="h-full w-full">
                <div className="mail-header" style={{ paddingLeft: "7px", paddingRight: "7px" }}>
                    <ButtonGroup>
                        <Button size={"icon-sm"} onClick={() => setDate(moment(date).subtract(1, "month").toDate())} variant="outline"><ChevronLeftIcon /></Button>
                        <Button size={"icon-sm"} disabled={moment(date).isSame(moment(), "month")} variant="outline" onClick={() => setDate(moment().toDate())}><CalendarIcon /></Button>
                        <Button size={"icon-sm"} onClick={() => setDate(moment(date).add(1, "month").toDate())} variant="outline"><ChevronRightIcon /></Button>
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
                <BigCalendar
                    date={date}
                    onNavigate={(date, view) => {
                        setDate(date)
                        setView(view)
                    }}
                    view={view}
                    toolbar={false}
                    localizer={localizer}
                    style={{ height: "100%", width: "100%", borderWidth: "0px" }}
                />
            </div>
        </div>
    );
}