"use client";
import { MailItem, MailboxHeader } from "@/components/components/mail";
import { useContext, useEffect } from "react";
import { useParams } from "next/navigation";
import { GlobalContext } from "@/app/app/layout";
import { MailContext } from "../../layout";
export default function MailboxLayout({ children }: { children: React.ReactNode }) {
    const { messages, setMessages } = useContext(MailContext)
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
                <MailboxHeader title="Inbox" />
                <div className="mailbox-sidebar-items">
                    {messages.map((message) => (
                        <MailItem key={message.id} item={message} />
                    ))}
                </div>
            </div>
            {children}
        </div>
    );
}