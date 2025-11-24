-- Add optional fields for english name and taxonomy metadata
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'School' AND column_name = 'nameEnglish'
  ) THEN
    ALTER TABLE "School" ADD COLUMN "nameEnglish" TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'School' AND column_name = 'country'
  ) THEN
    ALTER TABLE "School" ADD COLUMN "country" TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'School' AND column_name = 'location'
  ) THEN
    ALTER TABLE "School" ADD COLUMN "location" TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'School' AND column_name = 'bandType'
  ) THEN
    ALTER TABLE "School" ADD COLUMN "bandType" TEXT;
  END IF;
END $$;

