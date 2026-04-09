-- CreateTable
CREATE TABLE "DeliveryNoteConsolidation" (
    "id" SERIAL NOT NULL,
    "consolidatedSaleInvoiceId" INTEGER NOT NULL,
    "sourceDeliveryNoteId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryNoteConsolidation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryNoteConsolidation_consolidatedSaleInvoiceId_sourceD_key" ON "DeliveryNoteConsolidation"("consolidatedSaleInvoiceId", "sourceDeliveryNoteId");

-- AddForeignKey
ALTER TABLE "DeliveryNoteConsolidation" ADD CONSTRAINT "DeliveryNoteConsolidation_consolidatedSaleInvoiceId_fkey" FOREIGN KEY ("consolidatedSaleInvoiceId") REFERENCES "SaleInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNoteConsolidation" ADD CONSTRAINT "DeliveryNoteConsolidation_sourceDeliveryNoteId_fkey" FOREIGN KEY ("sourceDeliveryNoteId") REFERENCES "SaleInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
