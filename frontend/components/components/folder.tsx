"use client";
import { InboxIcon, FolderIcon, SendIcon, PencilIcon, Trash2Icon, ArchiveIcon, XIcon, PlusIcon, MoreHorizontalIcon, PenIcon } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Badge } from "../ui/badge";
import { folder } from "@/../server/generated/prisma/browser";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useContext, useState } from "react";
import { GlobalContext } from "@/app/app/layout";
import { MailContext } from "@/app/app/mail/layout";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function FolderSidebarItem({ folder }: { folder: folder }) {
    const router = useRouter();
    const path = usePathname();
    const searchParams = useSearchParams();
    var Icon = getTypeIcon(folder.type)
    return (
        <div className={`folder-sidebar-item ${path.startsWith(`/app/mail/mailbox/${folder.id}`) ? "active" : ""}`} onClick={() => { router.push(`/app/mail/mailbox/${folder.id}?${searchParams.toString()}`) }}>
            <Icon size="20" />
            <div className="folder-sidebar-item-text">{folder.name}</div>
            <div className="flex-1" />
            <DropdownMenu>
                <DropdownMenuTrigger className="folder-sidebar-item-dropdown-trigger" asChild>
                    <MoreHorizontalIcon size="16" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled={folder.type !== "smartmail.folder.custom"} onClick={() => { router.push(`/app/mail/mailbox/${folder.id}/compose`) }}><PenIcon /> Rename</DropdownMenuItem>
                    <DropdownMenuItem disabled={folder.type !== "smartmail.folder.custom"} onClick={() => { router.push(`/app/mail/mailbox/${folder.id}/compose`) }}><Trash2Icon /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
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

export function CreateFolderDialog({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    const [name, setName] = useState("");
    const { setFolders, activeAccountId } = useContext(MailContext);
    const { auth } = useContext(GlobalContext);
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Folder</DialogTitle>
                    <DialogDescription>
                        Create a new folder to organize your emails.
                    </DialogDescription>
                </DialogHeader>
                <Input placeholder="Folder name" value={name} onChange={(e) => setName(e.target.value)} />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline"><XIcon />Cancel</Button>
                    </DialogClose>
                    <Button onClick={() => {
                        fetch("/api/mail/folders", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${auth.data?.sessionId}`
                            },
                            body: JSON.stringify({ name, accountId: activeAccountId })
                        }).then(res => res.json()).then(data => {
                            setFolders(data);
                            onOpenChange(false);
                        })
                    }}><PlusIcon />Create</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
