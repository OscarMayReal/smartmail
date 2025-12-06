"use client"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { CheckIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

export function ConfirmDialog({
    title,
    description,
    isOpen,
    onConfirm,
    onClose,
    variant,
}: {
    title: string;
    description: string;
    isOpen: boolean;
    onConfirm: () => void;
    onClose: () => void;
    variant?: "default" | "destructive";
}) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                {variant === "destructive" ? <DialogFooter>
                    <Button variant="outline" onClick={onClose}><XIcon size={20} />Cancel</Button>
                    <Button onClick={onConfirm} variant="destructive"><CheckIcon size={20} />Confirm</Button>
                </DialogFooter> : <DialogFooter>
                    <Button variant="outline" onClick={onClose}><XIcon size={20} />Cancel</Button>
                    <Button onClick={onConfirm}><CheckIcon size={20} />Confirm</Button>
                </DialogFooter>}
            </DialogContent>
        </Dialog>
    );
}

export function InputDialog({
    title,
    description,
    isOpen,
    onConfirm,
    onClose,
    input,
    setInput,
    inputType,
}: {
    title: string;
    description: string;
    isOpen: boolean;
    onConfirm: () => void;
    onClose: () => void;
    input: string;
    setInput: (input: string) => void;
    inputType: "text" | "password";
}) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <Input value={input} onChange={(e) => setInput(e.target.value)} type={inputType} />
                <DialogFooter>
                    <Button onClick={onConfirm}><CheckIcon size={20} />Confirm</Button>
                    <Button variant="outline" onClick={onClose}><XIcon size={20} />Cancel</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}