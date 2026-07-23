-- CreateEnum
CREATE TYPE "VerificationChannel" AS ENUM ('EMAIL', 'PHONE');

-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "region" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "phoneVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "VerificationChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "VerificationChannel" NOT NULL,
    "destination" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VerificationChallenge_userId_channel_consumedAt_idx" ON "VerificationChallenge"("userId", "channel", "consumedAt");

-- CreateIndex
CREATE INDEX "VerificationChallenge_expiresAt_idx" ON "VerificationChallenge"("expiresAt");

-- AddForeignKey
ALTER TABLE "VerificationChallenge" ADD CONSTRAINT "VerificationChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
