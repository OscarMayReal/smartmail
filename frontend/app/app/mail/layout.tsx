"use client";
import { CreateFolderDialog, FolderSidebarGroup } from "@/components/components/folder";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, FolderIcon, PenIcon, TagIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useEffect, useContext, createContext } from "react";
import { GlobalContext } from "../layout";
import { folder, email } from "@/../server/generated/prisma/browser";
import { useRouter, useParams } from "next/navigation";

export const MailContext = createContext({
    folders: [] as folder[],
    messages: [] as (email & { selected: boolean })[],
    setFolders: (folders: any) => { },
    setMessages: (messages: any) => { }
})

export default function MailPage({ children }: { children: React.ReactNode }) {
    const { auth } = useContext(GlobalContext)
    const router = useRouter();
    const params = useParams();
    const [folders, setFolders] = useState([] as folder[])
    const [messages, setMessages] = useState([] as (email & { selected: boolean })[])
    const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
    useEffect(() => {
        if (!auth.data?.sessionId) return
        fetch("/api/mail/folders", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${auth.data.sessionId}`
            }
        }).then(res => res.json()).then(data => {
            setFolders(data)
        })
    }, [auth])
    return (
        <MailContext.Provider value={{ folders, messages, setFolders, setMessages }}>
            <div className="flex flex-row h-full w-full">
                <div className="folder-sidebar">
                    <ButtonGroup className="w-full p-[10px]">
                        <Button onClick={() => { router.push(`/app/mail/mailbox/${params.id}/compose`) }} className="flex-1" variant="outline"><PenIcon /> Compose</Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline"><ChevronDownIcon /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setCreateFolderDialogOpen(true)}><FolderIcon />Folder</DropdownMenuItem>
                                <DropdownMenuItem><TagIcon />Label</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </ButtonGroup>
                    <FolderSidebarGroup folders={folders} title="Folders" />
                    <CreateFolderDialog isOpen={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen} />
                </div>
                {children}
            </div>
        </MailContext.Provider>
    );
}