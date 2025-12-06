"use client";
import { MailAccountTable, AddAccountDrawer } from "@/components/admin/users";
import { useContext, useEffect, useState } from "react";
import { emailaccount } from "../../../../server/generated/prisma/browser";
import { GlobalContext } from "@/app/admin/layout";

export default function AdminPage() {
    const { auth } = useContext(GlobalContext);
    const [accounts, setAccounts] = useState<emailaccount[]>([]);
    const [addAccountOpen, setAddAccountOpen] = useState(false);
    useEffect(() => {
        if (!auth.loaded || !auth.data) return;
        const fetchAccounts = async () => {
            const res = await fetch(`/api/admin/accounts`, {
                headers: {
                    Authorization: `Bearer ${auth.data.sessionId}`,
                },
            });
            const data = await res.json();
            setAccounts(data);
        }
        fetchAccounts();
    }, [auth]);
    return (
        <div className="page-layout">
            <div className="page-header">
                <div>
                    <div className="page-header-title">Accounts</div>
                    <div className="page-header-subtitle">View and manage the email accounts in your tenant</div>
                </div>
                <AddAccountDrawer accounts={accounts} open={addAccountOpen} setOpen={setAddAccountOpen} />
            </div>
            <MailAccountTable accounts={accounts} onReload={() => { }} />
        </div>
    );
}