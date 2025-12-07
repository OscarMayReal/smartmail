/*
  Warnings:

  - You are about to drop the column `accountId` on the `event` table. All the data in the column will be lost.
  - You are about to drop the column `domainId` on the `folder` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `folder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "event" DROP COLUMN "accountId",
ALTER COLUMN "allDay" SET DEFAULT false;

-- AlterTable
ALTER TABLE "folder" DROP COLUMN "domainId",
DROP COLUMN "organizationId";
