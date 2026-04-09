-- CreateTable
CREATE TABLE "SaleInvoiceCity" (
    "id" SERIAL NOT NULL,
    "saleInvoiceId" INTEGER NOT NULL,
    "cityId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleInvoiceCity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SaleInvoiceCity_saleInvoiceId_cityId_key" ON "SaleInvoiceCity"("saleInvoiceId", "cityId");

-- AddForeignKey
ALTER TABLE "SaleInvoiceCity" ADD CONSTRAINT "SaleInvoiceCity_saleInvoiceId_fkey" FOREIGN KEY ("saleInvoiceId") REFERENCES "SaleInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleInvoiceCity" ADD CONSTRAINT "SaleInvoiceCity_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
