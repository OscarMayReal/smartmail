"use client";
import { SettingsDialog } from "@/components/components/settings";
import { NavigationSidebar } from "@/components/components/sidebar";
import { Header } from "@/components/qui/header";
import { AuthState, useAuth } from "keystone-lib";
import { createContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
export const GlobalContext = createContext({
    auth: undefined as AuthState | undefined,
    settingsOpen: false,
    setSettingsOpen: (open: boolean) => { },
    searchContent: "",
    setSearchContent: (content: string) => { }
})

export default function MailLayout({ children }: { children: React.ReactNode }) {
    const path = usePathname();
    useEffect(() => {
        if (path == "/app/mail" || path == "/app/calendar" || path == "/app/contacts" || path == "/app/tasks") {
            setSearchContent("");
        }
    }, [path])
    const auth = useAuth({ keystoneUrl: process.env.NEXT_PUBLIC_KEYSTONE_URL!, appId: process.env.NEXT_PUBLIC_APPID! });
    useEffect(() => {
        if (!auth?.loaded) return
        if (!auth?.data?.sessionId) {
            window.location.href = "https://keystoneapi.qplus.cloud/auth/signin?redirectTo=" + window.location.href
        }
    }, [auth])
    const [searchContent, setSearchContent] = useState("");
    const [settingsOpen, setSettingsOpen] = useState(false);
    return (
        <GlobalContext.Provider value={{ auth: auth, settingsOpen: settingsOpen, setSettingsOpen: setSettingsOpen, searchContent: searchContent, setSearchContent: setSearchContent }}>
            <div className="page-header-container">
                <Header auth={auth} />
                <div className="page-sidebar-split">
                    <NavigationSidebar />
                    {children}
                </div>
                <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
            </div>
        </GlobalContext.Provider>
    );
}