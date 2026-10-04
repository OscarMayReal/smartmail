-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('personal', 'shared');

-- AlterTable
ALTER TABLE "emailaccount" ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "type" "AccountType" NOT NULL DEFAULT 'personal',
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "distributionlist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "address" TEXT NOT NULL,

    CONSTRAINT "distributionlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distributionlistmember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "distributionListId" TEXT NOT NULL,

    CONSTRAINT "distributionlistmember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "distributionlist_id_key" ON "distributionlist"("id");

-- CreateIndex
CREATE UNIQUE INDEX "distributionlistmember_id_key" ON "distributionlistmember"("id");

-- AddForeignKey
ALTER TABLE "distributionlistmember" ADD CONSTRAINT "distributionlistmember_distributionListId_fkey" FOREIGN KEY ("distributionListId") REFERENCES "distributionlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
