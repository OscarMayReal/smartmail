-- CreateTable
CREATE TABLE "emailaccount" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "address" TEXT NOT NULL,
    "domainId" TEXT,
    "color" TEXT NOT NULL DEFAULT 'default',

    CONSTRAINT "emailaccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "organizationId" TEXT,
    "domainId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email" (
    "id" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountId" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "inReplyTo" TEXT,
    "name" TEXT,
    "unseen" BOOLEAN NOT NULL DEFAULT false,
    "email" JSONB NOT NULL,

    CONSTRAINT "email_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "emailaccount_id_key" ON "emailaccount"("id");

-- CreateIndex
CREATE UNIQUE INDEX "emailaccount_address_key" ON "emailaccount"("address");

-- CreateIndex
CREATE UNIQUE INDEX "folder_id_key" ON "folder"("id");

-- CreateIndex
CREATE UNIQUE INDEX "email_id_key" ON "email"("id");

-- AddForeignKey
ALTER TABLE "folder" ADD CONSTRAINT "folder_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "emailaccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email" ADD CONSTRAINT "email_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "emailaccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email" ADD CONSTRAINT "email_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
