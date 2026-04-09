-- CreateTable
CREATE TABLE "HeroBanner" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "img" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroBanner_pkey" PRIMARY KEY ("id")
);
