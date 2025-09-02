/*
  Warnings:

  - You are about to drop the column `bvn` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `idNumber` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `idType` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_bvn_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "bvn",
DROP COLUMN "idNumber",
DROP COLUMN "idType",
ADD COLUMN     "hasPin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isBvnVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDisabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pin" TEXT;

-- CreateTable
CREATE TABLE "KYC" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "bvn" TEXT,
    "governmentIssuedId" TEXT,
    "utilityBill" TEXT,
    "passport" TEXT,

    CONSTRAINT "KYC_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KYC_bvn_key" ON "KYC"("bvn");

-- AddForeignKey
ALTER TABLE "KYC" ADD CONSTRAINT "KYC_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
