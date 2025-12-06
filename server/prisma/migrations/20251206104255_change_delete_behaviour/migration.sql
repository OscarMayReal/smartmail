-- DropForeignKey
ALTER TABLE "email" DROP CONSTRAINT "email_accountId_fkey";

-- DropForeignKey
ALTER TABLE "email" DROP CONSTRAINT "email_folderId_fkey";

-- DropForeignKey
ALTER TABLE "folder" DROP CONSTRAINT "folder_accountId_fkey";

-- CreateTable
CREATE TABLE "contact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "info" JSONB NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "contact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contact_id_key" ON "contact"("id");

-- AddForeignKey
ALTER TABLE "folder" ADD CONSTRAINT "folder_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "emailaccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email" ADD CONSTRAINT "email_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "emailaccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email" ADD CONSTRAINT "email_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact" ADD CONSTRAINT "contact_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "emailaccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
