import { BellIcon, PaintbrushIcon, UserIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useState } from "react";

export function SettingsDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const [tab, setTab] = useState("account");
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="dialog" style={{ padding: "0px", width: "75%", height: "75%", maxWidth: "75%", maxHeight: "75%" }}>
                <Tabs value={tab} onValueChange={setTab}>
                    <DialogHeader className="dialog-header">
                        <DialogTitle>Settings</DialogTitle>
                        <TabsList className="dialog-tabs">
                            <TabsTrigger value="account"><UserIcon />Account</TabsTrigger>
                            <TabsTrigger value="display"><PaintbrushIcon />Display</TabsTrigger>
                            <TabsTrigger value="notifications"><BellIcon />Notifications</TabsTrigger>
                        </TabsList>
                    </DialogHeader>
                    <TabsContent value="account">Account</TabsContent>
                    <TabsContent value="display">Display</TabsContent>
                    <TabsContent value="notifications">Notifications</TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}