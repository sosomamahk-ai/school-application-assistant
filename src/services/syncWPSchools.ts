import { prisma } from '@/lib/prisma';
import { getWordPressSchools, parseWordPressTemplateId } from './wordpressSchoolService';
import type { WordPressSchool } from '@/types/wordpress';

type AcfRecord = Record<string, any>;
type AcfDataMap = Map<number, AcfRecord>;

const WORDPRESS_ACF_PER_PAGE = Number(process.env.WORDPRESS_ACF_PER_PAGE ?? 100);
const WORDPRESS_ACF_TIMEOUT_MS = Number(process.env.WORDPRESS_ACF_TIMEOUT_MS ?? 60000);
const WORDPRESS_ACF_MAX_PAGES = Number(process.env.WORDPRESS_ACF_MAX_PAGES ?? 30);

const normalizeToString = (value: any): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = normalizeToString(item);
      if (normalized) return normalized;
    }
    return null;
  }
  if (typeof value === 'object') {
    if ('value' in value) {
      return normalizeToString((value as any).value);
    }
    if ('label' in value) {
      return normalizeToString((value as any).label);
    }
    if ('name' in value) {
      return normalizeToString((value as any).name);
    }
  }
  const stringValue = String(value).trim();
  return stringValue || null;
};

const pickFromSources = (
  keys: string[],
  sources: Array<Record<string, any> | null | undefined>
): string | null => {
  for (const key of keys) {
    for (const source of sources) {
      if (!source || typeof source !== 'object') continue;
      if (key in source) {
        const normalized = normalizeToString((source as any)[key]);
        if (normalized) {
          return normalized;
        }
      }
    }
  }
  return null;
};

const getTaxonomyValue = (
  taxonomies: Record<string, string[]> | undefined,
  keys: string[]
): string | null => {
  if (!taxonomies) return null;
  for (const key of keys) {
    const variants = [
      key,
      key.replace(/_/g, '-'),
      key.replace(/-/g, '_')
    ].map((variant) => variant.trim().toLowerCase());

    for (const variant of variants) {
      const values = taxonomies[variant];
      if (Array.isArray(values) && values.length > 0) {
        const normalized = normalizeToString(values[0]);
        if (normalized) {
          return normalized;
        }
      }
    }
  }
  return null;
};

