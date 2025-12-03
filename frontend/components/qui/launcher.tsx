import { GripIcon, LayoutGridIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { useContext } from "react";
import { GlobalContext } from "@/app/app/layout";
function QuntemLogoSvg() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.5" y="0.5" width="15" height="15" rx="7.5" stroke="#666666" />
            <rect x="2.90039" y="2.8999" width="10.2" height="10.2" rx="5.1" stroke="#666666" />
            <rect x="5.30078" y="5.2998" width="5.4" height="5.4" rx="2.7" stroke="#666666" />
        </svg>

    );
}

export function Launcher({ authManual, width }: { authManual?: any, width?: string }) {
    const { auth } = useContext(GlobalContext);
    const lauth = authManual || auth;
    return (
        <DropdownMenu>
            <DropdownMenuTrigger style={{
                outline: "none",
                cursor: "pointer",
                aspectRatio: "1/1",
                height: "100%",
                width: width || undefined,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }} className="hover:bg-gray-100">
                <GripIcon size={20} />
            </DropdownMenuTrigger>
            <DropdownMenuContent sideOffset={10} alignOffset={10} align="start" style={{ width: "342px", padding: "15px", gap: "15px", display: "flex", flexDirection: "column" }}>
                <div className="flex flex-row items-center gap-3">
                    <QuntemLogoSvg />
                    <div style={{ fontFamily: "Figtree", fontSize: "16px", color: "var(--qu-text)", fontWeight: "500" }}>Quntem Services</div>
                </div>
                <div className="flex flex-row items-center gap-[10px] flex-wrap">
                    <AppTile name="KeyStone" description="Powerful and secure authentication" icon="/icon.svg" />
                    <AppTile name="Clatter" description="Simple open source business chat" icon="https://clatter.work/ClatterLogo.svg" />
                    <AppTile name="Creator" description="Design graphics with ease" icon="https://creator.quntem.co.uk/assets/creator-logo.png" />
                    {/* <AppTile name="KeyStone" description="KeyStone" icon="/icon.svg"/>
                    <AppTile name="KeyStone" description="KeyStone" icon="/icon.svg"/>
                    <AppTile name="KeyStone" description="KeyStone" icon="/icon.svg"/>
                    <AppTile name="KeyStone" description="KeyStone" icon="/icon.svg"/>
                    <AppTile name="KeyStone" description="KeyStone" icon="/icon.svg"/>
                    <AppTile name="KeyStone" description="KeyStone" icon="/icon.svg"/>
                    <AppTile name="KeyStone" description="KeyStone" icon="/icon.svg"/> */}
                </div>
                <div className="flex flex-row items-center gap-3">
                    <LayoutGridIcon size={16} color="var(--qu-text)" />
                    <div style={{ fontFamily: "Figtree", fontSize: "16px", color: "var(--qu-text)", fontWeight: "500" }}>KeyStone Apps</div>
                </div>
                <div className="flex flex-row items-center gap-[10px]">
                    {lauth?.data?.user?.userAppAccess?.map((app) => {
                        return <AppTile key={app.id} name={app.app.name} description={app.app.description} icon={app.app.logo} />
                    })}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// export function AppTile({name, description, icon}: {name: string, description: string, icon: string}) {
//     return (
//         <div className="flex flex-col items-center gap-3 justify-center w-[70px] h-[70px]" style={{position: "relative", backgroundColor: "var(--qu-background)"}}>
//             <img src={icon} className="w-[30px] h-[30px]"/>
//             <div style={{fontFamily: "Figtree", fontSize: "12px", color: "var(--qu-text)", fontWeight: "500", position: "absolute", bottom: "0", textAlign: "center", width: "70px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "70px", padding: "1px"}}>{name}</div>
//         </div>
//     );
// }

export function AppTile({ name, description, icon }: { name: string, description: string, icon: string }) {
    return (
        <div className="flex flex-col items-center gap-1 justify-center w-[70px] h-[70px]" style={{ position: "relative", backgroundColor: "var(--qu-background)" }}>
            <img src={icon} className="w-[30px] h-[30px]" />
            <div style={{ fontFamily: "Figtree", fontSize: "12px", color: "var(--qu-text)", fontWeight: "500", width: "70px", whiteSpace: "nowrap", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "70px", padding: "0px" }}>{name}</div>
        </div>
    );
}