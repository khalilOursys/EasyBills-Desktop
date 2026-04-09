-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "cityId" INTEGER,
ADD COLUMN     "email" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "cityId" INTEGER,
ADD COLUMN     "email" TEXT;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
