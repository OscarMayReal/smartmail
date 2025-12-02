import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { MailIcon } from "lucide-react";
export default function MailboxPage() {
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