"use client";
import { MailItem, MailboxHeader } from "@/components/components/mail";
import { useContext, useEffect } from "react";
import { useParams } from "next/navigation";
import { GlobalContext } from "@/app/app/layout";
import { MailContext } from "../../layout";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { SparklesIcon } from "lucide-react";
import { email } from "../../../../../../server/generated/prisma/browser";
export default function MailboxLayout({ children }: { children: React.ReactNode }) {
    const { messages, setMessages, folders, activeAccountId } = useContext(MailContext)
    const { auth } = useContext(GlobalContext)
    const params = useParams()
    const { searchContent } = useContext(GlobalContext)
    useEffect(() => {
        if (!auth.data?.sessionId) return
        const controller = new AbortController();
        const query = searchContent.trim();
        const accountQuery = activeAccountId ? `&accountId=${encodeURIComponent(activeAccountId)}` : "";
        const requestUrl = query
            ? `/api/mail/search?q=${encodeURIComponent(query)}&folderId=${encodeURIComponent(String(params.id))}${accountQuery}`
            : `/api/mail/folders/${params.id}/messages${activeAccountId ? "?accountId=" + encodeURIComponent(activeAccountId) : ""}`;
        const timeout = window.setTimeout(() => {
            fetch(requestUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${auth.data.sessionId}`
                },
                signal: controller.signal,
            }).then(res => res.json()).then(data => {
                if (!controller.signal.aborted) {
                    setMessages(data.map((message: email) => ({ ...message, selected: false })))
                }
            }).catch(() => undefined);
        }, query ? 200 : 0);
        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [activeAccountId, auth, params.id, searchContent])
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
                        <EmptyDescription>{searchContent.trim() ? "No messages match your search." : "There are no messages in this folder."}</EmptyDescription>
                    </Empty>
                ) : (
                    <div className="mailbox-sidebar-items">
                        {messages.map((message: email & { selected: boolean }) => (
                            <MailItem key={message.id} item={message} />
                        ))}
                    </div>
                )}
            </div>
            {children}
        </div>
    );
}
