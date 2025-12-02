import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from '@prisma/adapter-pg'
import "dotenv/config";

var prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL
    })
});

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
        })
    ])
    return mailaccount;
}

export async function getAccountsByUserId(userId: string) {
    return await prisma.emailaccount.findMany({
        where: {
            userId
        }
    })
}

export async function getAccountByAddress(address: string) {
    return await prisma.emailaccount.findUnique({
        where: {
            address
        }
    })
}