# Prisma Migration Fix Guide

## Issues Encountered

1. **EPERM Error on `prisma generate`**: File permission error - the Prisma query engine DLL is locked by a running process
2. **P3015 Error on `prisma migrate`**: Migration state corruption - Prisma can't find the migration file even though it exists

## Solutions

### Step 1: Fix Prisma Generate Error (EPERM)

The EPERM error occurs because the Prisma query engine DLL file is locked by a running process. To fix:

1. **Close all running Node processes**:
   ```powershell
   # Find and close Node processes
   Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
   ```

2. **Close Prisma Studio if running**:
   ```powershell
   Get-Process | Where-Object {$_.ProcessName -like "*prisma*"} | Stop-Process -Force
   ```

3. **Close your dev server** (if running):
   - Stop `npm run dev` or `next dev`

4. **Try generating again**:
   ```powershell
   npx prisma generate
   ```

5. **If still failing, delete and regenerate**:
   ```powershell
   Remove-Item -Recurse -Force node_modules\.prisma
   npx prisma generate
   ```

### Step 2: Fix Migration State Issue (P3015)

The migration file exists but Prisma can't find it. This is a migration state corruption issue.

**Option A: Use `prisma migrate deploy` (Recommended for Production)**

This bypasses the shadow database and applies migrations directly:

```powershell
npx prisma migrate deploy
```

**Option B: Mark Migration as Applied (If Already in Database)**

If the migration is already applied to your database, mark it as resolved:

```powershell
# First, check if the migration is in the database
npx prisma migrate status

# If it shows as applied, mark it as resolved
npx prisma migrate resolve --applied 20251120170000_manual_initial_migration
```

**Option C: Delete and Recreate Migration (If Not Applied)**

If the migration hasn't been applied and you can recreate it:

```powershell
# Backup the migration first
Copy-Item -Recurse "prisma\migrations\20251120170000_manual_initial_migration" "prisma\migrations\20251120170000_manual_initial_migration.backup"

# Delete the problematic migration
Remove-Item -Recurse -Force "prisma\migrations\20251120170000_manual_initial_migration"

# Create a new migration
npx prisma migrate dev --name manual_initial_migration
```

### Step 3: Apply the New Migration

Once the migration state is fixed, apply the new migration:

```powershell
# Apply the new migration for wpId and optional templateId
npx prisma migrate deploy
```

Or if using dev mode:

```powershell
npx prisma migrate dev
```

### Step 4: Generate Prisma Client

After migrations are applied:

```powershell
npx prisma generate
```

## Complete Workflow

Here's the complete workflow to fix both issues:

```powershell
# 1. Close all Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Delete Prisma client cache
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue

# 3. Apply migrations (bypasses shadow database issues)
npx prisma migrate deploy

# 4. Generate Prisma client
npx prisma generate

# 5. Verify everything works
npx prisma migrate status
```

## Migration File Created

The migration file has been created at:
- `prisma/migrations/20251124132151_add_wp_id_and_optional_template/migration.sql`

This migration:
- Makes `templateId` optional (drops NOT NULL constraint)
- Adds `wpId` column (INTEGER, nullable, unique)
- Adds `profileType` column (TEXT, nullable)
- Creates indexes on `wpId` and `templateId`

## Troubleshooting

### If `prisma migrate deploy` fails with connection error:

Check your `.env` file has the correct `DATABASE_URL`:
```powershell
# Test database connection
npx prisma db execute --stdin
```

### If migration already applied error:

Check what migrations are actually in your database:
```sql
SELECT * FROM "_prisma_migrations" ORDER BY finished_at;
```

### If you need to reset migrations:

⚠️ **WARNING**: Only do this in development!

```powershell
# Reset database (WILL DELETE ALL DATA)
npx prisma migrate reset

# Or manually delete migration history
# Then recreate migrations
npx prisma migrate dev
```

## Next Steps After Migration

1. **Trigger the sync**:
   ```bash
   POST /api/admin/sync-schools
   ```

2. **Verify the fix**:
   - Check `/schools` page - all schools should show `name_short`
   - Check database: `SELECT COUNT(*) FROM "School" WHERE "nameShort" IS NOT NULL;`

