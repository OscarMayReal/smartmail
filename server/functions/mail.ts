import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from '@prisma/adapter-pg'
import "dotenv/config";
import { verifyAccountAccess, verifyEmailAccess, verifyFolderAccess } from "./authorization.ts";

var prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL
    })
});

export async function getMailAccountFolders(accountId: string, userId: string) {
    // Note: We still accept userId for consistency, but the account should already 
    // belong to the user since it's fetched via getAccountsByUserId in the API route
    return await prisma.folder.findMany({
        where: {
            accountId
        }
    })
}

export async function CreateFolder({ accountId, name, type, userId }: { accountId: string, name: string, type: string, userId: string }) {
    // Account already verified as owned by user in API route via getAccountsByUserId
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

export async function getMailAccountMessages(folderId: string, userId: string) {
    // Instead of verifying then querying, we query with ownership constraints built in
    // This returns messages only if the folder belongs to one of the user's accounts
    const messages = await prisma.email.findMany({
        where: {
            folderId,
            folder: {
                account: {
                    userId: userId
                }
            }
        }
    });

    return messages;
}

export async function getEmailById(id: string, userId: string) {
    // Query with ownership constraint - only returns email if user owns the account
    return await prisma.email.findFirst({
        where: {
            id,
            account: {
                userId: userId
            }
        }
    })
}

export async function moveEmail({ id, folderId, userId }: { id: string, folderId: string, userId: string }) {
    // Update only if user owns both the email and the target folder
    // First verify the target folder belongs to user's account
    const targetFolder = await prisma.folder.findFirst({
        where: {
            id: folderId,
            account: {
                userId: userId
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
            account: {
                userId: userId
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

export async function sendEmail({ accountId, email, user, userId }: { accountId: string, email: any, user: any, userId: string }) {
    console.log(email);

    // Query account with ownership constraint
    var account = await prisma.emailaccount.findFirst({
        where: {
            id: accountId,
            userId: userId
        }
    });

    if (!account) {
        throw new Error("Unauthorized: You do not have access to this account");
    }
    email.from = '"' + user.name + '" <' + account.address + '>';
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
        data.results.forEach(async (result: any) => {
            var emailobject = await prisma.email.create({
                data: {
                    accountId: accountId,
                    emailid: result.result.result.messageId,
                    from: account.address,
                    name: user.name,
                    to: result.result.result.to.value[0].address,
                    subject: result.result.result.subject,
                    email: result.result.result,
                    date: new Date(result.result.result.date),
                    folderId: mailbox.id,
                    inReplyTo: null,
                    unseen: false
                }
            })
        })
        return data;
    });
}