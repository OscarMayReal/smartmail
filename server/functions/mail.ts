import { Prisma, PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from '@prisma/adapter-pg'
import "dotenv/config";
import { verifyAccountAccess, verifyEmailAccess, verifyFolderAccess } from "./authorization.ts";
import { getAccountsByUserId, getMailAccountForUser } from "./mailaccounts.ts";

var prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL
    })
});

type MailAccess = { organizationId?: string; groupIds?: string[] };

const accountAccess = (userId: string, access: MailAccess = {}) => ({
    ...(access.organizationId ? { organizationId: access.organizationId } : {}),
    OR: [{ userId }, ...(access.groupIds?.length ? [{ type: "shared" as const, groupId: { in: access.groupIds } }] : [])],
});

export async function getMailAccountFolders(accountId: string, userId: string, access: MailAccess = {}) {
    // Note: We still accept userId for consistency, but the account should already 
    // belong to the user since it's fetched via getAccountsByUserId in the API route
    return await prisma.folder.findMany({
        where: {
            accountId,
            account: accountAccess(userId, access),
        }
    })
}

export async function CreateFolder({ accountId, name, type, userId, organizationId, groupIds }: { accountId: string, name: string, type: string, userId: string, organizationId?: string, groupIds?: string[] }) {
    // Account already verified as owned by user in API route via getAccountsByUserId
    const account = await getMailAccountForUser({ accountId, userId, organizationId, groupIds });
    if (!account) {
        throw new Error("Unauthorized: You do not have access to this account");
    }
    return await prisma.folder.create({
        data: {
            account: {
                connect: {
                    id: accountId
                }
            },
            name,
            type
        }
    })
}

export async function getMailAccountMessages(folderId: string, userId: string, access: MailAccess = {}, accountId?: string) {
    // Instead of verifying then querying, we query with ownership constraints built in
    // This returns messages only if the folder belongs to one of the user's accounts
    const messages = await prisma.email.findMany({
        where: {
            folderId,
            folder: {
                ...(accountId ? { accountId } : {}),
                account: {
                    ...accountAccess(userId, access),
                }
            }
        }
    });

    return messages;
}

export async function searchMailMessages({ query, accountId, folderId, userId, organizationId, groupIds }: {
    query: string;
    accountId?: string;
    folderId?: string;
    userId: string;
    organizationId?: string;
    groupIds?: string[];
}) {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return [];

    const accounts = accountId
        ? await getMailAccountForUser({ accountId, userId, organizationId, groupIds }).then((account) => account ? [account] : [])
        : await getAccountsByUserId(userId, organizationId, groupIds);
    if (accounts.length === 0) return [];

    const pattern = `%${normalizedQuery}%`;
    const folderClause = folderId
        ? Prisma.sql`AND e."folderId" = ${folderId}`
        : Prisma.empty;
    const accountIdsClause = Prisma.join(accounts.map((account) => account.id));

    return prisma.$queryRaw(Prisma.sql`
        SELECT e.*
        FROM "email" e
        WHERE e."accountId" IN (${accountIdsClause})
          ${folderClause}
          AND (
            e."subject" ILIKE ${pattern}
            OR e."from" ILIKE ${pattern}
            OR e."to" ILIKE ${pattern}
            OR COALESCE(e."name", '') ILIKE ${pattern}
            OR e."emailid" ILIKE ${pattern}
            OR CAST(e."email" AS TEXT) ILIKE ${pattern}
          )
        ORDER BY e."date" DESC
        LIMIT 100
    `);
}

export async function getEmailById(id: string, userId: string, access: MailAccess = {}, accountId?: string) {
    // Query with ownership constraint - only returns email if user owns the account
    return await prisma.email.findFirst({
        where: {
            id,
            ...(accountId ? { accountId } : {}),
            account: {
                ...accountAccess(userId, access),
            }
        }
    })
}

