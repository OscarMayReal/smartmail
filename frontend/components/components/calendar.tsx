import { CalendarIcon } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import { calendar } from "@/../server/generated/prisma/browser";

export function CalendarSidebarItem({ calendar, onSelectionChange }: { calendar: calendar, onSelectionChange: (selected: boolean) => void }) {
    return (
        <div className={`folder-sidebar-item`}>
            <CalendarIcon size="20" />
            <div className="folder-sidebar-item-text">{calendar.name}</div>
            <div className="flex-1" />
            {/* <DropdownMenu>
                <DropdownMenuTrigger className="folder-sidebar-item-dropdown-trigger" asChild>
                    <MoreHorizontalIcon size="16" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled={folder.type !== "smartmail.folder.custom"} onClick={() => { router.push(`/app/mail/mailbox/${folder.id}/compose`) }}><PenIcon /> Rename</DropdownMenuItem>
                    <DropdownMenuItem disabled={folder.type !== "smartmail.folder.custom"} onClick={() => { router.push(`/app/mail/mailbox/${folder.id}/compose`) }}><Trash2Icon /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu> */}
            <Checkbox checked={calendar.selected} onCheckedChange={onSelectionChange} />
        </div>
    );
}

export function CalendarSidebarGroup({ calendars, title, setCalendars }: { calendars: calendar[], title: string, setCalendars: (calendars: calendar[]) => void }) {
    return (
        <div className="folder-sidebar-group">
            <div className="folder-sidebar-group-title">{title}</div>
            <div className="folder-sidebar-group-items">
                {calendars.map((calendar) => (
                    <CalendarSidebarItem onSelectionChange={(selected) => {
                        setCalendars(calendars.map((calendar) => {
                            if (calendar.id === calendar.id) {
                                return {
                                    ...calendar,
                                    selected
                                };
                            }
                            return calendar;
                        }));
                    }} key={calendar.id} calendar={calendar} />
                ))}
            </div>
        </div>
    );
}