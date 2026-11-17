DROP INDEX IF EXISTS "AccountProfile_emailHash_key";
CREATE INDEX IF NOT EXISTS "AccountProfile_emailHash_idx"
  ON "AccountProfile"("emailHash");
