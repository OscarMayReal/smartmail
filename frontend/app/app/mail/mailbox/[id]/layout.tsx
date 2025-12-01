"use client";
import { MailItem, MailboxHeader } from "@/components/components/mail";
export default function MailboxLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-row h-full w-full">
            <div className="mailbox-sidebar">
                <MailboxHeader title="Inbox" />
                <div className="mailbox-sidebar-items">
                    <MailItem item={{ from: "test@test.com", subject: "Important Message", id: 1 }} />
                    <MailItem item={{ from: "test@test.com", subject: "Important Message", id: 2 }} />
                    <MailItem item={{ from: "test@test.com", subject: "Important Message", id: 3 }} />
                    <MailItem item={{ from: "test@test.com", subject: "Important Message", id: 4 }} />
                    <MailItem item={{ from: "test@test.com", subject: "Important Message", id: 5 }} />
                    <MailItem item={{ from: "test@test.com", subject: "Important Message", id: 6 }} />
                    <MailItem item={{ from: "test@test.com", subject: "Important Message", id: 7 }} />
                    <MailItem item={{ from: "test@test.com", subject: "Important Message", id: 8 }} />
                    <MailItem item={{ from: "test@test.com", subject: "Important Message", id: 9 }} />
                    <MailItem item={{ from: "test@test.com", subject: "Important Message", id: 10 }} />
                    <MailItem item={{ from: "test@test.com", subject: "Important Message", id: 11 }} />
                    <MailItem item={{ from: "test@test.com", subject: "Important Message", id: 12 }} />
                    <MailItem item={{ from: "test@test.com", subject: "Important Message", id: 13 }} />
                    <MailItem item={{ from: "test@test.com", subject: "Important Message", id: 14 }} />
                    <MailItem item={{ from: "test@test.com", subject: "Important Message", id: 15 }} />
                    <MailItem item={{ from: "test@test.com", subject: "Important Message", id: 16 }} />
                    <MailItem item={{ from: "test@test.com", subject: "Important Message", id: 17 }} />
                    <MailItem item={{ from: "test@test.com", subject: "Important Message", id: 18 }} />
                    <MailItem item={{ from: "test@test.com", subject: "Important Message", id: 19 }} />
                    <MailItem item={{ from: "test@test.com", subject: "Important Message", id: 20 }} />
                </div>
            </div>
            {children}
        </div>
    );
}