async function fetchAcfCollection(
  baseUrl: string,
  type: 'profile' | 'university'
): Promise<AcfDataMap> {
  const results: AcfDataMap = new Map();
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= WORDPRESS_ACF_MAX_PAGES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), WORDPRESS_ACF_TIMEOUT_MS);

      const endpoint = `${baseUrl}/wp-json/acf/v3/${type}?per_page=${WORDPRESS_ACF_PER_PAGE}&page=${page}`;
      console.log(`[syncAllWPSchools] Fetching ${type} ACF data from: ${endpoint}`);
      const response = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[syncAllWPSchools] ${type} ACF endpoint responded with ${response.status}`);
        break;
      }

      const items = await response.json();
      if (!Array.isArray(items) || items.length === 0) {
        break;
      }

      items.forEach((item: any) => {
        const rawId = item?.id ?? item?.ID ?? item?.post_id ?? item?.postId;
        const acf = item?.acf ?? item;
        if (!rawId || !acf || typeof acf !== 'object') {
          return;
        }
        const wpId = Number(rawId);
        if (Number.isFinite(wpId)) {
          results.set(wpId, acf);
        }
      });

      const totalPagesHeader = response.headers.get('X-WP-TotalPages');
      totalPages = totalPagesHeader ? Number(totalPagesHeader) : totalPages;
      if (!Number.isFinite(totalPages) || totalPages < 1) {
        totalPages = 1;
      }

      console.log(
        `[syncAllWPSchools] ${type} ACF page ${page}/${totalPages} processed (${items.length} entries)`
      );

      page += 1;
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        console.error(`[syncAllWPSchools] ${type} ACF fetch timed out at page ${page}`);
      } else {
        console.error(`[syncAllWPSchools] ${type} ACF fetch error at page ${page}:`, error);
      }
      break;
    }
  }

  return results;
}

async function fetchWordPressAcfData(baseUrl: string): Promise<AcfDataMap> {
  const acfMap: AcfDataMap = new Map();
  const profileData = await fetchAcfCollection(baseUrl, 'profile');
  profileData.forEach((value, key) => acfMap.set(key, value));

  const universityData = await fetchAcfCollection(baseUrl, 'university');
  universityData.forEach((value, key) => acfMap.set(key, value));

  console.log(`[syncAllWPSchools] Total ACF records fetched: ${acfMap.size}`);
  return acfMap;
}

/**
 * Sync ALL schools from WordPress to the database
 * This function fetches all schools from WordPress REST API and upserts them into the School table
 * 
 * Fields synced:
 * - wp_id (WordPress post ID)
 * - name (school title)
 * - name_short (from ACF name_short field)
 * - permalink (from post.link)
 * - profile_type (from taxonomy or ACF, fallback to "local")
 * - Any other relevant fields
 */
export async function syncAllWPSchools(): Promise<{
  success: boolean;
  synced: number;
  errors: number;
  errorsList: Array<{ wpId: number; error: string }>;
}> {
  const errorsList: Array<{ wpId: number; error: string }> = [];
  let syncedCount = 0;

  try {
    console.log('[syncAllWPSchools] Starting sync of all WordPress schools...');
    
    // Build template lookup map (WordPress id -> templateId)
    const templateMap = new Map<string, string>();
    const templates = await prisma.schoolFormTemplate.findMany({
      select: { id: true, schoolId: true }
    });
    templates.forEach((template) => {
      const parsed = parseWordPressTemplateId(template.schoolId);
      if (!parsed) {
        return;
      }
      const key = `${parsed.type}:${parsed.id}`;
      templateMap.set(key, template.id);
    });
    console.log(
      `[syncAllWPSchools] Template lookup ready: ${templateMap.size} WordPress IDs mapped to template IDs`
    );

    // Fetch all schools from WordPress
    const wordPressData = await getWordPressSchools({ forceRefresh: true });
    const allSchools = wordPressData.all || [];
    
    console.log(`[syncAllWPSchools] Found ${allSchools.length} schools in WordPress`);
    
    // Fetch full ACF data (name_short lives here)
    const baseUrl = process.env.WORDPRESS_BASE_URL || process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL;
    let acfDataByWpId: AcfDataMap = new Map();
    if (baseUrl) {
      try {
        acfDataByWpId = await fetchWordPressAcfData(baseUrl);
      } catch (error) {
        console.warn(
          '[syncAllWPSchools] Failed to fetch ACF data from acf/v3 endpoint, continuing with fallback data only:',
          error
        );
      }
    } else {
      console.warn(
        '[syncAllWPSchools] WORDPRESS_BASE_URL not configured - cannot fetch acf/v3 data, name_short may remain null'
      );
    }
    console.log(`[syncAllWPSchools] Starting batch processing...`);

    // Process schools in batches for better performance
    const BATCH_SIZE = 50;
    const totalBatches = Math.ceil(allSchools.length / BATCH_SIZE);
    
    // Process each school
    for (let i = 0; i < allSchools.length; i++) {
      const wpSchool = allSchools[i];
      
      // Log progress every 10 schools
      if (i % 10 === 0) {
        const progress = ((i / allSchools.length) * 100).toFixed(1);
        console.log(`[syncAllWPSchools] Progress: ${i}/${allSchools.length} (${progress}%)`);
      }
      try {
        // Extract data from WordPress school
        const wpId = wpSchool.id;
        const name = wpSchool.title || '';
        
        // Try to get ACF data from the acf/v3 endpoint results
        const acfFromApi = wpId ? acfDataByWpId.get(wpId) : null;
        
        // Extract name_short from multiple possible locations
        // Priority: 1. Direct WordPress API ACF data, 2. wordpressSchoolService data
        let nameShort: string | null = null;
        
        if (acfFromApi) {
          nameShort = acfFromApi.name_short || acfFromApi.nameShort || null;
          if (nameShort && typeof nameShort === 'string') {
            nameShort = nameShort.trim() || null;
          }
        }
        
        // Fallback to wordpressSchoolService data
        if (!nameShort) {
          nameShort = 
            wpSchool.nameShort || 
            wpSchool.acf?.name_short || 
            wpSchool.acf?.nameShort || null;
          
          if (nameShort && typeof nameShort === 'string') {
            nameShort = nameShort.trim() || null;
          }
        }
        
        const nameEnglish =
          pickFromSources(
            ['name_english', 'nameEnglish', 'english_name', 'englishName'],
            [acfFromApi, wpSchool.acf]
          ) || null;

        let country =
          pickFromSources(['country'], [acfFromApi, wpSchool.acf]) ||
          getTaxonomyValue(wpSchool.taxonomies, ['country', 'countries']);

        let location =
          pickFromSources(['location', 'district', 'region'], [acfFromApi, wpSchool.acf]) ||
          getTaxonomyValue(wpSchool.taxonomies, ['location', 'locations', 'district', 'region']);

        let bandType =
          pickFromSources(['band_type', 'band-type', 'bandType'], [acfFromApi, wpSchool.acf]) ||
          getTaxonomyValue(wpSchool.taxonomies, ['band-type', 'band_type', 'bandtype', 'band']);

        // Debug logging for schools without name_short
        if (!nameShort && i < 10) {
          console.log(`[syncAllWPSchools] School ${wpId} (${name}) has no name_short:`, {
            hasDirectData: !!acfFromApi,
            directAcf: acfFromApi,
            serviceNameShort: wpSchool.nameShort,
            serviceAcf: wpSchool.acf
          });
        }
        
        const permalink = wpSchool.permalink || wpSchool.url || null;
        
        // Determine template association (if template exists for this WordPress ID)
        let templateId: string | null = null;
        if (wpId) {
          const key = `${wpSchool.type}:${wpId}`;
          templateId = templateMap.get(key) || null;

          // Some legacy template ids may not include type prefixes; try fallback keys
          if (!templateId) {
            templateId = templateMap.get(`profile:${wpId}`) || templateMap.get(`university:${wpId}`) || null;
          }
        }

        // Extract profile_type from category or ACF
        // Map category to profile_type
        const categoryToProfileType: Record<string, string> = {
          '国际学校': 'international',
          '香港国际学校': 'international',
          '香港本地中学': 'local_secondary',
          '本地中学': 'local_secondary',
          '香港本地小学': 'local_primary',
          '本地小学': 'local_primary',
          '香港幼稚园': 'kindergarten',
          '幼稚园': 'kindergarten',
          '大学': 'university'
        };
        
        const profileType = categoryToProfileType[wpSchool.category || ''] || 'local';

        // Upsert school into database
        // Strategy: Use wpId as primary identifier (unique constraint)
        // If wpId exists, find or create by wpId
        // If no wpId but templateId exists, find or create by templateId
        // If neither exists, skip (shouldn't happen for WordPress schools)
        
        if (wpId) {
          // Primary strategy: Use wpId (most reliable)
          try {
            // Try to find existing school by wpId
            const existing = await prisma.school.findUnique({
              where: { wpId: wpId }
            });

            if (existing) {
              // Update existing school
              await prisma.school.update({
                where: { id: existing.id },
                data: {
                  name: name,
                  nameEnglish: nameEnglish || undefined,
                  nameShort: nameShort || undefined,
                  permalink: permalink || undefined,
                  profileType: profileType,
                  templateId: templateId || undefined,
                  country: country || undefined,
                  location: location || undefined,
                  bandType: bandType || undefined,
                  metadataSource: 'wordpress',
                  metadataLastFetchedAt: new Date(),
                  updatedAt: new Date()
                }
              });
            } else {
              // Check if school exists with templateId (might be created before sync)
              if (templateId) {
                const existingByTemplate = await prisma.school.findUnique({
                  where: { templateId: templateId }
                });
                
                if (existingByTemplate) {
                  // Update existing school with wpId
                  await prisma.school.update({
                    where: { id: existingByTemplate.id },
                    data: {
                      wpId: wpId,
                      name: name,
                      nameEnglish: nameEnglish || undefined,
                      nameShort: nameShort,  // Allow null
                      permalink: permalink || undefined,
                      profileType: profileType,
                      country: country || undefined,
                      location: location || undefined,
                      bandType: bandType || undefined,
                      metadataSource: 'wordpress',
                      metadataLastFetchedAt: new Date(),
                      updatedAt: new Date()
                    }
                  });
                } else {
                  // Create new school with wpId
                  await prisma.school.create({
                    data: {
                      wpId: wpId,
                      name: name,
                      nameEnglish: nameEnglish || undefined,
                      nameShort: nameShort,  // Can be null
                      permalink: permalink,
                      profileType: profileType,
                      templateId: templateId,
                      country: country || undefined,
                      location: location || undefined,
                      bandType: bandType || undefined,
                      metadataSource: 'wordpress',
                      metadataLastFetchedAt: new Date()
                    }
                  });
                }
              } else {
                // Create new school without template
                await prisma.school.create({
                  data: {
                    wpId: wpId,
                    name: name,
                    nameEnglish: nameEnglish || undefined,
                    nameShort: nameShort,  // Can be null
                    permalink: permalink,
                    profileType: profileType,
                    country: country || undefined,
                    location: location || undefined,
                    bandType: bandType || undefined,
                    metadataSource: 'wordpress',
                    metadataLastFetchedAt: new Date()
                  }
                });
              }
            }
          } catch (error: any) {
            // Handle unique constraint violation (wpId already exists but we didn't find it)
            if (error.code === 'P2002' && error.meta?.target?.includes('wpId')) {
              // Try to find by wpId again (race condition)
              const existing = await prisma.school.findUnique({
                where: { wpId: wpId }
              });
              if (existing) {
                await prisma.school.update({
                  where: { id: existing.id },
                  data: {
                    name: name,
                    nameEnglish: nameEnglish || undefined,
                    nameShort: nameShort,  // Allow null
                    permalink: permalink || undefined,
                    profileType: profileType,
                    templateId: templateId || undefined,
                    country: country || undefined,
                    location: location || undefined,
                    bandType: bandType || undefined,
                    metadataSource: 'wordpress',
                    metadataLastFetchedAt: new Date(),
                    updatedAt: new Date()
                  }
                });
              } else {
                throw error; // Re-throw if still can't find
              }
            } else {
              throw error; // Re-throw other errors
            }
          }
        } else if (templateId) {
          // Fallback: Use templateId if wpId is not available
          try {
            await prisma.school.upsert({
              where: { templateId: templateId },
              update: {
                name: name,
                nameEnglish: nameEnglish || undefined,
                nameShort: nameShort,  // Allow null
                permalink: permalink || undefined,
                profileType: profileType,
                country: country || undefined,
                location: location || undefined,
                bandType: bandType || undefined,
                metadataSource: 'wordpress',
                metadataLastFetchedAt: new Date(),
                updatedAt: new Date()
              },
              create: {
                name: name,
                nameEnglish: nameEnglish || undefined,
                nameShort: nameShort,  // Can be null
                permalink: permalink,
                profileType: profileType,
                templateId: templateId,
                country: country || undefined,
                location: location || undefined,
                bandType: bandType || undefined,
                metadataSource: 'wordpress',
                metadataLastFetchedAt: new Date()
              }
            });
          } catch (error: any) {
            // Handle case where templateId might be null in unique constraint
            if (error.code === 'P2002') {
              // Try to find by name as last resort
              const existing = await prisma.school.findFirst({
                where: {
                  name: name,
                  templateId: templateId
                }
              });
              if (existing) {
                await prisma.school.update({
                  where: { id: existing.id },
                  data: {
                    name: name,
                    nameEnglish: nameEnglish || undefined,
                    nameShort: nameShort,  // Allow null
                    permalink: permalink || undefined,
                    profileType: profileType,
                    country: country || undefined,
                    location: location || undefined,
                    bandType: bandType || undefined,
                    metadataSource: 'wordpress',
                    metadataLastFetchedAt: new Date(),
                    updatedAt: new Date()
                  }
                });
              } else {
                throw error;
              }
            } else {
              throw error;
            }
          }
        } else {
          // No wpId and no templateId - skip (shouldn't happen for WordPress schools)
          console.warn(`[syncAllWPSchools] Skipping school "${name}" - no wpId or templateId`);
          continue;
        }

        syncedCount++;
      } catch (error: any) {
        const wpId = wpSchool.id || 0;
        const errorMessage = error?.message || String(error);
        errorsList.push({ wpId, error: errorMessage });
        console.error(`[syncAllWPSchools] Error syncing school ${wpId}:`, errorMessage);
      }
    }

    console.log(`[syncAllWPSchools] ✅ Sync completed: ${syncedCount} synced, ${errorsList.length} errors`);

    return {
      success: true,
      synced: syncedCount,
      errors: errorsList.length,
      errorsList
    };
  } catch (error: any) {
    console.error('[syncAllWPSchools] Fatal error:', error);
    return {
      success: false,
      synced: syncedCount,
      errors: errorsList.length + 1,
      errorsList: [
        ...errorsList,
        { wpId: 0, error: error?.message || 'Fatal sync error' }
      ]
    };
  }
}

