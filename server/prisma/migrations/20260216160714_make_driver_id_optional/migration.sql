-- DropForeignKey
ALTER TABLE "Car" DROP CONSTRAINT "Car_driverId_fkey";

-- AlterTable
ALTER TABLE "Car" ALTER COLUMN "driverId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
