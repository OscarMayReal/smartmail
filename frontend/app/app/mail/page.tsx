"use client";

import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MailContext } from "./layout";

export default function MailPage() {
    const router = useRouter();
    const { folders, activeAccountId } = useContext(MailContext);

    useEffect(() => {
        if (!activeAccountId) return;
        const inbox = folders.find((folder) => folder.type === "smartmail.folder.inbox");
        const destination = inbox ?? folders[0];
        if (destination) {
            router.replace(`/app/mail/mailbox/${destination.id}?accountId=${encodeURIComponent(activeAccountId)}`);
        }
    }, [activeAccountId, folders, router]);

    return <div />;
}
