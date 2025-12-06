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
import { Fragment, useEffect, useState } from "react";
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
import { ResourceUser } from "keystone-lib";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CheckIcon, PlusIcon, SaveIcon, SearchIcon, TrashIcon, UserIcon, XIcon } from "lucide-react";
import { CopyValueRow, InputField, PrefixedInput, SelectField, SuffixedInput, SwitchInput } from "@/components/qui/fields";
import { emailaccount } from "../../../server/generated/prisma/browser";
import { useContext } from "react";
import { GlobalContext } from "@/app/admin/layout";
import { ConfirmDialog } from "../qui/confirmDialog";
import { setTimeout } from "timers";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemSeparator, ItemTitle } from "../ui/item";
import { Avatar } from "@radix-ui/react-avatar";
import { Checkbox } from "../ui/checkbox";
import { UserItem } from "../qui/header";

export function DomainTable({ domains, onReload }: { domains: domain[], onReload: () => void }) {
    const { resources } = useContext(GlobalContext);
    const table = useReactTable({
        data: resources?.data?.domains || [],
        columns: [
            {
                header: "name",
                accessorKey: "name",
            },
            {
                header: "Verified",
                accessorKey: "verified",
                cell: ({ row }) => {
                    return row.original.verified ? <CheckIcon size={20} /> : <XIcon size={20} />;
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
            <DomainDrawer open={open} setOpen={setOpen} domain={row.original} onReload={onReload} />
        </>
    );
}

function DomainDrawer({ open, setOpen, domain, onReload }: { open: boolean, setOpen: (open: boolean) => void, domain: domain, onReload: () => void }) {
    const { resources, auth } = useContext(GlobalContext);
    const [domainData, setDomainData] = useState<any>(domain);
    const [deleteOpen, setDeleteOpen] = useState(false);
    useEffect(() => {
        setDomainData(domain);
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
                    <DrawerTitle>{domainData.name}</DrawerTitle>
                    <DrawerDescription>Manage this domain</DrawerDescription>
                </DrawerHeader>
                <Separator />
                <div className="drawer-mainarea">
                    <div className="drawer-section-container">
                        <div className="drawer-section-title">MX Record</div>
                        <div className="drawer-section-subtitle">Set up the MX record</div>
                    </div>
                    <CopyValueRow value={`MX 10 osmail.quntem.co.uk`} title="MX Record" />
                    <Separator className="mt-[20px]" />
                    <div className="drawer-section-container">
                        <div className="drawer-section-title">SPF Record</div>
                        <div className="drawer-section-subtitle">Set up the SPF record</div>
                    </div>
                    <CopyValueRow value={`"v=spf1 ip4:51.68.199.48 ?all"`} title="SPF Record" />
                </div>
                <Separator />
                <DrawerFooter style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }}>
                    <DrawerClose asChild><Button variant="outline"><XIcon size={20} />Close</Button></DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}