-- Remove goalId FK and column from Notification
ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_goalId_fkey";
ALTER TABLE "Notification" DROP COLUMN IF EXISTS "goalId";

-- Drop Goal table
DROP TABLE IF EXISTS "Goal";
