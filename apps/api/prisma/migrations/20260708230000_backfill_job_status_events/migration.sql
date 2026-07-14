INSERT INTO "JobStatusEvent" ("id", "jobId", "status", "actor", "note", "createdAt")
SELECT
    'backfill_' || job."id",
    job."id",
    job."status",
    CASE WHEN job."source" = 'customer' THEN 'customer' ELSE 'technician' END,
    'Mevcut talep geçmişe aktarıldı.',
    job."createdAt"
FROM "Job" AS job
WHERE NOT EXISTS (
    SELECT 1
    FROM "JobStatusEvent" AS event
    WHERE event."jobId" = job."id"
);
