"use client";
import { BuildingIcon, GlobeIcon, Grid2X2Icon, HomeIcon, IdCardLanyardIcon, LaptopMinimalIcon, LayoutDashboard, LayoutGrid, LayoutGridIcon, PenIcon, SettingsIcon, ShieldIcon, UserIcon, UsersIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { useWindowSize } from "@/lib/screensize";


function SidebarUserItem({ auth }: { auth: any }) {
    return (
        <div className="sidebar-user-item">
            <Avatar style={{ width: "40px", height: "40px", marginRight: "7px", border: "1px solid #e4e4e7" }}>
                <AvatarFallback>{auth.data?.user?.name?.charAt(0).toUpperCase()}{auth.data?.user?.name?.charAt(1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div style={{ width: "100%", overflow: "hidden", maxWidth: "100%" }}>
                <div className="sidebar-user-item-name">{auth.data?.user?.name}</div>
                <div className="sidebar-user-item-tenant">{auth.data?.user?.tenant?.id ? (auth.data?.user?.tenant?.name + "/" + auth.data?.user?.username) : auth.data?.user?.email}</div>
            </div>
        </div>
    );
}

export function SidebarItem({ title, onClick, Icon, active, index, variant }: { title: string, onClick: () => void, Icon: React.JSX.ElementType, active: boolean, index: number, variant?: "compact" | "highlight-selected" }) {
    return (
        <motion.div className={"sidebar-item" + (active ? " sidebar-item-active" : "") + (variant === "highlight-selected" && active ? " sidebar-item-highlight-selected" : "")} onClick={onClick} initial={{ x: "-100%" }} animate={{ x: "0%" }} transition={{ duration: variant === "compact" ? 0.2 : 0.5, delay: index * 0.1 }} style={variant === "compact" ? { width: "40px", maxWidth: "40px" } : {}}>
            {active && <motion.div
                key={`tabbar-animated-` + index}
                layoutId="tabbar-animated"
                className="sidebar-item-animated"
                transition={{
                    ease: "easeInOut",
                }}
                style={variant === "compact" ? { left: "10px" } : {}}
            />}
            <Icon size="20" />
            {variant !== "compact" && <div>{title}</div>}
        </motion.div>
    );
}

function SidebarFooter({ index }: { index: number }) {
    return (
        <motion.div className="sidebar-footer" initial={{ x: "-100%" }} animate={{ x: "0%" }} transition={{ duration: 0.5, delay: index * 0.1 }}>
            <div className="sidebar-footer-text">
                Quntem Keystone
            </div>
            <div className="sidebar-footer-version">
                Version {info.version}
            </div>
            <div className="sidebar-footer-extrainfo">
                <a href="https://github.com/quntem/keystone" target="_blank" style={{ textDecoration: "underline" }} rel="noreferrer">GitHub</a>
            </div>
        </motion.div>
    );
}
