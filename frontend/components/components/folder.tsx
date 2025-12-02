"use client";
import { InboxIcon, FolderIcon, SendIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { Badge } from "../ui/badge";

export function FolderSidebarItem({ folder }: { folder: any }) {
    const router = useRouter();
    const path = usePathname();
    var Icon = FolderIcon
    switch (folder.type) {
        case "smartmail.folder.inbox":
            Icon = InboxIcon
            break;
        case "smartmail.folder.sent":
            Icon = SendIcon
            break;
        case "smartmail.folder.drafts":
            Icon = PencilIcon
            break;
        case "smartmail.folder.trash":
            Icon = Trash2Icon
            break;
    }
    return (
        <div className={`folder-sidebar-item ${path.startsWith(`/app/mail/mailbox/${folder.id}`) ? "active" : ""}`} onClick={() => { router.push(`/app/mail/mailbox/${folder.id}`) }}>
            <Icon size="20" />
            <div className="folder-sidebar-item-text">{folder.name}</div>
            <div className="flex-1" />
            {folder.unreadCount > 0 && <Badge variant="outline" className="text-[var(--qu-text)] bg-[var(--qu-header-background)]">{folder.unreadCount}</Badge>}
        </div>
    );
}

export function FolderSidebarGroup({ folders, title }: { folders: any[], title: string }) {
    return (
        <div className="folder-sidebar-group">
            <div className="folder-sidebar-group-title">{title}</div>
            <div className="folder-sidebar-group-items">
                {folders.map((folder) => (
                    <FolderSidebarItem key={folder.id} folder={folder} />
                ))}
            </div>
        </div>
    );
}
