"use client";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { MailIcon, MailboxIcon, XIcon } from "lucide-react";
import { useContext } from "react";
import { MailContext } from "@/app/app/mail/layout";
import { Button } from "@/components/ui/button";
import { MoveSelectedMessagesDropdown } from "@/components/components/mail";
export default function MailboxPage() {
    const { messages, setMessages } = useContext(MailContext)
    if (messages.filter((message) => message.selected).length > 0) {
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
        <div className="h-full w-full">
            <Empty className="flex flex-col items-center justify-center h-full w-full gap-2">
                <EmptyMedia variant="icon" >
                    <MailIcon />
                </EmptyMedia>
                <EmptyTitle>Nothing Selected</EmptyTitle>
                <EmptyDescription>Select a message to read it here</EmptyDescription>
            </Empty>
        </div>
    );
}