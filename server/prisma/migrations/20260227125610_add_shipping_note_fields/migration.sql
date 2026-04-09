-- AlterTable
ALTER TABLE "SaleInvoice" ADD COLUMN     "shippingNoteId" INTEGER;

-- AlterTable
ALTER TABLE "SaleInvoiceItem" ADD COLUMN     "shippingNoteItemId" INTEGER;

-- AddForeignKey
ALTER TABLE "SaleInvoice" ADD CONSTRAINT "SaleInvoice_shippingNoteId_fkey" FOREIGN KEY ("shippingNoteId") REFERENCES "SaleInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleInvoiceItem" ADD CONSTRAINT "SaleInvoiceItem_shippingNoteItemId_fkey" FOREIGN KEY ("shippingNoteItemId") REFERENCES "SaleInvoiceItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