export async function moveEmail({ id, folderId, accountId, userId, organizationId, groupIds }: { id: string, folderId: string, accountId?: string, userId: string, organizationId?: string, groupIds?: string[] }) {
    // Update only if user owns both the email and the target folder
    // First verify the target folder belongs to user's account
    const targetFolder = await prisma.folder.findFirst({
        where: {
            id: folderId,
            ...(accountId ? { accountId } : {}),
            account: {
                ...accountAccess(userId, { organizationId, groupIds }),
            }
        }
    });

    if (!targetFolder) {
        throw new Error("Unauthorized: You do not have access to the target folder");
    }

    // Update with constraint that email belongs to user's account
    const result = await prisma.email.updateMany({
        where: {
            id,
            ...(accountId ? { accountId } : {}),
            account: {
                ...accountAccess(userId, { organizationId, groupIds }),
            }
        },
        data: {
            folderId
        }
    });

    if (result.count === 0) {
        throw new Error("Unauthorized: You do not have access to this email");
    }

    // Return the updated email
    return await prisma.email.findUnique({
        where: { id }
    });
}

export async function setEmailReadState({ id, accountId, userId, unseen, organizationId, groupIds }: {
    id: string;
    accountId?: string;
    userId: string;
    unseen: boolean;
    organizationId?: string;
    groupIds?: string[];
}) {
    const result = await prisma.email.updateMany({
        where: {
            id,
            ...(accountId ? { accountId } : {}),
            account: accountAccess(userId, { organizationId, groupIds }),
        },
        data: { unseen },
    });

    if (result.count === 0) {
        throw new Error("Unauthorized: You do not have access to this email");
    }

    return prisma.email.findUnique({ where: { id } });
}

export async function permanentlyDeleteEmail({ id, accountId, userId, organizationId, groupIds }: {
    id: string;
    accountId?: string;
    userId: string;
    organizationId?: string;
    groupIds?: string[];
}) {
    const result = await prisma.email.deleteMany({
        where: {
            id,
            ...(accountId ? { accountId } : {}),
            account: accountAccess(userId, { organizationId, groupIds }),
        },
    });

    if (result.count === 0) {
        throw new Error("Unauthorized: You do not have access to this email");
    }

    return { success: true };
}

export async function receiveEmail({ accountId, email }: { accountId: string, email: any }) {
    var account = await prisma.emailaccount.findUnique({
        where: {
            id: accountId
        }
    })
    if (!account) {
        //console.log("Account not found");
        return;
    }
    var folder = await prisma.folder.findFirst({
        where: {
            accountId: accountId,
            type: "smartmail.folder.inbox"
        }
    })
    if (!folder) {
        //console.log("Mailbox not found");
        return;
    }
    var emailobject = await prisma.email.create({
        data: {
            accountId: accountId,
            from: email.from.value[0].address,
            name: email.from.value[0].name,
            to: email.to.value[0].address,
            subject: email.subject,
            email: email,
            date: new Date(email.date),
            folderId: folder.id,
            inReplyTo: email.inReplyTo,
            unseen: true,
            emailid: email.messageId
        }
    })
}

export async function sendEmail({ accountId, email, user, userId, organizationId, groupIds }: { accountId: string, email: any, user: any, userId: string, organizationId?: string, groupIds?: string[] }) {
    console.log(email);

    // Query account with ownership constraint
    var account = await getMailAccountForUser({ accountId, userId, organizationId, groupIds });

    if (!account) {
        throw new Error("Unauthorized: You do not have access to this account");
    }
    const verifiedAccount = account;
    email.from = '"' + (verifiedAccount.type === "shared" ? verifiedAccount.address : user.name) + '" <' + verifiedAccount.address + '>';
    fetch(process.env.MAILSERVER_URL + "/api/mail/send", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "accept": "application/json",
            "Authorization": "Bearer " + process.env.EMAIL_RECIEVE_SECRET
        },
        body: JSON.stringify(email)
    }).then((res) => res.json()).then(async (data) => {
        var mailbox = await prisma.folder.findFirst({
            where: {
                accountId: accountId,
                type: "smartmail.folder.sent"
            }
        })
        if (!mailbox) {
            //console.log("Mailbox not found");
            return;
        }
        const sentMailbox = mailbox;
        data.results.forEach(async (result: any) => {
            var emailobject = await prisma.email.create({
                data: {
                    accountId: accountId,
                    emailid: result.result.result.messageId,
                    from: verifiedAccount.address,
                    name: verifiedAccount.type === "shared" ? verifiedAccount.address : user.name,
                    to: result.result.result.to.value[0].address,
                    subject: result.result.result.subject,
                    email: result.result.result,
                    date: new Date(result.result.result.date),
                    folderId: sentMailbox.id,
                    inReplyTo: null,
                    unseen: false
                }
            })
        })
        return data;
    });
}
