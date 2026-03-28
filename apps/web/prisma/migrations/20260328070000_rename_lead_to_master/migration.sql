-- Rename "lead" developer tag to "master"
UPDATE "User" SET "developerTag" = 'master' WHERE "developerTag" = 'lead';
