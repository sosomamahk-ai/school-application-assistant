import type { NextApiRequest, NextApiResponse } from 'next';
import { getWordPressSchools } from '@/services/wordpressSchoolService';
import { getCache } from '@/services/wordpressCache';
import { prisma } from '@/lib/prisma';
import { buildWordPressTemplateId, parseWordPressTemplateId } from '@/services/wordpressSchoolService';
import type { WordPressSchool } from '@/types/wordpress';

/**
 * Extract profile_type slug from WordPress post data
 * Priority: _embedded['wp:term'] -> direct field -> ACF field
 */
function extractProfileTypeSlug(post: any): string | null {
  if (!post) return null;

  // 1. From _embedded taxonomy terms (most reliable in WordPress REST API)
  const embeddedTerms = post?._embedded?.['wp:term'];
  if (Array.isArray(embeddedTerms)) {
    for (const termGroup of embeddedTerms) {
      if (Array.isArray(termGroup)) {
        for (const term of termGroup) {
          if (term?.taxonomy === 'profile_type') {
            // Prioritize slug - this is what we need for accurate classification
            if (term?.slug && typeof term.slug === 'string') {
              const slug = term.slug.trim();
              if (slug) {
                return slug;
              }
            }
          }
        }
      }
    }
  }

  // 2. Direct taxonomy field (if custom endpoint includes it)
  if (post?.profile_type) {
    if (Array.isArray(post.profile_type) && post.profile_type.length > 0) {
      const firstTerm = post.profile_type[0];
      if (typeof firstTerm === 'object' && firstTerm !== null) {
        if (firstTerm?.slug && typeof firstTerm.slug === 'string') {
          const slug = firstTerm.slug.trim();
          if (slug) {
            return slug;
          }
        }
      } else if (typeof firstTerm === 'string') {
        const slug = firstTerm.trim();
        if (slug) {
          return slug;
        }
      }
    } else if (typeof post.profile_type === 'string') {
      const slug = post.profile_type.trim();
      if (slug) {
        return slug;
      }
    } else if (typeof post.profile_type === 'object' && post.profile_type !== null) {
      if (post.profile_type?.slug && typeof post.profile_type.slug === 'string') {
        const slug = post.profile_type.slug.trim();
        if (slug) {
          return slug;
        }
      }
    }
  }

  // 3. Try from ACF field (as last resort)
  if (post?.acf?.profile_type) {
    const acfValue = post.acf.profile_type;
    if (typeof acfValue === 'string') {
      const slug = acfValue.trim();
      if (slug) {
        return slug;
      }
    } else if (typeof acfValue === 'object' && acfValue !== null) {
      if (acfValue?.slug && typeof acfValue.slug === 'string') {
        const slug = acfValue.slug.trim();
        if (slug) {
          return slug;
        }
      }
    }
  }

  return null;
}

/**
 * Map profile_type slug to display category
 * Returns 'unresolved_raw' if slug is null
 */
function mapSlugToCategory(slug: string | null): string {
  if (!slug) return 'unresolved_raw';

  const slugMap: Record<string, string> = {
    'hk-is-template': '国际学校',
    'hk-ls-template': '本地中学',
    'hk-ls-primary-template': '本地小学',
    'hk-kg-template': '幼稚园'
  };

  return slugMap[slug] || 'unresolved_raw';
}

/**
 * Fetch a single profile by ID with _embed
 */
async function fetchProfileById(
  baseUrl: string,
  profileId: number,
  endpointBase: string = 'profile'
): Promise<{ post: any | null; status: number; foundBy: 'id' | null }> {
  try {
    let endpoint = `${baseUrl}/wp-json/wp/v2/${endpointBase}/${profileId}?_embed&acf_format=standard`;
    let response = await fetch(endpoint, {
      headers: { Accept: 'application/json' }
    });

    // Fallback to 'school_profile' if 'profile' fails
    if (!response.ok && response.status === 404 && endpointBase === 'profile') {
      endpoint = `${baseUrl}/wp-json/wp/v2/school_profile/${profileId}?_embed&acf_format=standard`;
      response = await fetch(endpoint, {
        headers: { Accept: 'application/json' }
      });
    }

    if (response.ok) {
      const post = await response.json();
      return { post, status: response.status, foundBy: 'id' };
    }

    return { post: null, status: response.status, foundBy: null };
  } catch (error) {
    console.error(`[school-profiles] Error fetching profile ${profileId} by ID:`, error);
    return { post: null, status: 0, foundBy: null };
  }
}

