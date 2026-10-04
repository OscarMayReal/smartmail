import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { receiveEmail } from "./mail.ts";

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const normalizeAddress = (address: string) => address.trim().toLowerCase();

const addressDomain = (address: string) => {
    const at = normalizeAddress(address).lastIndexOf("@");
    return at > 0 ? normalizeAddress(address).slice(at + 1) : null;
};

const senderAddress = (email: any) => {
    const from = email?.from;
    if (typeof from === "string") {
        const match = from.match(/<([^>]+)>/);
        return normalizeAddress(match?.[1] || from);
    }
    return normalizeAddress(from?.value?.[0]?.address || from?.address || "");
};

const tenantDomains = async (tenantId: string) => {
    const accounts = await prisma.emailaccount.findMany({
        where: { organizationId: tenantId },
        select: { address: true },
    });
    return new Set(accounts.map((account) => addressDomain(account.address)).filter((domain): domain is string => Boolean(domain)));
};

const assertTenantListAddress = async (address: string, tenantId: string) => {
    const domain = addressDomain(address);
    const domains = await tenantDomains(tenantId);
    if (!domain || !domains.has(domain)) {
        throw new Error("Distribution list address must use a domain managed by your organization");
    }
};

const getTenantList = async (id: string, tenantId: string) => {
    const list = await prisma.distributionlist.findUnique({
        where: { id },
        include: { members: { orderBy: { name: "asc" } } },
    });
    if (!list) throw new Error("Distribution list not found");
    await assertTenantListAddress(list.address, tenantId);
    return list;
};

export async function listDistributionLists(tenantId: string) {
    const domains = await tenantDomains(tenantId);
    const lists = await prisma.distributionlist.findMany({
        include: { members: { orderBy: { name: "asc" } } },
        orderBy: { name: "asc" },
    });
    return lists.filter((list) => {
        const domain = addressDomain(list.address);
        return domain !== null && domains.has(domain);
    });
}

export async function createDistributionList({
    tenantId,
    name,
    address,
    notes,
}: {
    tenantId: string;
    name: string;
    address: string;
    notes?: string | null;
}) {
    const normalizedName = name.trim();
    const normalizedAddress = normalizeAddress(address);
    if (!normalizedName || !normalizedAddress || !addressDomain(normalizedAddress)) {
        throw new Error("name and a valid address are required");
    }
    await assertTenantListAddress(normalizedAddress, tenantId);

    const existingAccount = await prisma.emailaccount.findUnique({ where: { address: normalizedAddress } });
    if (existingAccount) throw new Error("An email account already uses this address");
    const existingList = await prisma.distributionlist.findFirst({ where: { address: normalizedAddress } });
    if (existingList) throw new Error("A distribution list already uses this address");

    return prisma.distributionlist.create({
        data: { name: normalizedName, address: normalizedAddress, notes: notes?.trim() || null },
        include: { members: true },
    });
}

export async function updateDistributionList({
    tenantId,
    id,
    name,
    address,
    notes,
}: {
    tenantId: string;
    id: string;
    name?: string;
    address?: string;
    notes?: string | null;
}) {
    const current = await getTenantList(id, tenantId);
    const nextAddress = normalizeAddress(address ?? current.address);
    if (address !== undefined) await assertTenantListAddress(nextAddress, tenantId);
    if (address !== undefined) {
        const existingAccount = await prisma.emailaccount.findUnique({ where: { address: nextAddress } });
        if (existingAccount) throw new Error("An email account already uses this address");
        const existingList = await prisma.distributionlist.findFirst({ where: { address: nextAddress, NOT: { id: current.id } } });
        if (existingList) throw new Error("A distribution list already uses this address");
    }
    return prisma.distributionlist.update({
        where: { id: current.id },
        data: {
            ...(name !== undefined ? { name: name.trim() } : {}),
            ...(address !== undefined ? { address: nextAddress } : {}),
            ...(notes !== undefined ? { notes: notes?.trim() || null } : {}),
        },
        include: { members: { orderBy: { name: "asc" } } },
    });
}

export async function deleteDistributionList(id: string, tenantId: string) {
    const list = await getTenantList(id, tenantId);
    await prisma.distributionlist.delete({ where: { id: list.id } });
    return { success: true };
}

export async function addDistributionListMember({
    tenantId,
    distributionListId,
    name,
    email,
}: {
    tenantId: string;
    distributionListId: string;
    name: string;
    email: string;
}) {
    const list = await getTenantList(distributionListId, tenantId);
    const normalizedEmail = normalizeAddress(email);
    if (!normalizedEmail || !addressDomain(normalizedEmail)) throw new Error("A valid member email is required");
    const existingMember = await prisma.distributionlistmember.findFirst({ where: { distributionListId: list.id, email: normalizedEmail } });
    if (existingMember) throw new Error("This address is already a member of the distribution list");
    return prisma.distributionlistmember.create({
        data: {
            distributionListId: list.id,
            name: name.trim() || normalizedEmail,
            email: normalizedEmail,
        },
    });
}

export async function removeDistributionListMember({
    tenantId,
    distributionListId,
    memberId,
}: {
    tenantId: string;
    distributionListId: string;
    memberId: string;
}) {
    const list = await getTenantList(distributionListId, tenantId);
    const result = await prisma.distributionlistmember.deleteMany({ where: { id: memberId, distributionListId: list.id } });
    if (result.count === 0) throw new Error("Distribution list member not found");
    return { success: true };
}

/**
 * Accepts a message for a distribution list only when the sender's domain is
 * one of the organization's managed mail domains. Local SmartMail members
 * receive a copy in their inbox; external members are left for the mail
 * service to handle rather than silently spoofing a sender here.
 */
export async function receiveDistributionList(address: string, email: any) {
    const normalizedAddress = normalizeAddress(address);
    const list = await prisma.distributionlist.findFirst({
        where: { address: normalizedAddress },
        include: { members: true },
    });
    if (!list) return { found: false, accepted: false, delivered: 0 };

    const listDomain = addressDomain(list.address);
    const tenantAccounts = listDomain
        ? await prisma.emailaccount.findMany({
            where: { address: { endsWith: `@${listDomain}` } },
            select: { organizationId: true },
        })
        : [];
    const organizationIds = [...new Set(tenantAccounts.map((account) => account.organizationId).filter((id): id is string => Boolean(id)))];
    const domains = new Set<string>();
    for (const organizationId of organizationIds) {
        for (const domain of await tenantDomains(organizationId)) domains.add(domain);
    }
    const sender = senderAddress(email);
    if (!sender || !addressDomain(sender) || !domains.has(addressDomain(sender)!)) {
        return { found: true, accepted: false, delivered: 0, reason: "Distribution lists only accept mail from internal addresses" };
    }

    const memberAddresses = list.members.map((member) => normalizeAddress(member.email));
    const memberAccounts = await prisma.emailaccount.findMany({ where: { address: { in: memberAddresses } }, select: { id: true, address: true } });
    await Promise.all(memberAccounts.map((account) => receiveEmail({ accountId: account.id, email })));
    return { found: true, accepted: true, delivered: memberAccounts.length };
}
