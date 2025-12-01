import { SidebarItem } from "@/components/qui/sidebar";
import { BookUserIcon, CalendarIcon, CheckIcon, MailIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export function NavigationSidebar() {
    const path = usePathname();
    const router = useRouter();
    return (
        <div className="sidebar" style={{ width: "60px", maxWidth: "60px", minWidth: "60px", padding: "10px", backgroundColor: "var(--qu-header-background)", borderRight: "1px solid var(--qu-border-color)", gap: "5px", display: "flex", flexDirection: "column" }}>
            <SidebarItem variant="compact" index={0} title="Mail" onClick={() => { router.push("/app/mail") }} Icon={MailIcon} active={path.startsWith("/app/mail")} />
            <SidebarItem variant="compact" index={1} title="Calendar" onClick={() => { router.push("/app/calendar") }} Icon={CalendarIcon} active={path.startsWith("/app/calendar")} />
            <SidebarItem variant="compact" index={2} title="Contacts" onClick={() => { router.push("/app/contacts") }} Icon={BookUserIcon} active={path.startsWith("/app/contacts")} />
            <SidebarItem variant="compact" index={3} title="Tasks" onClick={() => { router.push("/app/tasks") }} Icon={CheckIcon} active={path.startsWith("/app/tasks")} />
        </div>
    );
}