-- Add postType column to School table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'School' AND column_name = 'postType'
  ) THEN
    ALTER TABLE "School" ADD COLUMN "postType" TEXT;
  END IF;
END $$;
