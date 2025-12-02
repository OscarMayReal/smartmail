"use client";
import { MailItemHeader, MailItemFooter, SentfromHeader } from "@/components/components/mail";
import { useState } from "react";
import { ReplyComposer } from "@/components/components/mail";
export default function MailMessagePage() {
    const [replyMode, setReplyMode] = useState<"reply" | "forward" | null>(null);
    return (
        <div className="flex flex-col h-full w-full">
            <MailItemHeader title="Message" />
            <div className="mail-page-main">
                <SentfromHeader email="sender@example.com" name="Sender" />
                {replyMode == null ? <MailItemFooter setReplyMode={setReplyMode} title="Message" /> : <ReplyComposer setReplyMode={setReplyMode} />}
            </div>
        </div>
    );
}