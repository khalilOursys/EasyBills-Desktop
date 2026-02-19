/*
  Warnings:

  - You are about to drop the column `driverId` on the `Car` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Car" DROP CONSTRAINT "Car_driverId_fkey";

-- AlterTable
ALTER TABLE "Car" DROP COLUMN "driverId";

-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "carId" INTEGER;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE SET NULL ON UPDATE CASCADE;
