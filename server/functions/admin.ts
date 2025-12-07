import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from '@prisma/adapter-pg'
import "dotenv/config";

var prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL
    })
});

export function ListTenantMailAccounts(tenantId: string) {
    return prisma.emailaccount.findMany({
        where: {
            organizationId: tenantId
        }
    })
}

// export function CreateTenantMailAccount(tenantId: string, userId: string, address: string, domainId: string, color: string) {
//     return prisma.emailaccount.create({
//         data: {
//             userId,
//             organizationId: tenantId,
//             address,
//             domainId,
//             color
//         }
//     })
// }