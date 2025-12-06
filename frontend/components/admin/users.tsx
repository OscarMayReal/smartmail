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
import { CheckIcon, PlusIcon, SaveIcon, SearchIcon, TrashIcon, XIcon } from "lucide-react";
import { InputField, PrefixedInput, SelectField, SuffixedInput, SwitchInput } from "@/components/qui/fields";
import { emailaccount } from "../../../server/generated/prisma/browser";
import { useContext } from "react";
import { GlobalContext } from "@/app/admin/layout";
import { ConfirmDialog } from "../qui/confirmDialog";
import { setTimeout } from "timers";

export function MailAccountTable({ accounts, onReload }: { accounts: emailaccount[], onReload: () => void }) {
    const { resources } = useContext(GlobalContext);
    const table = useReactTable({
        data: accounts,
        columns: [
            {
                header: "Address",
                accessorKey: "address",
            },
            {
                header: "Assigned to",
                accessorKey: "userId",
                cell: ({ row }) => {
                    const user = resources?.data?.users?.find((user) => user.id == row.original.userId);
                    return user?.tenant?.name + "/" + user?.username;
                }
            },
            {
                header: "Domain",
                accessorKey: "domainId",
                cell: ({ row }) => {
                    const domain = resources?.data?.domains?.find((domain) => domain.id == row.original.domainId);
                    return domain?.name;
                }
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
                        <TableRowWithDrawer key={row.id} row={row} onReload={onReload} />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

const TableRowWithDrawer = ({ row, onReload }: { row: Row<any>, onReload: () => void }) => {
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
            <MailAccountDrawer open={open} setOpen={setOpen} account={row.original} onReload={onReload} />
        </>
    );
}

function MailAccountDrawer({ open, setOpen, account, onReload }: { open: boolean, setOpen: (open: boolean) => void, account: emailaccount, onReload: () => void }) {
    const { resources, auth } = useContext(GlobalContext);
    const [accountData, setAccountData] = useState<any>(account);
    const [deleteOpen, setDeleteOpen] = useState(false);
    useEffect(() => {
        setAccountData(account);
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
                    <DrawerTitle>{accountData.address}</DrawerTitle>
                    <DrawerDescription>Manage this email account</DrawerDescription>
                </DrawerHeader>
                <Separator />
                <div className="drawer-mainarea">
                    <div className="p-[20px]">
                        <Button variant="destructive" className="w-full" onClick={() => {
                            setDeleteOpen(true);
                        }}><TrashIcon size={20} />Delete Mail Account</Button>
                    </div>
                    <ConfirmDialog isOpen={deleteOpen} variant="destructive" onClose={() => {
                        setDeleteOpen(false);
                    }} title="Delete Email Account" description="Are you sure you want to delete this email account? All data will be deleted and cannot be recovered." onConfirm={() => {
                        fetch(`/api/admin/accounts/${accountData.id}`, {
                            method: "DELETE",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${auth?.data?.sessionId}`,
                            },
                        });
                        setDeleteOpen(false);
                        setTimeout(() => {
                            setOpen(false);
                        }, 200);
                        setTimeout(() => {
                            onReload();
                        }, 400);
                    }} />
                </div>
                <Separator />
                <DrawerFooter style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }}>
                    <DrawerClose asChild><Button variant="outline"><XIcon size={20} />Close</Button></DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}

export function AddAccountDrawer({ open, setOpen, accounts, onReload }: { open: boolean, setOpen: (open: boolean) => void, accounts: emailaccount[], onReload: () => void }) {
    const { resources, auth } = useContext(GlobalContext);
    const [domain, setDomain] = useState("");
    const [assignTo, setAssignTo] = useState("");
    return (
        <Drawer handleOnly direction="right" open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <Button variant="outline"><PlusIcon size={20} />Add Email Account</Button>
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle style={{ color: "var(--qu-text)", fontWeight: "500" }}>Add Email Account</DrawerTitle>
                </DrawerHeader>
                <Separator />
                <div className="drawer-mainarea">
                    {resources?.data?.domains && resources?.data?.domains.length > 0 && <SelectField label="Domain" value={domain} setValue={setDomain} options={resources?.data?.domains?.map((domain) => ({ id: domain.id, name: domain.name, disabled: !domain.verified, description: domain.verified ? null : "Not Set MX Record or Not Verified" }))} />}
                    {domain && <SelectField label="Assign to" value={assignTo} setValue={setAssignTo} options={resources?.data?.users?.map((user) => (user.domainId === domain ? {
                        id: user.id,
                        name: user.name,
                        description: accounts.find((account) => account.userId === user.id) ? "Already Assigned" : user.tenant?.name + "/" + user.username,
                        disabled: accounts.find((account) => account.userId === user.id)
                    } : null))} />}
                    {domain && assignTo && <>
                        <SuffixedInput label="Address" extraText="currently, custom email addresses are not supported" value={resources?.data?.users?.find((user) => user.id === assignTo)?.email.split("@")[0]} disabled={true} suffix={"@" + resources?.data?.domains?.find((rdomain) => rdomain.id === domain)?.name} />
                    </>}
                </div>
                <Separator />
                <DrawerFooter style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }}>
                    <Button variant="outline" onClick={() => setOpen(false)}><XIcon size={20} />Cancel</Button>
                    <Button onClick={async () => {
                        await fetch("/api/admin/accounts", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Accept": "application/json",
                                "Authorization": "Bearer " + auth?.data?.sessionId
                            },
                            body: JSON.stringify({
                                domainId: domain,
                                userId: assignTo,
                                address: resources?.data?.users?.find((user) => user.id === assignTo)?.email.split("@")[0] + "@" + resources?.data?.domains?.find((rdomain) => rdomain.id === domain)?.name,
                                color: "default"
                            })
                        })
                        setOpen(false);
                        onReload();
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