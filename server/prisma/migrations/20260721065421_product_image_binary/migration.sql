-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN     "data" BYTEA,
ADD COLUMN     "mimeType" TEXT,
ALTER COLUMN "url" DROP NOT NULL;
