"use client";
import { NavigationSidebar } from "@/components/components/sidebar";
import { Header } from "@/components/qui/header";
import { useAuth } from "keystone-lib";

export default function MailLayout({ children }: { children: React.ReactNode }) {
    const auth = useAuth({ keystoneUrl: process.env.NEXT_PUBLIC_KEYSTONE_URL!, appId: process.env.NEXT_PUBLIC_APPID! });
    return (
        <div className="page-header-container">
            <Header title="Mail" auth={auth} />
            <div className="page-sidebar-split">
                <NavigationSidebar />
                {children}
            </div>
        </div>
    );
}