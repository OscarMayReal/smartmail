import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from '@prisma/adapter-pg'
import "dotenv/config";

var prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL
    })
});

export async function getMailAccountFolders(accountId: string) {
    return await prisma.folder.findMany({
        where: {
            accountId
        }
    })
}

export async function CreateFolder({ accountId, name, type }: { accountId: string, name: string, type: string }) {
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

export async function getMailAccountMessages(folderId: string) {
    return await prisma.email.findMany({
        where: {
            folderId
        }
    })
}

export function getEmailById(id: string) {
    return prisma.email.findUnique({
        where: {
            id
        }
    })
}

export function moveEmail({ id, folderId }: { id: string, folderId: string }) {
    return prisma.email.update({
        where: {
            id
        },
        data: {
            folderId
        }
    })
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