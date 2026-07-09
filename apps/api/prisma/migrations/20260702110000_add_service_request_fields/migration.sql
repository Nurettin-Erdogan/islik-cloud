ALTER TABLE "Job" ADD COLUMN "requestCode" TEXT;
ALTER TABLE "Job" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'technician';
ALTER TABLE "Job" ADD COLUMN "productCategory" TEXT DEFAULT 'other';
ALTER TABLE "Job" ADD COLUMN "productBrand" TEXT;
ALTER TABLE "Job" ADD COLUMN "productModel" TEXT;

CREATE UNIQUE INDEX "Job_requestCode_key" ON "Job"("requestCode");
