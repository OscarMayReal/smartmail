"use client";
import { MailItemHeader, MailItemFooter, SentfromHeader } from "@/components/components/mail";
import { useState, useRef } from "react";
import { ReplyComposer } from "@/components/components/mail";
import { email } from "@/../server/generated/prisma/browser";
import { useContext } from "react";
import { GlobalContext } from "@/app/app/layout";
import { useParams } from "next/navigation";
import { useEffect } from "react";
export default function MailMessagePage() {
    const [replyMode, setReplyMode] = useState<"reply" | "forward" | null>(null);
    const [message, setMessage] = useState<email | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { auth } = useContext(GlobalContext)
    const params = useParams()

    useEffect(() => {
        if (!auth.data?.sessionId || !params.messageid) return
        fetch("/api/mail/messages/" + params.messageid, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${auth.data.sessionId}`
            }
        }).then(res => res.json()).then(data => {
            setMessage(data)
        })
    }, [auth, params.messageid])

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
    return (
        <div className="flex flex-col h-full w-full">
            <MailItemHeader message={message!} />
            <div className="mail-page-main">
                <SentfromHeader message={message!} />
                <iframe ref={iframeRef} srcDoc={message.email.html!} style={{ width: '100%', border: 'none', overflow: 'hidden', backgroundColor: 'var(--qu-header-background)', border: '1px solid var(--qu-border-color)', borderRadius: '10px' }} />
                {replyMode == null ? <MailItemFooter setReplyMode={setReplyMode} title="Message" /> : <ReplyComposer replyMode={replyMode} message={message!} setReplyMode={setReplyMode} />}
            </div>
        </div>
    );
}