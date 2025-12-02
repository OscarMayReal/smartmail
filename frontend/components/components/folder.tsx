"use client";
import { InboxIcon, FolderIcon, SendIcon, PencilIcon, Trash2Icon, ArchiveIcon } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { Badge } from "../ui/badge";
import { folder } from "@/../server/generated/prisma/browser";

export function FolderSidebarItem({ folder }: { folder: folder }) {
    const router = useRouter();
    const path = usePathname();
    var Icon = getTypeIcon(folder.type)
    return (
        <div className={`folder-sidebar-item ${path.startsWith(`/app/mail/mailbox/${folder.id}`) ? "active" : ""}`} onClick={() => { router.push(`/app/mail/mailbox/${folder.id}`) }}>
            <Icon size="20" />
            <div className="folder-sidebar-item-text">{folder.name}</div>
            <div className="flex-1" />
            {/* {folder.unreadCount > 0 && <Badge variant="outline" className="text-[var(--qu-text)] bg-[var(--qu-header-background)]">{folder.unreadCount}</Badge>} */}
        </div>
    );
}

export function getTypeIcon(type: string) {
    switch (type) {
        case "smartmail.folder.inbox":
            return InboxIcon
        case "smartmail.folder.sent":
            return SendIcon
        case "smartmail.folder.drafts":
            return PencilIcon
        case "smartmail.folder.trash":
            return Trash2Icon
        case "smartmail.folder.archive":
            return ArchiveIcon
        default:
            return FolderIcon
    }
}

export function FolderSidebarGroup({ folders, title }: { folders: folder[], title: string }) {
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
