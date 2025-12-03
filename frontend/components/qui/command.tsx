import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, Command } from "../ui/command";
import { PenIcon } from "lucide-react";
// export function Command({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) {
//     return (
//         <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
//             <CommandInput placeholder="Type a command or search..." />
//             <CommandList>
//                 <CommandEmpty>No commands found.</CommandEmpty>
//                 <CommandGroup heading="Commands">
//                     <CommandItem><PenIcon />Compose Email</CommandItem>
//                     <CommandItem>Command 2</CommandItem>
//                 </CommandGroup>
//                 <CommandGroup heading="History">
//                     <CommandItem>Command 1</CommandItem>
//                     <CommandItem>Command 2</CommandItem>
//                 </CommandGroup>
//             </CommandList>
//         </CommandDialog>
//     );
// }

export function CommandPalette({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTitle style={{ display: "none" }}>Command Palette</DialogTitle>
            <DialogDescription style={{ display: "none" }}>Command Palette</DialogDescription>
            <DialogContent className="p-0" showCloseButton={false}>
                <Command>
                    <CommandInput placeholder="Type a command or search..." />
                    <CommandList>
                        <CommandEmpty>No commands found.</CommandEmpty>
                        <CommandGroup heading="Commands">
                            <CommandItem><PenIcon />Compose Email</CommandItem>
                            <CommandItem>Command 1</CommandItem>
                        </CommandGroup>
                        <CommandGroup heading="History">
                            <CommandItem>Command 2</CommandItem>
                            <CommandItem>Command 3</CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </DialogContent>
        </Dialog>
    );
}