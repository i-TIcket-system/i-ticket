-- CreateTable
CREATE TABLE "WorkOrderMessage" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkOrderMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderMessageReadReceipt" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkOrderMessageReadReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkOrderMessage_workOrderId_createdAt_idx" ON "WorkOrderMessage"("workOrderId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkOrderMessage_createdAt_idx" ON "WorkOrderMessage"("createdAt");

-- CreateIndex
CREATE INDEX "WorkOrderMessageReadReceipt_messageId_idx" ON "WorkOrderMessageReadReceipt"("messageId");

-- CreateIndex
CREATE INDEX "WorkOrderMessageReadReceipt_userId_idx" ON "WorkOrderMessageReadReceipt"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderMessageReadReceipt_messageId_userId_key" ON "WorkOrderMessageReadReceipt"("messageId", "userId");

-- AddForeignKey
ALTER TABLE "WorkOrderMessage" ADD CONSTRAINT "WorkOrderMessage_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderMessageReadReceipt" ADD CONSTRAINT "WorkOrderMessageReadReceipt_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "WorkOrderMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
