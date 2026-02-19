-- AlterEnum
ALTER TYPE "SaleInvoiceType" ADD VALUE 'DELIVERY_NOTE_OUT';

-- AlterTable
ALTER TABLE "SaleInvoice" ADD COLUMN     "driverId" INTEGER,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "SaleInvoice" ADD CONSTRAINT "SaleInvoice_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
