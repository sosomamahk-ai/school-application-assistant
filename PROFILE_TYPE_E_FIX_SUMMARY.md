# Profile Type "E" (内地学校) Classification Fix - Summary

## ✅ Completed Changes

### 1. WordPress REST API Settings ✅
**File**: `wordpress-snippets/enable-profile-type-rest-api.php`

- Created PHP snippet to ensure `profile_type` taxonomy has `show_in_rest => true`
- Ensures `school_profile` post type has `show_in_rest => true`
- Ensures published posts are accessible via REST API
- Includes taxonomy terms in `_embedded` for REST API responses

**Installation**: Copy to WordPress Code Snippets plugin or functions.php and activate.

### 2. Sync Function Updates ✅
**Files Updated**:
- `src/pages/api/wordpress/school-profiles.ts`
- `src/pages/api/admin/template-list.ts`

**Changes**:
- Added `mainland-school-template` → `内地学校` mapping in `mapSlugToCategory()`
- Added `E` → `内地学校` mapping in `mapSchoolProfileTypeCode()`
- Added `内地学校` to grouped profiles in school-profiles API
- Added `内地学校` to profile categories in template-list API

**Note**: The sync script stores taxonomy slugs (like `mainland-school-template`) in `profileType` field. The API maps these slugs to display categories. When `mainland-school-template` is found, it's now correctly mapped to `内地学校`.

### 3. Database Schema ✅
**File**: `prisma/schema.prisma`

- `profileType` field is `String?` (not an enum), so "E" and `mainland-school-template` are both valid values
- No migration needed - the field already supports any string value

### 4. Frontend Template-List Page ✅
**File**: `src/pages/admin/template-list.tsx`

- Added `内地学校` tab to `PROFILE_TYPES` array
- Tab displays schools where `profileType = "E"` or taxonomy slug is `mainland-school-template`
- Updated classification logic to exclude "E" from "未分类/需检查"

### 5. Project-Wide Updates ✅
**Files Updated**:
- `src/pages/api/wordpress/school-profiles.ts` - Added "内地学校" category
- `src/pages/api/admin/template-list.ts` - Added "内地学校" to all mappings
- `src/pages/admin/template-list.tsx` - Added "内地学校" tab
- `src/pages/schools/index.tsx` - Added "内地学校" to categoryMap and abbrMap
- `src/pages/api/admin/templates/create-from-profile.ts` - Added "内地学校" to categoryMap and abbrMap
- `scripts/test-template-category-fix.ts` - Added "内地学校" to validCategories

**Mappings Updated**:
- `SLUG_CATEGORY_MAP`: Added `'mainland-school-template': '内地学校'`
- `CODE_CATEGORY_MAP`: Added `E: '内地学校'`
- `categoryMap`: Added `'内地学校': '内地学校'`
- `abbrMap`: Added `'ml': '内地学校'` (for schoolId format)
- `categoryIcons`: Added `'内地学校': School`

### 6. Verification ✅

**School ID 47567** should now:
- Display under the new "内地学校" tab
- No longer appear in "未分类/需检查"
- Have `profileType` set to either:
  - `mainland-school-template` (if synced from taxonomy)
  - `E` (if set via ACF `school_profile_type`)

## 🔄 Data Flow

1. **WordPress → Sync Script**:
   - Taxonomy `mainland-school-template` → stored as `profileType = "mainland-school-template"`
   - ACF `school_profile_type = "E"` → stored as `school_profile_type = "E"`

2. **Database → API**:
   - `profileType = "mainland-school-template"` → mapped to `内地学校` via `mapSlugToCategory()`
   - `school_profile_type = "E"` → mapped to `内地学校` via `mapSchoolProfileTypeCode()`

3. **API → Frontend**:
   - Schools with category `内地学校` appear in the "内地学校" tab
   - Classification excludes "E" and `mainland-school-template` from "未分类/需检查"

## 📝 Next Steps

1. **Install WordPress PHP Snippet**:
   - Copy `wordpress-snippets/enable-profile-type-rest-api.php` to WordPress
   - Activate via Code Snippets plugin or add to functions.php

2. **Verify REST API**:
   - Test: `/wp-json/wp/v2/profile_type` returns taxonomy terms
   - Test: `/wp-json/wp/v2/school_profile/47567?_embed` includes `profile_type` in `_embedded['wp:term']`

3. **Re-sync School 47567**:
   - Run sync script to update school 47567 with correct `profileType`
   - Verify in database: `SELECT * FROM "School" WHERE "wpId" = 47567;`
   - Should have `profileType = 'mainland-school-template'` or `school_profile_type = 'E'`

4. **Test Frontend**:
   - Navigate to `/admin/template-list`
   - Verify "内地学校" tab appears
   - Verify school 47567 appears under "内地学校" tab
   - Verify it does NOT appear in "未分类/需检查"

## 🐛 Troubleshooting

If school 47567 still appears in "未分类/需检查":

1. **Check WordPress REST API**:
   - Verify taxonomy `profile_type` has `show_in_rest => true`
   - Verify post type `school_profile` has `show_in_rest => true`
   - Test: `/wp-json/wp/v2/school_profile/47567?_embed`

2. **Check Database**:
   - Verify `profileType` or `school_profile_type` is set:
     ```sql
     SELECT "wpId", "name", "profileType", "school_profile_type" 
     FROM "School" 
     WHERE "wpId" = 47567;
     ```

3. **Re-sync**:
   - Run sync script: `npm run sync:profile-to-school -- --id 47567`
   - Verify sync logs show taxonomy `mainland-school-template` or ACF `E`

4. **Check API Response**:
   - Test: `/api/admin/template-list`
   - Verify school 47567 has `profileType: "内地学校"` in response

