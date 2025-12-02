"use client";
import { ComposeHeader, RecepientsInput } from "@/components/components/compose";
import { useState } from "react";
import { ComposerEditor } from "@/components/components/compose";

export default function ComposePage() {
    const [text, setText] = useState("");
    return <div className="flex flex-col h-full w-full">
        <ComposeHeader />
        <div className="mail-page-main">
            <RecepientsInput />
            <ComposerEditor text={text} setText={setText} />
        </div>
    </div>;
}