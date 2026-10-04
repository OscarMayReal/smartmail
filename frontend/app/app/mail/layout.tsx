"use client";
import { CreateFolderDialog, FolderSidebarGroup } from "@/components/components/folder";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, FolderIcon, MailboxIcon, PenIcon, TagIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useEffect, useContext, createContext } from "react";
import { GlobalContext } from "../layout";
import { folder, email } from "@/../server/generated/prisma/browser";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export type MailAccount = {
    id: string;
    address: string;
    type: "personal" | "shared";
    userId: string | null;
    groupId: string | null;
    color: string;
};

export const MailContext = createContext({
    accounts: [] as MailAccount[],
    activeAccountId: null as string | null,
    folders: [] as folder[],
    messages: [] as (email & { selected: boolean })[],
    setFolders: (folders: any) => { },
    setMessages: (messages: any) => { }
})

export default function MailPage({ children }: { children: React.ReactNode }) {
    const { auth } = useContext(GlobalContext)
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const selectedAccountId = searchParams.get("accountId");
    const [accounts, setAccounts] = useState([] as MailAccount[])
    const [folders, setFolders] = useState([] as folder[])
    const [messages, setMessages] = useState([] as (email & { selected: boolean })[])
    const [hasMailAccount, setHasMailAccount] = useState<boolean | null>(null);
    const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
    useEffect(() => {
        const sessionId = auth?.data?.sessionId;
        if (!sessionId) return
        fetch("/api/mail/accounts", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${sessionId}`
            }
        }).then(async res => {
            const data = await res.json();
            if (!res.ok) {
                setHasMailAccount(false);
                setAccounts([]);
                setFolders([]);
                return;
            }
            const nextAccounts = Array.isArray(data) ? data : [];
            setAccounts(nextAccounts);
            setHasMailAccount(nextAccounts.length > 0);
        })
    }, [auth])
    const activeAccountId = selectedAccountId && accounts.some((account) => account.id === selectedAccountId)
        ? selectedAccountId
        : accounts[0]?.id ?? null;

    useEffect(() => {
        const sessionId = auth?.data?.sessionId;
        if (!sessionId || !activeAccountId) return;
        setFolders([]);
        fetch(`/api/mail/folders?accountId=${encodeURIComponent(activeAccountId)}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${sessionId}`
            }
        }).then(async res => {
            const data = await res.json();
            setHasMailAccount(Array.isArray(data));
            setFolders(Array.isArray(data) ? data : []);
        })
    }, [activeAccountId, auth])

    return (
        <MailContext.Provider value={{ accounts, activeAccountId, folders, messages, setFolders, setMessages }}>
            <div className="flex flex-row h-full w-full">
                <div className="folder-sidebar">
                    <ButtonGroup className="w-full p-[10px]">
                        <Button onClick={() => { router.push(`/app/mail/mailbox/${params.id}/compose?accountId=${encodeURIComponent(activeAccountId || "")}`) }} className="flex-1" variant="outline"><PenIcon /> Compose</Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline"><ChevronDownIcon /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setCreateFolderDialogOpen(true)}><FolderIcon />Folder</DropdownMenuItem>
                                {/* <DropdownMenuItem><TagIcon />Label</DropdownMenuItem> */}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </ButtonGroup>
                    <FolderSidebarGroup folders={folders} title="Folders" />
                    <CreateFolderDialog isOpen={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen} />
                </div>
                {hasMailAccount === false ? (
                    <Empty className="h-full w-full">
                        <EmptyMedia variant="icon"><MailboxIcon /></EmptyMedia>
                        <EmptyTitle>No mail account configured</EmptyTitle>
                        <EmptyDescription>Set up a mail account for this user in the Admin Center to start using SmartMail.</EmptyDescription>
                        <Link href="/admin/accounts"><Button variant="outline">Open Admin Center</Button></Link>
                    </Empty>
                ) : children}
            </div>
        </MailContext.Provider>
    );
}
