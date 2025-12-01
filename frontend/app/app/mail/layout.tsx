import { FolderSidebarGroup } from "@/components/components/folder";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, FolderIcon, PenIcon, TagIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
export default function MailPage({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <div className="folder-sidebar">
                <ButtonGroup className="w-full p-[10px]">
                    <Button className="flex-1" variant="outline"><PenIcon /> Compose</Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline"><ChevronDownIcon /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem><FolderIcon />Folder</DropdownMenuItem>
                            <DropdownMenuItem><TagIcon />Label</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </ButtonGroup>
                <FolderSidebarGroup folders={[{ name: "Inbox", type: "smartmail.folder.inbox", id: 0 }, { name: "Sent", type: "smartmail.folder.sent", id: 1 }, { name: "Drafts", type: "smartmail.folder.drafts", id: 2 }, { name: "Trash", type: "smartmail.folder.trash", id: 3 }]} title="Folders" />
            </div>
            {children}
        </div>
    );
}