/**
 * Fetch profile by slug with _embed
 */
async function fetchProfileBySlug(
  baseUrl: string,
  slug: string,
  endpointBase: string = 'profile'
): Promise<{ post: any | null; status: number; foundBy: 'slug' | null }> {
  try {
    let endpoint = `${baseUrl}/wp-json/wp/v2/${endpointBase}?slug=${encodeURIComponent(slug)}&_embed&acf_format=standard`;
    let response = await fetch(endpoint, {
      headers: { Accept: 'application/json' }
    });

    // Fallback to 'school_profile' if 'profile' fails
    if (!response.ok && response.status === 404 && endpointBase === 'profile') {
      endpoint = `${baseUrl}/wp-json/wp/v2/school_profile?slug=${encodeURIComponent(slug)}&_embed&acf_format=standard`;
      response = await fetch(endpoint, {
        headers: { Accept: 'application/json' }
      });
    }

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return { post: data[0], status: response.status, foundBy: 'slug' };
      }
    }

    return { post: null, status: response.status, foundBy: null };
  } catch (error) {
    console.error(`[school-profiles] Error fetching profile by slug ${slug}:`, error);
    return { post: null, status: 0, foundBy: null };
  }
}

/**
 * Fetch profile by search (title) with _embed
 * Returns the best match based on exact title match first, then fuzzy match
 */
async function fetchProfileBySearch(
  baseUrl: string,
  title: string,
  endpointBase: string = 'profile'
): Promise<{ post: any | null; status: number; foundBy: 'search' | null }> {
  try {
    let endpoint = `${baseUrl}/wp-json/wp/v2/${endpointBase}?search=${encodeURIComponent(title)}&per_page=5&_embed&acf_format=standard`;
    let response = await fetch(endpoint, {
      headers: { Accept: 'application/json' }
    });

    // Fallback to 'school_profile' if 'profile' fails
    if (!response.ok && response.status === 404 && endpointBase === 'profile') {
      endpoint = `${baseUrl}/wp-json/wp/v2/school_profile?search=${encodeURIComponent(title)}&per_page=5&_embed&acf_format=standard`;
      response = await fetch(endpoint, {
        headers: { Accept: 'application/json' }
      });
    }

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        // Try exact match first (rendered title)
        const exactMatch = data.find((item: any) => {
          const renderedTitle = item?.title?.rendered || item?.title || '';
          return renderedTitle === title || renderedTitle.trim() === title.trim();
        });

        if (exactMatch) {
          return { post: exactMatch, status: response.status, foundBy: 'search' };
        }

        // Fallback to first result (fuzzy match)
        return { post: data[0], status: response.status, foundBy: 'search' };
      }
    }

    return { post: null, status: response.status, foundBy: null };
  } catch (error) {
    console.error(`[school-profiles] Error searching profile by title ${title}:`, error);
    return { post: null, status: 0, foundBy: null };
  }
}

/**
 * Fallback mechanism: Try to fetch missing profile using id -> slug -> search
 */
