"use client";
import { MailItem, MailboxHeader } from "@/components/components/mail";
import { useContext, useEffect } from "react";
import { useParams } from "next/navigation";
import { GlobalContext } from "@/app/app/layout";
import { MailContext } from "../../layout";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { SparklesIcon } from "lucide-react";
export default function MailboxLayout({ children }: { children: React.ReactNode }) {
    const { messages, setMessages, folders } = useContext(MailContext)
    const { auth } = useContext(GlobalContext)
    const params = useParams()
    useEffect(() => {
        if (!auth.data?.sessionId) return
        fetch("/api/mail/folders/" + params.id + "/messages", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${auth.data.sessionId}`
            }
        }).then(res => res.json()).then(data => {
            setMessages(data)
        })
    }, [auth, params.id])
    return (
        <div className="flex flex-row h-full w-full">
            <div className="mailbox-sidebar">
                <MailboxHeader title={folders.find((folder) => folder.id == params.id)?.name || ""} />
                {messages.length == 0 ? (
                    <Empty className="flex flex-col items-center justify-center h-full w-full gap-2">
                        <EmptyMedia variant="icon" >
                            <SparklesIcon />
                        </EmptyMedia>
                        <EmptyTitle>Nothing to see here!</EmptyTitle>
                        <EmptyDescription>There are no messages in this folder.</EmptyDescription>
                    </Empty>
                ) : (
                    <div className="mailbox-sidebar-items">
                        {messages.map((message) => (
                            <MailItem key={message.id} item={message} />
                        ))}
                    </div>
                )}
            </div>
            {children}
        </div>
    );
}