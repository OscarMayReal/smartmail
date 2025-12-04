"use client";
import { ComposeHeader, RecepientsInput } from "@/components/components/compose";
import { useState } from "react";
import { ComposerEditor } from "@/components/components/compose";
import { Tag } from "emblor-maintained";
import { useContext } from "react";
import { GlobalContext } from "@/app/app/layout";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

export default function ComposePage() {
    const { auth } = useContext(GlobalContext);
    const router = useRouter();
    const params = useParams();
    const [text, setText] = useState("");
    const [tags, setTags] = useState<Tag[]>([]);
    const [subject, setSubject] = useState("");
    return <div className="flex flex-col h-full w-full">
        <ComposeHeader onSend={() => {
            if (!auth.loaded || !auth.data) return;
            fetch("/api/mail/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "accept": "application/json",
                    "Authorization": "Bearer " + auth.data.sessionId
                },
                body: JSON.stringify({
                    email: {
                        to: tags.map(tag => tag.text),
                        subject: subject,
                        html: text,
                    }
                })
            }).then(() => {
                router.push("/app/mail/mailbox/" + params.id)
                toast.success("Mail sent successfully");
            })
        }} />
        <div className="mail-page-main">
            <RecepientsInput tags={tags} setTags={setTags} subject={subject} setSubject={setSubject} />
            <ComposerEditor text={text} setText={setText} />
        </div>
    </div>;
}