async function fetchMissingProfile(
  baseUrl: string,
  profile: WordPressSchool,
  endpointBase: string = 'profile'
): Promise<{ post: any | null; foundBy: 'id' | 'slug' | 'search' | 'none'; attempted: string[]; statuses: number[] }> {
  const attempted: string[] = [];
  const statuses: number[] = [];

  // Try 1: Fetch by ID
  attempted.push('id');
  const byId = await fetchProfileById(baseUrl, profile.id, endpointBase);
  statuses.push(byId.status);
  if (byId.post && byId.foundBy) {
    return { post: byId.post, foundBy: byId.foundBy, attempted, statuses };
  }

  // Try 2: Fetch by slug (if we can extract slug from URL or other source)
  // Note: We don't have slug in WordPressSchool type, so we'll skip this for now
  // If you have slug information, you can add it here
  attempted.push('slug');
  // For now, we'll try to construct slug from title (basic implementation)
  const slugCandidate = profile.title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slugCandidate) {
    const bySlug = await fetchProfileBySlug(baseUrl, slugCandidate, endpointBase);
    statuses.push(bySlug.status);
    if (bySlug.post && bySlug.foundBy) {
      return { post: bySlug.post, foundBy: bySlug.foundBy, attempted, statuses };
    }
  } else {
    statuses.push(0); // No slug to try
  }

  // Try 3: Search by title
  attempted.push('search');
  const bySearch = await fetchProfileBySearch(baseUrl, profile.title, endpointBase);
  statuses.push(bySearch.status);
  if (bySearch.post && bySearch.foundBy) {
    return { post: bySearch.post, foundBy: bySearch.foundBy, attempted, statuses };
  }

  return { post: null, foundBy: 'none', attempted, statuses };
}

/**
 * Check if taxonomy is visible in REST API
 */
function checkTaxonomyVisibility(post: any): { visible: boolean; hasEmbedded: boolean; hasTerms: boolean } {
  const hasEmbedded = !!post?._embedded;
  const hasTerms = !!post?._embedded?.['wp:term'];
  const visible = hasEmbedded && hasTerms;

  return { visible, hasEmbedded, hasTerms };
}

/**
 * Auto-detect available WordPress REST API endpoint for profiles
 */
async function detectProfileEndpoint(baseUrl: string): Promise<string | null> {
  const candidates = [
    'profile',
    'school_profile',
    'schools',
    'school'
  ];

  console.log(`[school-profiles] Auto-detecting profile endpoint from ${baseUrl}...`);

  for (const candidate of candidates) {
    try {
      const testEndpoint = `${baseUrl}/wp-json/wp/v2/${candidate}?per_page=1`;
      const response = await fetch(testEndpoint, {
        headers: { Accept: 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) || (typeof data === 'object' && data !== null)) {
          console.log(`[school-profiles] ✅ Found working endpoint: ${candidate}`);
          return candidate;
        }
      }
    } catch (error) {
      // Continue to next candidate
      continue;
    }
  }

  // Try unified endpoint
  try {
    const unifiedEndpoint = `${baseUrl}/wp-json/schools/v1/list`;
    const response = await fetch(unifiedEndpoint, {
      headers: { Accept: 'application/json' }
    });
    if (response.ok) {
      console.log(`[school-profiles] ✅ Found unified endpoint: /wp-json/schools/v1/list`);
      return 'unified'; // Special marker for unified endpoint
    }
  } catch (error) {
    // Continue
  }

  console.error(`[school-profiles] ❌ Could not find any working endpoint. Tried: ${candidates.join(', ')}`);
  return null;
}

