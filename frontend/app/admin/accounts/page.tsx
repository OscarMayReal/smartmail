"use client";
import { MailAccountTable, AddAccountDrawer } from "@/components/admin/users";
import { useContext, useEffect, useState } from "react";
import { emailaccount } from "../../../../server/generated/prisma/browser";
import { GlobalContext } from "@/app/admin/layout";

const fetchAccounts = async (auth: any): Promise<emailaccount[]> => {
    if (!auth?.data?.sessionId) return [];

    const res = await fetch(`/api/admin/accounts`, {
        headers: {
            Authorization: `Bearer ${auth.data.sessionId}`,
        },
    });
    const data: unknown = await res.json().catch(() => null);

    // The API normally returns an array, but auth/proxy failures return an
    // error object. Never pass that object into the table or drawer.
    return res.ok && Array.isArray(data) ? data as emailaccount[] : [];
}

export default function AdminPage() {
    const { auth } = useContext(GlobalContext);
    const [accounts, setAccounts] = useState<emailaccount[]>([]);
    const [addAccountOpen, setAddAccountOpen] = useState(false);
    useEffect(() => {
        if (!auth?.loaded || !auth?.data) return;
        fetchAccounts(auth).then(setAccounts).catch(() => setAccounts([]));
    }, [auth]);
    return (
        <div className="page-layout">
            <div className="page-header">
                <div>
                    <div className="page-header-title">Accounts</div>
                    <div className="page-header-subtitle">View and manage the email accounts in your tenant</div>
                </div>
                <AddAccountDrawer onReload={() => {
                    fetchAccounts(auth).then(setAccounts).catch(() => setAccounts([]));
                }} accounts={accounts} open={addAccountOpen} setOpen={setAddAccountOpen} />
            </div>
            <MailAccountTable accounts={accounts} onReload={() => {
                fetchAccounts(auth).then(setAccounts).catch(() => setAccounts([]));
            }} />
        </div>
    );
}
