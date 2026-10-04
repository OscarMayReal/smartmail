import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from '@prisma/adapter-pg'
import "dotenv/config";
import { verifyAccountAccess } from "./authorization.ts";

var prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL
    })
});

export async function getMailAccountById(id: string) {
    return await prisma.emailaccount.findUnique({
        where: {
            id
        }
    })
}

export async function createMailAccount({
    userId,
    address,
    domainId,
    color,
    organizationId
}: {
    userId: string;
    address: string;
    domainId: string;
    color: string;
    organizationId: string;
}) {
    var mailaccount = await prisma.emailaccount.create({
        data: {
            userId,
            address,
            domainId,
            color,
            organizationId
        }
    })
    await Promise.all([
        prisma.folder.create({
            data: {
                account: {
                    connect: {
                        id: mailaccount.id
                    }
                },
                name: "Inbox",
                type: "smartmail.folder.inbox"
            }
        }),
        prisma.folder.create({
            data: {
                account: {
                    connect: {
                        id: mailaccount.id
                    }
                },
                name: "Sent",
                type: "smartmail.folder.sent"
            }
        }),
        prisma.folder.create({
            data: {
                account: {
                    connect: {
                        id: mailaccount.id
                    }
                },
                name: "Drafts",
                type: "smartmail.folder.drafts"
            }
        }),
        prisma.folder.create({
            data: {
                account: {
                    connect: {
                        id: mailaccount.id
                    }
                },
                name: "Trash",
                type: "smartmail.folder.trash"
            }
        }),
        prisma.folder.create({
            data: {
                account: {
                    connect: {
                        id: mailaccount.id
                    }
                },
                name: "Archive",
                type: "smartmail.folder.archive"
            }
        }),
        prisma.calendar.create({
            data: {
                account: {
                    connect: {
                        id: mailaccount.id
                    }
                },
                name: "Calendar"
            }
        })
    ])
    return mailaccount;
}

export async function createSharedMailAccount({
    address,
    domainId,
    groupId,
    color,
    organizationId,
}: {
    address: string;
    domainId: string;
    groupId: string;
    color: string;
    organizationId: string;
}) {
    if (!groupId.trim()) {
        throw new Error("groupId is required for a shared mailbox");
    }

    const mailaccount = await prisma.emailaccount.create({
        data: {
            userId: null,
            address: address.trim().toLowerCase(),
            domainId,
            color,
            organizationId,
            type: "shared",
            groupId,
        },
    });

    await createDefaultMailAccountData(mailaccount.id);
    return mailaccount;
}

async function createDefaultMailAccountData(accountId: string) {
    await Promise.all([
        prisma.folder.createMany({
            data: [
                { accountId, name: "Inbox", type: "smartmail.folder.inbox" },
                { accountId, name: "Sent", type: "smartmail.folder.sent" },
                { accountId, name: "Drafts", type: "smartmail.folder.drafts" },
                { accountId, name: "Trash", type: "smartmail.folder.trash" },
                { accountId, name: "Archive", type: "smartmail.folder.archive" },
            ],
        }),
        prisma.calendar.create({ data: { accountId, name: "Calendar" } }),
    ]);
}

export async function getAccountsByUserId(userId: string, organizationId?: string, groupIds: string[] = []) {
    const accounts = await prisma.emailaccount.findMany({
        where: {
            ...(organizationId ? { organizationId } : {}),
            OR: [
                { userId },
                ...(groupIds.length > 0 ? [{ type: "shared" as const, groupId: { in: groupIds } }] : []),
            ],
        }
    });
    return accounts.sort((a, b) => {
        if (a.type !== b.type) return a.type === "personal" ? -1 : 1;
        return a.address.localeCompare(b.address);
    });
}

export async function getTenantMailAccounts(organizationId: string) {
    return prisma.emailaccount.findMany({
        where: { organizationId },
        orderBy: { address: "asc" },
    });
}

export async function updateSharedMailAccount({
    id,
    organizationId,
    address,
    domainId,
    groupId,
    color,
}: {
    id: string;
    organizationId: string;
    address?: string;
    domainId?: string;
    groupId?: string;
    color?: string;
}) {
    const account = await prisma.emailaccount.findFirst({ where: { id, organizationId, type: "shared" } });
    if (!account) throw new Error("Shared mailbox not found");
    if (groupId !== undefined && !groupId.trim()) throw new Error("groupId is required for a shared mailbox");

    return prisma.emailaccount.update({
        where: { id: account.id },
        data: {
            ...(address !== undefined ? { address: address.trim().toLowerCase() } : {}),
            ...(domainId !== undefined ? { domainId } : {}),
            ...(groupId !== undefined ? { groupId: groupId.trim() } : {}),
            ...(color !== undefined ? { color } : {}),
        },
    });
}

export async function deleteTenantMailAccount(id: string, organizationId: string) {
    const account = await prisma.emailaccount.findFirst({ where: { id, organizationId } });
    if (!account) throw new Error("Mail account not found");
    await prisma.emailaccount.delete({ where: { id: account.id } });
    return { success: true };
}

export async function getMailAccountForUser({ accountId, userId, organizationId, groupIds = [] }: {
    accountId: string;
    userId: string;
    organizationId?: string;
    groupIds?: string[];
}) {
    return prisma.emailaccount.findFirst({
        where: {
            id: accountId,
            ...(organizationId ? { organizationId } : {}),
            OR: [
                { userId },
                ...(groupIds.length > 0 ? [{ type: "shared" as const, groupId: { in: groupIds } }] : []),
            ],
        },
    });
}

export async function getAccountByAddress(address: string) {
    return await prisma.emailaccount.findUnique({
        where: {
            address
        }
    })
}

export async function deleteMailAccount(id: string, userId: string) {
    // Verify user owns the account
    const hasAccess = await verifyAccountAccess(id, userId);
    if (!hasAccess) {
        throw new Error("Unauthorized: You do not have access to this account");
    }

    await prisma.emailaccount.delete({
        where: {
            id
        }
    })
}
