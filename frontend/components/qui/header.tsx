"use client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { JSX, useEffect, useRef, useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeftIcon, Building2Icon, ChevronDownIcon, LayoutGrid, LogInIcon, LogOutIcon, MenuIcon, SearchIcon, SettingsIcon, SparklesIcon, UserIcon, UsersIcon } from "lucide-react";
import { useWindowSize } from "@/lib/screensize";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
// import { AdminSidebar, TeamSidebar, UserSidebar } from "./sidebar";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
// import { Launcher } from "./launcher";
import { DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export const Header = ({ title, auth }: { title: string, auth: any }) => {
    const router = useRouter();
    const size = useWindowSize();
    const [open, setOpen] = useState(false);
    const path = usePathname();
    const searchParams = useSearchParams()
    useEffect(() => {
        if (auth.data?.user?.id && auth.loaded) {
            console.log(auth.data);
        } else if (auth.data?.error && auth.loaded) {
            window.location.href = process.env.NEXT_PUBLIC_API_URL + "/auth/signin?redirectTo=" + window.location.href;
        }
    }, [auth]);
    if (auth.data?.tenant?.type == "Team" && !path.startsWith("/account")) {
        router.push("/account");
    }
    return (
        <header>
            {/* {tenant.data?.tenant?.type === "Organization" ? <Launcher /> : null} */}
            {auth.data?.tenant?.logo && <div style={{ width: "10px" }} />}
            {/* <SidebarDrawer open={open} onOpenChange={setOpen} /> */}
            {auth.data?.tenant?.logo ? <><img src={auth.data?.tenant?.logo} className="header-logo" /><div className="header-logo-divider" /></> : null}
            <div style={{ width: "15px" }} />
            <div className="header-title">{title}</div>
            <div style={{ flex: 1 }}>
                <div style={{ width: "500px", position: "absolute", left: "50%", transform: "translate(-50%, -50%)", top: "50%" }}>
                    <SearchBox />
                </div>
            </div>
            <Button variant="ghost" size={"icon-sm"} className="mr-2" onClick={() => { setOpen(true) }}><SettingsIcon /></Button>
            <HeaderUser auth={auth} />
        </header>
    );
};

function SearchBox() {
    return (
        <InputGroup>
            <InputGroupAddon>
                <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput placeholder="Search" />
        </InputGroup>
    );
}

// function HeaderDropdown({ user, title }: { user: any, title: string }) {
//     const router = useRouter();
//     const path = usePathname();
//     const triggerRef = useRef<HTMLDivElement>(null);
//     return (
//         <DropdownMenu>
//             <DropdownMenuTrigger style={{ display: "flex", alignItems: "center", gap: "5px", outline: "none" }} ref={triggerRef}>
//                 <div className="header-title">{title}</div>
//                 <ChevronDownIcon size="20" />
//             </DropdownMenuTrigger>
//             <DropdownMenuContent side="bottom" align="center" sideOffset={20} style={{ width: triggerRef.current?.offsetWidth }}>
//                 {!path.startsWith("/account") ? <DropdownMenuItem style={{ fontFamily: "Figtree", fontSize: "16px", color: "var(--qu-text)" }} onClick={() => { router.push("/account") }}><UserIcon size={20} />Account</DropdownMenuItem> : null}
//                 {!path.startsWith("/apps") ? <DropdownMenuItem style={{ fontFamily: "Figtree", fontSize: "16px", color: "var(--qu-text)" }} onClick={() => { router.push("/apps") }}><LayoutGrid size={20} />Apps</DropdownMenuItem> : null}
//                 {(user?.data?.user?.role === "ADMIN" && !path.startsWith("/admin")) ? <DropdownMenuItem style={{ fontFamily: "Figtree", fontSize: "16px", color: "var(--qu-text)" }} onClick={() => { router.push("/admin") }}><SettingsIcon size={20} />Admin</DropdownMenuItem> : null}
//             </DropdownMenuContent>
//         </DropdownMenu>
//     );
// }

// export function SidebarDrawer({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
//     const path = usePathname();
//     return (
//         <Drawer direction="left" open={open} onOpenChange={onOpenChange}>
//             <DrawerContent style={{ width: "250px" }}>
//                 {path.startsWith("/admin") ? <AdminSidebar ignoreSize /> : path.startsWith("/team") ? <TeamSidebar ignoreSize /> : <UserSidebar ignoreSize />}
//             </DrawerContent>
//         </Drawer>
//     );
// }

export function UserItem({ user, Extra, onClick }: { user: any, Extra?: JSX.Element, onClick?: () => void }) {
    return (
        <div className="flex items-center gap-2" onClick={onClick}>
            <Avatar className="border border-[var(--qu-border-color)]" style={{ fontSize: "14px", fontWeight: "400" }}>
                <AvatarFallback style={{ color: "var(--qu-text)" }}>{user.name.charAt(0).toUpperCase() + user.name.charAt(1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold text-sm color-[var(--qu-text)]">{user.name}</span>
                <span className="truncate opacity-70 text-xs color-[var(--qu-text-secondary)]">{user.email}</span>
            </div>
            {Extra}
        </div>
    );
}

function HeaderUser({ auth }: { auth: any }) {
    const size = useWindowSize();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="header-user-container-outer">
                    {/* {(size.width < 550 && size.width != 0) ? null : <div className="header-user-container">
                        <div className="header-user-text">{auth.data?.user?.name} {auth.data?.user?.tenant?.id ? "(" + auth.data?.user?.tenant?.name + "/" + auth.data?.user?.username + ")" : ""}</div>
                        <div className="header-company-text">{auth.data?.user?.email} {auth.data?.user?.tenant?.id ? "(" + auth.data?.user?.tenant?.name + ")" : ""}</div>
                    </div>} */}
                    <Tooltip>
                        <TooltipTrigger>
                            <Avatar style={{ width: "30px", height: "30px", marginRight: "10px", border: "1px solid var(--qu-border-color)" }}>
                                <AvatarFallback style={{ color: "var(--qu-text)" }}>{auth.data?.user?.name.charAt(0).toUpperCase() + auth.data?.user?.name.charAt(1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                            Your Account
                        </TooltipContent>
                    </Tooltip>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" sideOffset={20} alignOffset={10}>
                <div className="p-2">
                    <UserItem user={auth.data?.user} />
                </div>
                {/* <DropdownMenuSeparator /> */}
                {/* <DropdownMenuItem className="color-[var(--qu-text)]" onClick={() => { LogOut().then(() => { window.location.href = process.env.NEXT_PUBLIC_API_URL + "/auth/signin?redirectTo=" + window.location.href }) }}><LogOutIcon size={20} />Logout</DropdownMenuItem> */}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function BaseHeader({ title }: { title: string }) {
    return (
        <header>
            <div style={{ width: "15px" }} />
            <div className="header-title">{title}</div>
            <div style={{ flex: 1 }} />
        </header>
    );
}
