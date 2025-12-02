import { SidebarItem } from "@/components/qui/sidebar";
import { BookUserIcon, CalendarIcon, CheckIcon, FolderIcon, HomeIcon, ListCheckIcon, ListChecksIcon, MailboxIcon, MailIcon, UsersIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Separator } from "../ui/separator";

export function NavigationSidebar() {
    const path = usePathname();
    const router = useRouter();
    return (
        <div className="sidebar" style={{ width: "60px", maxWidth: "60px", minWidth: "60px", padding: "10px", backgroundColor: "var(--qu-header-background)", borderRight: "1px solid var(--qu-border-color)", gap: "5px", display: "flex", flexDirection: "column" }}>
            <SidebarItem variant="compact" index={0} title="Mail" onClick={() => { router.push("/app/mail") }} Icon={MailIcon} active={path.startsWith("/app/mail")} />
            <SidebarItem variant="compact" index={1} title="Calendar" onClick={() => { router.push("/app/calendar") }} Icon={CalendarIcon} active={path.startsWith("/app/calendar")} />
            <SidebarItem variant="compact" index={2} title="Contacts" onClick={() => { router.push("/app/contacts") }} Icon={BookUserIcon} active={path.startsWith("/app/contacts")} />
            <SidebarItem variant="compact" index={3} title="Tasks" onClick={() => { router.push("/app/tasks") }} Icon={ListChecksIcon} active={path.startsWith("/app/tasks")} />
        </div>
    );
}

export function AdminSidebar() {
    const path = usePathname();
    const router = useRouter();
    return (
        <div className="sidebar">
            <SidebarItem index={0} title="Home" onClick={() => { router.push("/admin") }} Icon={HomeIcon} active={path == "/admin"} />
            <Separator style={{ margin: "10px 0" }} />
            <div className="sidebar-section-title">Identities</div>
            <SidebarItem index={1} title="Accounts" onClick={() => { router.push("/admin/accounts") }} Icon={MailboxIcon} active={path == "/admin/accounts"} />
            <SidebarItem index={2} title="Groups" onClick={() => { router.push("/admin/groups") }} Icon={UsersIcon} active={path == "/admin/groups"} />
            <Separator style={{ margin: "10px 0" }} />
            <div className="sidebar-section-title">Organization</div>
            <SidebarItem index={3} title="Shared Folders" onClick={() => { router.push("/admin/sharedfolders") }} Icon={FolderIcon} active={path == "/admin/sharedfolders"} />
        </div>
    );
}
