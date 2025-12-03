"use client"
// import { AddUserToApp, CreateApp, getUserByUsername, removeUserFromApp, updateApp, useAdminAppsList, useTenantsList, useUsersList } from "@/lib/admin";
import { useReactTable, getCoreRowModel, ColumnDef, flexRender, Row } from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useEffect, useState } from "react";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CheckIcon, PlusIcon, SaveIcon, SearchIcon, XIcon } from "lucide-react";
import { InputField, PrefixedInput, SwitchInput } from "@/components/qui/fields";
import { emailaccount } from "../../../server/generated/prisma/browser";

export function MailAccountTable({ accounts, onReload }: { accounts: emailaccount[], onReload: () => void }) {
    const table = useReactTable({
        data: accounts,
        columns: [
            {
                header: "Address",
                accessorKey: "address",
            },
            {
                header: "assigned to",
                accessorKey: "userId",
            },
            {
                header: "Domain",
                accessorKey: "domainId",
            },
        ],
        getCoreRowModel: getCoreRowModel(),
    });
    return (
        <div className="overflow-hidden rounded-md border bg-card text-card-foreground shadow-sm w-full">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.map((row) => (
                        <TableRowWithDrawer key={row.id} row={row} />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

const TableRowWithDrawer = ({ row }: { row: Row<any> }) => {
    const [open, setOpen] = useState(false);
    return (
        <>
            <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} onClick={() => setOpen(true)}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                ))}
            </TableRow>
            <MailAccountDrawer open={open} setOpen={setOpen} app={row.original} />
        </>
    );
}

function MailAccountDrawer({ open, setOpen, app }: { open: boolean, setOpen: (open: boolean) => void, app: any }) {
    const [userAppAccess, setUserAppAccess] = useState<any>(app.userAppAccess);
    useEffect(() => {
        setUserAppAccess(app.userAppAccess);
    }, [open]);
    return (
        <Drawer handleOnly direction="right" open={open} onOpenChange={setOpen} onClose={() => {
            // if (userAppAccess.length > app.userAppAccess.length || userAppAccess.length < app.userAppAccess.length) {
            //     setTimeout(() => {
            //         onReload();
            //     }, 1000);
            // }
        }}>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>{app.name}</DrawerTitle>
                    <DrawerDescription>Manage this app</DrawerDescription>
                </DrawerHeader>
                <Separator />
                <div className="drawer-mainarea">

                </div>
                <Separator />
                <DrawerFooter style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }}>
                    <DrawerClose><Button><XIcon size={20} />Close</Button></DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}

export function AddAppDrawer({ open, setOpen, appsListHook }: { open: boolean, setOpen: (open: boolean) => void, appsListHook: any }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [logo, setLogo] = useState("");
    const [mainUrl, setMainUrl] = useState("");
    return (
        <Drawer handleOnly direction="right" open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <Button variant="outline"><PlusIcon size={20} />Add App</Button>
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle style={{ color: "var(--qu-text)", fontWeight: "500" }}>Add App</DrawerTitle>
                </DrawerHeader>
                <Separator />
                <div className="drawer-mainarea">
                    <InputField label="Logo URL" value={logo} setValue={setLogo} />
                    <InputField label="Name" value={name} setValue={setName} />
                    <InputField label="Description" value={description} setValue={setDescription} />
                    <InputField label="Main URL" value={mainUrl} setValue={setMainUrl} />
                </div>
                <Separator />
                <DrawerFooter style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }}>
                    <Button variant="outline" onClick={() => setOpen(false)}><XIcon size={20} />Cancel</Button>
                    <Button onClick={async () => {
                        await CreateApp({ name, description, logo, mainUrl });
                        setOpen(false);
                        appsListHook.reload();
                    }}><CheckIcon size={20} />Add</Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}

export function UserSearchInput({ onUserSelect }: { onUserSelect: (user: any) => any }) {
    const session = useSession();
    const [value, setValue] = useState("");
    const [user, setUser] = useState<any>(null);
    return (
        <div style={{ padding: "20px 20px 0px 20px" }}>
            <div style={{ fontSize: "14px", fontWeight: "500", marginBottom: "10px" }}>Find User</div>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px" }}>
                <div className="flex items-center border border-input rounded-md shadow-xs bg-background focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] transition-[color,box-shadow] px-3 h-9 text-base w-full">
                    <span style={{ color: "var(--qu-text-secondary)" }} className="select-none text-[14px]">{session?.data?.user?.tenant.name + "/"}</span>
                    <input type="text" value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            getUserByUsername(value).then((data) => {
                                if (data?.error) {
                                    console.log(data.error);
                                    setUser(null);
                                } else {
                                    setUser(data);
                                }
                            });
                        }
                    }} className="outline-none text-[14px] w-full" />
                </div>
                <Button variant="outline" onClick={() => {
                    getUserByUsername(value).then((data) => {
                        if (data?.error) {
                            console.log(data.error);
                            setUser(null);
                        } else {
                            setUser(data);
                        }
                    });
                }}><SearchIcon size={20} />Search</Button>
            </div>
            {user?.id && <div className="border border-input rounded-md shadow-xs bg-background p-2 mt-[10px] hover:bg-input/50 cursor-pointer transition-all">
                <UserItem user={user} onClick={() => {
                    onUserSelect(user);
                    setUser(null);
                    setValue("");
                }} />
            </div>}
        </div>
    );
}