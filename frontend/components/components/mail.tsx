"use client";
import "./components.css";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Checkbox } from "../ui/checkbox";
import { ArchiveIcon, FolderInputIcon, ForwardIcon, RedoIcon, ReplyIcon, SendIcon, Trash2Icon, UndoIcon, XIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Toggle } from "../ui/toggle";
import { Switch } from "../ui/switch";
import { ButtonGroup } from "../ui/button-group";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
export function MailItem({ item }: { item: any }) {
    const router = useRouter();
    const params = useParams();
    return (
        <div className={"mail-item" + (params.messageid == item.id ? " active" : "")} onClick={() => { router.push(`/app/mail/mailbox/${params.id}/message/${item.id}`) }}>
            <Avatar style={{ width: "40px", height: "40px", border: "1px solid var(--qu-border-color)" }}>
                <AvatarFallback className="text-[var(--qu-text)]">AB</AvatarFallback>
            </Avatar>
            <div className="mail-item-content">
                <div className="mail-item-title">{item.from}</div>
                <div className="mail-item-subtitle">{item.subject}</div>
            </div>
        </div>
    );
}

export function MailboxHeader({ title }: { title: string }) {
    return (
        <div className="mail-header">
            <Checkbox />
            <div className="mail-header-title">{title}</div>
            <div className="flex-1" />
            <div className="flex flex-row gap-2 items-center">
                <div className="text-[var(--qu-text-secondary)]">Hide Read</div>
                <Switch />
            </div>
        </div>
    );
}

export function MailItemHeader({ title }: { title: string }) {
    return (
        <div className="mail-header">
            <XIcon size="20" />
            <div className="mail-header-title">{title}</div>
            <div className="flex-1" />
            <ButtonGroup>
                <Button variant="outline" size="sm"><Trash2Icon />Delete</Button>
                <Button variant="outline" size="sm"><ArchiveIcon /> Archive</Button>
                <Button variant="outline" size="sm"><FolderInputIcon /> Move</Button>
            </ButtonGroup>
        </div>
    );
}

export function MailItemFooter({ title, setReplyMode }: { title: string, setReplyMode: (mode: "reply" | "forward" | null) => void }) {
    return (
        <ButtonGroup>
            <Button variant="outline" size="sm" onClick={() => { setReplyMode("reply") }}><ReplyIcon />Reply</Button>
            <Button variant="outline" size="sm" onClick={() => { setReplyMode("forward") }}><ForwardIcon />Forward</Button>
        </ButtonGroup>
    );
}

export function SentfromHeader({ email, name }: { email: string, name: string }) {
    return (
        <div className="flex flex-row gap-2 items-center">
            <Avatar style={{ width: "40px", height: "40px", border: "1px solid var(--qu-border-color)" }}>
                <AvatarFallback className="text-[var(--qu-text)]">AB</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <div className="mail-page-sender-name">{name}</div>
                <div className="mail-page-sender-email">{email}</div>
            </div>
        </div>
    );
}

export function ReplyComposer({ setReplyMode }: { setReplyMode: (mode: "reply" | "forward" | null) => void }) {
    return (
        <div className="reply-composer shadow-xs">
            <div className="reply-composer-header">
                <Button variant="ghost" size="icon-sm" ><UndoIcon /></Button>
                <Button variant="ghost" size="icon-sm" ><RedoIcon /></Button>
                <Separator orientation="vertical" />
                <div className="flex-1" />
                <Separator orientation="vertical" />
                <Button variant="ghost" size="icon-sm" onClick={() => { setReplyMode(null) }}><XIcon /></Button>
                <Button variant="default" size="icon-sm"><SendIcon /></Button>
            </div>
            <div className="reply-composer-content h-100">

            </div>
        </div>
    );
}