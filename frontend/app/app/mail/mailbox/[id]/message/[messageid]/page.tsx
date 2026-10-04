"use client";
import { MailItemHeader, MailItemFooter, SentfromHeader, MoveSelectedMessagesDropdown, setEmailReadInteractive } from "@/components/components/mail";
import { useState, useRef } from "react";
import { ReplyComposer } from "@/components/components/mail";
import { email } from "@/../server/generated/prisma/browser";
import { useContext } from "react";
import { GlobalContext } from "@/app/app/layout";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { FolderInputIcon, MailboxIcon, Trash2Icon, XIcon } from "lucide-react";
import { MailContext } from "@/app/app/mail/layout";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
export default function MailMessagePage() {
    const [replyMode, setReplyMode] = useState<"reply" | "forward" | null>(null);
    const [message, setMessage] = useState<email | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { auth } = useContext(GlobalContext)
    const { setMessages, messages, activeAccountId } = useContext(MailContext)
    const params = useParams()

    useEffect(() => {
        if (!auth.data?.sessionId || !params.messageid) return
        fetch("/api/mail/messages/" + params.messageid + (activeAccountId ? "?accountId=" + encodeURIComponent(activeAccountId) : ""), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${auth.data.sessionId}`
            }
        }).then(res => res.json()).then(async data => {
            if (data?.unseen) {
                try {
                    await setEmailReadInteractive({ messageId: data.id, messages, setMessages, auth, accountId: activeAccountId || undefined, unread: false });
                    data.unseen = false;
                } catch (error) {
                    console.error("Unable to mark email as read", error);
                }
            }
            setMessage(data)
        })
    }, [activeAccountId, auth, params.messageid])

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const resizeIframe = () => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (iframeDoc) {
                    const style = iframeDoc.createElement('style');
                    style.textContent = `
                        html, body {
                            overflow: hidden !important;
                        }
                    `;
                    iframeDoc.head.appendChild(style);
                    const setHeight = () => {
                        const height = iframeDoc.documentElement.scrollHeight;
                        iframe.style.height = height + 'px';
                        iframe.style.minHeight = height + 'px';
                    };

                    setHeight();
                    setTimeout(setHeight, 100);

                    const observer = new MutationObserver(() => {
                        const newHeight = iframeDoc.documentElement.scrollHeight;
                        iframe.style.height = newHeight + 'px';
                        iframe.style.minHeight = newHeight + 'px';
                    });

                    observer.observe(iframeDoc.body, {
                        attributes: true,
                        childList: true,
                        subtree: true
                    });

                    return () => observer.disconnect();
                }
            } catch (error) {
                console.error('Error resizing iframe:', error);
            }
        };

        iframe.addEventListener('load', resizeIframe);
        return () => iframe.removeEventListener('load', resizeIframe);
    }, [message]);

    if (!message) return null
    if (messages.filter((message) => message.selected).length > 1) {
        return (
            <div className="flex flex-col h-full w-full">
                <Empty className="flex flex-col h-full w-full gap-2">
                    <EmptyMedia>
                        <MailboxIcon />
                    </EmptyMedia>
                    <EmptyTitle>
                        {messages.filter((message) => message.selected).length} Messages Selected
                    </EmptyTitle>
                    <EmptyContent className="flex flex-col gap-1">
                        <Button size="sm" variant="ghost" onClick={() => {
                            setMessages(messages.map((message) => { message.selected = false; return message }))
                        }}><XIcon />Deselect</Button>
                        <MoveSelectedMessagesDropdown />
                    </EmptyContent>
                </Empty>
            </div>
        );
    }
    return (
        <div className="flex flex-col h-full w-full">
            <MailItemHeader message={message!} onReadStateChange={(unseen) => setMessage({ ...message!, unseen })} />
            <div className="mail-page-main">
                <SentfromHeader message={message!} />
                <iframe ref={iframeRef} srcDoc={message.email.html!} style={{ width: '100%', border: 'none', overflow: 'hidden', backgroundColor: 'var(--qu-header-background)', border: '1px solid var(--qu-border-color)', borderRadius: '10px' }} />
                {replyMode == null ? <MailItemFooter setReplyMode={setReplyMode} title="Message" /> : <ReplyComposer replyMode={replyMode} message={message!} setReplyMode={setReplyMode} />}
            </div>
        </div>
    );
}
