"use client";
import { AddDomainDrawer, DomainTable } from "@/components/admin/domains";
import { useContext, useEffect, useState } from "react";
import { emailaccount } from "../../../../server/generated/prisma/browser";
import { GlobalContext } from "@/app/admin/layout";
import { Button } from "@/components/ui/button";
import { ArrowUpRightFromSquareIcon } from "lucide-react";
import { Domain } from "keystone-lib";
const fetchAccounts = async (auth: any) => {
    const res = await fetch(`/api/admin/domains`, {
        headers: {
            Authorization: `Bearer ${auth.data.sessionId}`,
        },
    });
    const data = await res.json();
    return data;
}

export default function AdminPage() {
    const { auth } = useContext(GlobalContext);
    const [domains, setDomains] = useState<Domain[]>([]);
    const [addDomainOpen, setAddDomainOpen] = useState(false);
    useEffect(() => {
        if (!auth?.loaded || !auth?.data) return;
        fetchAccounts(auth).then((data) => {
            setDomains(data);
        });
    }, [auth]);
    return (
        <div className="page-layout">
            <div className="page-header">
                <div>
                    <div className="page-header-title">Domains</div>
                    <div className="page-header-subtitle">View and manage the domains in your tenant</div>
                </div>
                <a href="https://keystone.qplus.cloud/admin/domains" target="_blank"><Button variant="outline"><ArrowUpRightFromSquareIcon size={20} />Manage In KeyStone</Button></a>
            </div>
            <DomainTable domains={domains} onReload={() => {
                fetchAccounts(auth).then((data) => {
                    setDomains(data);
                });
            }} />
        </div>
    );
}