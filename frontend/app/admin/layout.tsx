"use client";
import { SettingsDialog } from "@/components/components/settings";
import { AdminSidebar } from "@/components/components/sidebar";
import { AdminHeader } from "@/components/qui/header";
import { useAuth } from "keystone-lib";
import { createContext, useState } from "react";

export const GlobalContext = createContext({
    auth: undefined as any,
    settingsOpen: false,
    setSettingsOpen: (open: boolean) => { },
})

export default function MailLayout({ children }: { children: React.ReactNode }) {
    const auth = useAuth({ keystoneUrl: process.env.NEXT_PUBLIC_KEYSTONE_URL!, appId: process.env.NEXT_PUBLIC_APPID! });
    const [settingsOpen, setSettingsOpen] = useState(false);
    return (
        <GlobalContext.Provider value={{ auth: auth, settingsOpen: settingsOpen, setSettingsOpen: setSettingsOpen }}>
            <div className="page-header-container">
                <AdminHeader auth={auth} />
                <div className="page-sidebar-split">
                    <AdminSidebar />
                    {children}
                </div>
                <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
            </div>
        </GlobalContext.Provider>
    );
}