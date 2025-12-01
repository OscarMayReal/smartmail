"use client";
import "./components.css";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Checkbox } from "../ui/checkbox";
import { XIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Toggle } from "../ui/toggle";
import { Switch } from "../ui/switch";
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
        </div>
    );
}