/**
 * API endpoint to get WordPress school profiles with template mapping
 * Returns profiles grouped by profile_type taxonomy
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const forceRefresh = req.query.refresh === 'true';
    const startTime = Date.now();
    
    // 🔥 STEP 1: Try to get WordPress schools from cache first (fast)
    let wordPressData;
    let fromCache = false;
    
    if (!forceRefresh) {
      const cacheResult = await getCache();
      if (cacheResult?.success && cacheResult.data) {
        const maxAge = Number(process.env.WORDPRESS_CACHE_TTL || 3600 * 1000); // 1 hour default
        if (cacheResult.age !== undefined && cacheResult.age < maxAge) {
          wordPressData = cacheResult.data;
          fromCache = true;
          console.log(`[school-profiles] ✅ Using cached data (age: ${Math.round(cacheResult.age / 1000)}s, backend: ${cacheResult.backend})`);
        }
      }
    }
    
    // If not from cache or cache expired, fetch fresh data
    if (!wordPressData) {
      console.log(`[school-profiles] Fetching fresh data from WordPress...`);
      wordPressData = await getWordPressSchools({ forceRefresh });
      fromCache = false;
    }
    
    const profiles = wordPressData.profiles || [];
    console.log(`[school-profiles] Loaded ${profiles.length} profiles (fromCache: ${fromCache})`);

    // Get raw WordPress data directly from API to extract profile_type slug
    const baseUrl = process.env.WORDPRESS_BASE_URL || process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL;
    if (!baseUrl) {
      return res.status(500).json({
        error: 'WordPress base URL is not configured'
      });
    }

    const wpBaseUrl = baseUrl.replace(/\/+$/, '');
    
    // 🔥 STEP 2: Auto-detect endpoint (only once)
    let endpointBase = await detectProfileEndpoint(wpBaseUrl);
    if (!endpointBase) {
      console.warn(`[school-profiles] ⚠️  Could not detect endpoint, will use data from cache (may lack taxonomy data)`);
      endpointBase = null;
    }
    
    // 🔥 STEP 3: Batch fetch raw post data for profiles (only what we need)
    // Instead of fetching ALL profiles, we'll fetch only the ones we have in our list
    const rawProfileMap = new Map<number, any>();
    const rawProfileMapByString = new Map<string, any>();
    
    try {
      if (endpointBase && profiles.length > 0) {
        console.log(`[school-profiles] Batch fetching raw post data for ${profiles.length} profiles...`);
        
        // Strategy: Fetch in batches by ID to get _embedded taxonomy data
        // WordPress REST API supports include parameter to fetch specific posts
        const BATCH_SIZE = 50; // WordPress REST API limit
        const profileIds = profiles.map(p => p.id).filter(id => id > 0);
        
        for (let i = 0; i < profileIds.length; i += BATCH_SIZE) {
          const batchIds = profileIds.slice(i, i + BATCH_SIZE);
          const includeParam = batchIds.join(',');
          
          let endpoint: string;
          if (endpointBase === 'unified') {
            // Unified endpoint might not support include parameter, so try standard profile endpoint
            // Try 'profile' first, then 'school_profile' as fallback
            endpoint = `${wpBaseUrl}/wp-json/wp/v2/profile?include=${includeParam}&per_page=${BATCH_SIZE}&_embed&acf_format=standard`;
          } else {
            endpoint = `${wpBaseUrl}/wp-json/wp/v2/${endpointBase}?include=${includeParam}&per_page=${BATCH_SIZE}&_embed&acf_format=standard`;
          }
          
          try {
            const response = await fetch(endpoint, {
              headers: { Accept: 'application/json' }
            });
            
            if (response.ok) {
              const batchData = await response.json();
              if (Array.isArray(batchData)) {
                batchData.forEach((post: any) => {
                  const id = Number(post?.id ?? post?.ID ?? 0);
                  const idString = String(post?.id ?? post?.ID ?? '');
                  if (id) {
                    rawProfileMap.set(id, post);
                    rawProfileMapByString.set(idString, post);
                  }
                });
                console.log(`[school-profiles] Fetched batch ${Math.floor(i / BATCH_SIZE) + 1}, ${batchData.length} profiles`);
              }
            } else {
              // If profile endpoint fails and we're using unified, try school_profile
              if (endpointBase === 'unified' && response.status === 404) {
                const fallbackEndpoint = `${wpBaseUrl}/wp-json/wp/v2/school_profile?include=${includeParam}&per_page=${BATCH_SIZE}&_embed&acf_format=standard`;
                try {
                  const fallbackResponse = await fetch(fallbackEndpoint, {
                    headers: { Accept: 'application/json' }
                  });
                  if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    if (Array.isArray(fallbackData)) {
                      fallbackData.forEach((post: any) => {
                        const id = Number(post?.id ?? post?.ID ?? 0);
                        const idString = String(post?.id ?? post?.ID ?? '');
                        if (id) {
                          rawProfileMap.set(id, post);
                          rawProfileMapByString.set(idString, post);
                        }
                      });
                      console.log(`[school-profiles] Fetched batch ${Math.floor(i / BATCH_SIZE) + 1} via fallback endpoint, ${fallbackData.length} profiles`);
                    }
                  } else {
                    console.warn(`[school-profiles] Batch fetch failed (status ${response.status}), will try individual fetches`);
                  }
                } catch (fallbackError) {
                  console.warn(`[school-profiles] Fallback endpoint also failed:`, fallbackError);
                }
              } else {
                console.warn(`[school-profiles] Batch fetch failed (status ${response.status}), will try individual fetches`);
              }
            }
          } catch (error) {
            console.warn(`[school-profiles] Batch fetch error for batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
          }
          
          // Small delay between batches
          if (i + BATCH_SIZE < profileIds.length) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
        
        console.log(`[school-profiles] ✅ Batch fetch complete: ${rawProfileMap.size} profiles with raw data`);
      } else {
        console.warn(`[school-profiles] ⚠️  No endpoint or no profiles, skipping raw data fetch`);
      }
    } catch (error) {
      console.error('[school-profiles] ❌ Error during batch fetch:', error);
      // Continue with what we have - don't fail the entire request
    }

    // 🔥 STEP 4: For missing profiles, try individual fetch (fallback)
    const missingProfiles = profiles.filter(p => {
      return !rawProfileMap.has(p.id) && !rawProfileMapByString.has(String(p.id));
    });

    if (missingProfiles.length > 0) {
      console.log(`[school-profiles] ⚠️  Found ${missingProfiles.length} missing profiles (${Math.round(missingProfiles.length / profiles.length * 100)}%), starting fallback mechanism...`);
      
      // Only fetch missing profiles individually (limit to avoid timeout)
      const MAX_FALLBACK = 20; // Limit fallback to prevent timeout
      const profilesToFetch = missingProfiles.slice(0, MAX_FALLBACK);
      
      if (profilesToFetch.length < missingProfiles.length) {
        console.warn(`[school-profiles] ⚠️  Limiting fallback to ${MAX_FALLBACK} profiles (${missingProfiles.length - MAX_FALLBACK} will be marked as unresolved)`);
      }
      
      // Process missing profiles with fallback (limit concurrent requests)
      const BATCH_SIZE = 5;
      for (let i = 0; i < profilesToFetch.length; i += BATCH_SIZE) {
        const batch = profilesToFetch.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          batch.map(profile => fetchMissingProfile(wpBaseUrl, profile, endpointBase || 'profile'))
        );

        results.forEach((result, index) => {
          const profile = batch[index];
          if (result.post && result.foundBy !== 'none') {
            // Add to map
            rawProfileMap.set(profile.id, result.post);
            rawProfileMapByString.set(String(profile.id), result.post);
            
            console.log(`[school-profiles] ✅ Found profile ${profile.id} (${profile.title}) via ${result.foundBy}`);
          } else {
            console.warn(`[school-profiles] ❌ Could not find profile ${profile.id} (${profile.title})`);
          }
        });

        // Small delay between batches to avoid overwhelming the server
        if (i + BATCH_SIZE < profilesToFetch.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    // Get all templates from database
    const templates = await prisma.schoolFormTemplate.findMany({
      select: {
        id: true,
        schoolId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        fieldsData: true
      }
    });

    // Build mapping: WordPress profile ID -> Template
    const templateMap = new Map<string, typeof templates[0] | null>();
    
    templates.forEach(template => {
      const parsed = parseWordPressTemplateId(template.schoolId);
      if (parsed) {
        const key = `${parsed.type}-${parsed.id}`;
        templateMap.set(key, template);
      }
    });

    // Group profiles by profile_type taxonomy (using slug)
    // Add 'unresolved_raw' group for profiles that couldn't be classified
    const groupedProfiles: Record<string, Array<WordPressSchool & {
      templateId?: string;
      template?: typeof templates[0] | null;
      hasTemplate: boolean;
      templateStatus: 'pending' | 'created';
      profileType: string;
      profileTypeSlug?: string | null;
      unresolvedReason?: string;
    }>> = {
      '国际学校': [],
      '本地中学': [],
      '本地小学': [],
      '幼稚园': [],
      'unresolved_raw': []
    };

    // Process profiles - use raw data directly if available
    const processedProfiles = profiles.map((profile) => {
      // Extract profile_type slug from raw WordPress data
      let rawPost = rawProfileMap.get(profile.id) || rawProfileMapByString.get(String(profile.id));
      
      let profileTypeSlug: string | null = null;
      let unresolvedReason: string | undefined;
      let foundBy: 'id' | 'slug' | 'search' | 'none' | 'paginated' = 'paginated';

      if (rawPost) {
        // Check taxonomy visibility
        const taxonomyCheck = checkTaxonomyVisibility(rawPost);
        
        profileTypeSlug = extractProfileTypeSlug(rawPost);
        
        // Debug logging
        if (!profileTypeSlug) {
          console.warn(`[school-profiles] ⚠️  Profile ${profile.id} (${profile.title}): No profile_type slug found in raw post`, {
            profileId: profile.id,
            title: profile.title,
            taxonomyVisible: taxonomyCheck.visible,
            hasEmbedded: taxonomyCheck.hasEmbedded,
            hasTerms: taxonomyCheck.hasTerms,
            embeddedTerms: rawPost._embedded?.['wp:term'],
            profileType: rawPost.profile_type,
            acfProfileType: rawPost.acf?.profile_type
          });
        }
      } else {
        // Profile not found even after fallback
        unresolvedReason = 'raw not found after id/slug/search';
        console.error(`[school-profiles] ❌ CRITICAL: Cannot determine profile_type for profile ${profile.id} (${profile.title}). No raw post data available.`, {
          profileId: profile.id,
          title: profile.title,
          attempted: ['id', 'slug', 'search'],
          reason: unresolvedReason
        });
      }

      // Map slug to category (returns 'unresolved_raw' if slug is null)
      const profileType = mapSlugToCategory(profileTypeSlug);

      // Find associated template
      const key = `profile-${profile.id}`;
      const template = templateMap.get(key) || null;
      const templateId = template ? template.id : undefined;
      const hasTemplate = !!template;
      const templateStatus: 'pending' | 'created' = hasTemplate ? 'created' : 'pending';

      return {
        ...profile,
        templateId,
        template,
        hasTemplate,
        templateStatus,
        profileType,
        profileTypeSlug: profileTypeSlug || null,
        unresolvedReason
      };
    });

    // Group processed profiles
    processedProfiles.forEach((profileWithTemplate) => {
      const profileType = profileWithTemplate.profileType;
      if (groupedProfiles[profileType]) {
        groupedProfiles[profileType].push(profileWithTemplate);
      } else {
        // If profile_type doesn't match any known category, add to unresolved_raw
        groupedProfiles['unresolved_raw'].push(profileWithTemplate);
      }
    });

    // Sort each group by title
    Object.keys(groupedProfiles).forEach(key => {
      groupedProfiles[key].sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'));
    });

    // Log statistics
    const unresolvedCount = groupedProfiles['unresolved_raw'].length;
    if (unresolvedCount > 0) {
      console.warn(`[school-profiles] ⚠️  ${unresolvedCount} profiles could not be classified and are marked as unresolved_raw`);
    }

    const duration = Date.now() - startTime;
    console.log(`[school-profiles] ✅ Classification complete in ${duration}ms:`, {
      total: profiles.length,
      fromCache,
      rawDataCount: rawProfileMap.size,
      byType: Object.keys(groupedProfiles).reduce((acc, key) => {
        acc[key] = groupedProfiles[key].length;
        return acc;
      }, {} as Record<string, number>)
    });

    return res.status(200).json({
      success: true,
      profiles: groupedProfiles,
      stats: {
        total: profiles.length,
        withTemplate: Array.from(templateMap.values()).filter(Boolean).length,
        withoutTemplate: profiles.length - Array.from(templateMap.values()).filter(Boolean).length,
        byType: Object.keys(groupedProfiles).reduce((acc, key) => {
          acc[key] = groupedProfiles[key].length;
          return acc;
        }, {} as Record<string, number>),
        unresolved: unresolvedCount
      }
    });
  } catch (error: any) {
    console.error('[API /wordpress/school-profiles] Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch school profiles',
      message: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
    });
  }
}
