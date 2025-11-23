import type { NextApiRequest, NextApiResponse } from 'next';
import { getWordPressSchools } from '@/services/wordpressSchoolService';
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
    
    // Get WordPress schools (for basic info)
    const wordPressData = await getWordPressSchools({ forceRefresh });
    const profiles = wordPressData.profiles || [];

    // Get raw WordPress data directly from API to extract profile_type slug
    const baseUrl = process.env.WORDPRESS_BASE_URL || process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL;
    if (!baseUrl) {
      return res.status(500).json({
        error: 'WordPress base URL is not configured'
      });
    }

    const wpBaseUrl = baseUrl.replace(/\/+$/, '');
    let rawProfiles: any[] = [];
    
    // Auto-detect endpoint
    let endpointBase = await detectProfileEndpoint(wpBaseUrl);
    if (!endpointBase) {
      // If auto-detection fails, fall back to using data from getWordPressSchools
      // but we won't have raw post data with _embedded taxonomy
      console.warn(`[school-profiles] ⚠️  Could not detect endpoint, will use data from getWordPressSchools (may lack taxonomy data)`);
      endpointBase = null;
    }
    
    try {
      // 🔥 STEP 1: Paginated fetch ALL profile posts with _embed
      console.log(`[school-profiles] Starting paginated fetch from ${wpBaseUrl}...`);
      
      let page = 1;
      let totalPages = 1;
      const allRawProfiles: any[] = [];
      
      if (endpointBase === 'unified') {
        // Use unified endpoint
        const unifiedEndpoint = `${wpBaseUrl}/wp-json/schools/v1/list`;
        const response = await fetch(unifiedEndpoint, {
          headers: { Accept: 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Unified endpoint may return different structure
          if (data?.profiles && Array.isArray(data.profiles)) {
            allRawProfiles.push(...data.profiles);
            console.log(`[school-profiles] ✅ Fetched ${data.profiles.length} profiles from unified endpoint`);
          } else if (Array.isArray(data)) {
            allRawProfiles.push(...data);
            console.log(`[school-profiles] ✅ Fetched ${data.length} profiles from unified endpoint`);
          }
        } else {
          throw new Error(`Unified endpoint returned ${response.status}: ${response.statusText}`);
        }
      } else if (endpointBase) {
        // Use standard REST API endpoint
        // First request to get total pages
        let firstEndpoint = `${wpBaseUrl}/wp-json/wp/v2/${endpointBase}?per_page=100&page=1&_embed&acf_format=standard`;
        let firstResponse = await fetch(firstEndpoint, {
          headers: { Accept: 'application/json' }
        });

        if (!firstResponse.ok) {
          const errorText = await firstResponse.text().catch(() => 'Unknown error');
          console.error(`[school-profiles] WordPress API error:`, {
            status: firstResponse.status,
            statusText: firstResponse.statusText,
            endpoint: firstEndpoint,
            errorText: errorText.substring(0, 200)
          });
          throw new Error(`WordPress API returned ${firstResponse.status}: ${firstResponse.statusText}. Endpoint: ${firstEndpoint}`);
        }

        const firstPageData = await firstResponse.json();
        if (Array.isArray(firstPageData) && firstPageData.length > 0) {
          allRawProfiles.push(...firstPageData);
          
          const totalPagesHeader = firstResponse.headers.get('X-WP-TotalPages');
          totalPages = totalPagesHeader ? Number(totalPagesHeader) : 1;
          
          console.log(`[school-profiles] Fetched page 1/${totalPages}, ${firstPageData.length} profiles`);
          console.log(`[school-profiles] Total pages to fetch: ${totalPages}`);
          
          // Fetch remaining pages
          page = 2;
          while (page <= totalPages) {
            const endpoint = `${wpBaseUrl}/wp-json/wp/v2/${endpointBase}?per_page=100&page=${page}&_embed&acf_format=standard`;
            const response = await fetch(endpoint, {
              headers: { Accept: 'application/json' }
            });
            
            if (response.ok) {
              const pageData = await response.json();
              if (Array.isArray(pageData) && pageData.length > 0) {
                allRawProfiles.push(...pageData);
                console.log(`[school-profiles] Fetched page ${page}/${totalPages}, ${pageData.length} profiles`);
                page++;
              } else {
                break;
              }
            } else {
              console.error(`[school-profiles] Failed to fetch page ${page}: ${response.status} ${response.statusText}`);
              break;
            }
          }
        }
      } else {
        // No endpoint found - use data from getWordPressSchools but without raw taxonomy data
        console.warn(`[school-profiles] ⚠️  No REST API endpoint available, using processed data from getWordPressSchools`);
        // We'll continue with empty rawProfiles and rely on fallback mechanisms
      }
      
      rawProfiles = allRawProfiles;
      console.log(`[school-profiles] ✅ Paginated fetch complete: ${rawProfiles.length} total profiles`);
    } catch (error) {
      console.error('[school-profiles] ❌ Failed to fetch raw WordPress data:', error);
      return res.status(500).json({
        error: 'Failed to fetch WordPress profiles',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Create a map of profile ID to raw WordPress post data
    const rawProfileMap = new Map<number, any>();
    const rawProfileMapByString = new Map<string, any>();
    
    rawProfiles.forEach((post: any) => {
      const id = Number(post?.id ?? post?.ID ?? 0);
      const idString = String(post?.id ?? post?.ID ?? '');
      if (id) {
        rawProfileMap.set(id, post);
      }
      if (idString) {
        rawProfileMapByString.set(idString, post);
      }
    });

    console.log(`[school-profiles] Built raw profile map: ${rawProfileMap.size} entries`);

    // 🔥 STEP 2: Identify missing profiles and apply fallback mechanism
    const missingProfiles = profiles.filter(p => {
      return !rawProfileMap.has(p.id) && !rawProfileMapByString.has(String(p.id));
    });

    if (missingProfiles.length > 0) {
      console.log(`[school-profiles] ⚠️  Found ${missingProfiles.length} missing profiles, starting fallback mechanism...`);
      
      // Process missing profiles with fallback (limit concurrent requests)
      const BATCH_SIZE = 5;
      for (let i = 0; i < missingProfiles.length; i += BATCH_SIZE) {
        const batch = missingProfiles.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          batch.map(profile => fetchMissingProfile(wpBaseUrl, profile, endpointBase || 'profile'))
        );

        results.forEach((result, index) => {
          const profile = batch[index];
          if (result.post && result.foundBy !== 'none') {
            // Add to map
            rawProfileMap.set(profile.id, result.post);
            rawProfileMapByString.set(String(profile.id), result.post);
            
            console.log(`[school-profiles] ✅ Found profile ${profile.id} (${profile.title}) via ${result.foundBy}`, {
              profileId: profile.id,
              title: profile.title,
              foundBy: result.foundBy,
              attempted: result.attempted,
              statuses: result.statuses
            });
          } else {
            console.warn(`[school-profiles] ❌ Could not find profile ${profile.id} (${profile.title})`, {
              profileId: profile.id,
              title: profile.title,
              attempted: result.attempted,
              statuses: result.statuses
            });
          }
        });

        // Small delay between batches to avoid overwhelming the server
        if (i + BATCH_SIZE < missingProfiles.length) {
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

    console.log(`[school-profiles] ✅ Classification complete:`, {
      total: profiles.length,
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
