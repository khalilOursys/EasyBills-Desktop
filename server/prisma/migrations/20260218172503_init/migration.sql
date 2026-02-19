-- DropForeignKey
ALTER TABLE "SaleInvoice" DROP CONSTRAINT "SaleInvoice_clientId_fkey";

-- AlterTable
ALTER TABLE "SaleInvoice" ALTER COLUMN "clientId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "SaleInvoice" ADD CONSTRAINT "SaleInvoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
