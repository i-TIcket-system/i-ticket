-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "User_mustChangePassword_idx" ON "User"("mustChangePassword");
