CREATE TABLE "JobStatusEvent" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "actor" TEXT NOT NULL DEFAULT 'system',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobStatusEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "JobStatusEvent_jobId_idx" ON "JobStatusEvent"("jobId");

ALTER TABLE "JobStatusEvent"
ADD CONSTRAINT "JobStatusEvent_jobId_fkey"
FOREIGN KEY ("jobId") REFERENCES "Job"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
