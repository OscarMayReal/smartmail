/*
  Warnings:

  - Added the required column `emailid` to the `email` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "email" ADD COLUMN     "emailid" TEXT NOT NULL;
