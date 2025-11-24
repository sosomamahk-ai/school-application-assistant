-- Database Backfill Script: Fix null category in SchoolFormTemplate
-- 
-- This SQL script backfills the category field for templates that have null category.
-- It extracts category from schoolId format (for new standardized format: {name_short}-{category_abbr}-{year})
-- 
-- Category abbreviations:
--   is -> 国际学校
--   ls -> 本地中学
--   lp -> 本地小学
--   kg -> 幼稚园
--   un -> 大学
--
-- Usage:
--   1. Connect to your PostgreSQL database
--   2. Run this script: psql -d your_database -f prisma/migrations/backfill_template_category.sql
--   3. Or execute in your database client (pgAdmin, DBeaver, etc.)
--
-- Note: This script only handles templates with schoolId in the new format.
-- Templates that don't match the format will be set to '国际学校' (default).
-- For more accurate backfilling, use the TypeScript script: npm run backfill:template-category

BEGIN;

-- Create a temporary function to extract category from schoolId
CREATE OR REPLACE FUNCTION extract_category_from_school_id(school_id TEXT)
RETURNS TEXT AS $$
DECLARE
  abbr TEXT;
BEGIN
  -- Match pattern: {name_short}-{category_abbr}-{year}
  -- Extract the category abbreviation (2 letters before the last 4 digits)
  abbr := (regexp_match(school_id, '-([a-z]{2})-\d{4}$'))[1];
  
  IF abbr IS NULL THEN
    RETURN '国际学校'; -- Default fallback
  END IF;
  
  CASE abbr
    WHEN 'is' THEN RETURN '国际学校';
    WHEN 'ls' THEN RETURN '本地中学';
    WHEN 'lp' THEN RETURN '本地小学';
    WHEN 'kg' THEN RETURN '幼稚园';
    WHEN 'un' THEN RETURN '大学';
    ELSE RETURN '国际学校'; -- Default fallback for unknown abbreviations
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Update templates with null category
-- Only update templates that currently have NULL category
UPDATE "SchoolFormTemplate"
SET 
  category = extract_category_from_school_id("schoolId"),
  "updatedAt" = NOW()
WHERE 
  category IS NULL;

-- Show summary
DO $$
DECLARE
  updated_count INTEGER;
  total_null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM "SchoolFormTemplate"
  WHERE category IS NOT NULL;
  
  SELECT COUNT(*) INTO total_null_count
  FROM "SchoolFormTemplate"
  WHERE category IS NULL;
  
  RAISE NOTICE 'Backfill completed:';
  RAISE NOTICE '  Templates with category set: %', updated_count;
  RAISE NOTICE '  Templates still with null category: %', total_null_count;
END $$;

-- Drop the temporary function
DROP FUNCTION IF EXISTS extract_category_from_school_id(TEXT);

COMMIT;

-- Verification query (run separately to check results)
-- SELECT 
--   id,
--   "schoolId",
--   category,
--   "updatedAt"
-- FROM "SchoolFormTemplate"
-- WHERE category IS NULL
-- ORDER BY "updatedAt" DESC;

