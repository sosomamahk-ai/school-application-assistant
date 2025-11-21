import type {
  WordPressSchool,
  WordPressSchoolResponse,
  WordPressSchoolCategory,
  WordPressSchoolType
} from '@/types/wordpress';

type FetchOptions = {
  baseUrl?: string;
};

// 增加缓存时间到 30 分钟，减少服务器压力
const DEFAULT_CACHE_TTL = Number(process.env.NEXT_PUBLIC_WORDPRESS_SCHOOL_CACHE_TTL ?? 30 * 60 * 1000);
const MAX_PAGES = 10;
const WORDPRESS_UNIFIED_ENDPOINT = '/wp-json/schools/v1/list';

const CATEGORY_ALIASES: Record<string, WordPressSchoolCategory> = {
  kindergarten: '香港幼稚园',
  'hk-kindergarten': '香港幼稚园',
  nursery: '香港幼稚园',
  preschool: '香港幼稚园',
  primary: '香港本地小学',
  'hk-primary': '香港本地小学',
  elementary: '香港本地小学',
  secondary: '香港本地中学',
  middle: '香港本地中学',
  'hk-secondary': '香港本地中学',
  highschool: '香港本地中学',
  international: '香港国际学校',
  'hk-international': '香港国际学校',
  intl: '香港国际学校',
  university: '大学',
  college: '大学'
};

const FALLBACK_CATEGORY_BY_TYPE: Record<WordPressSchoolType, WordPressSchoolCategory> = {
  profile: '香港国际学校',
  university: '大学'
};

type CacheEntry = {
  data: WordPressSchoolResponse;
  expiresAt: number;
};

let cache: CacheEntry | null = null;
let inFlightPromise: Promise<WordPressSchoolResponse> | null = null;

// localStorage 缓存键
const STORAGE_KEY = 'wordpress_schools_cache';
const STORAGE_EXPIRY_KEY = 'wordpress_schools_cache_expiry';

// 从 localStorage 加载缓存
const loadFromStorage = (): WordPressSchoolResponse | null => {
  if (typeof window === 'undefined') return null;
  try {
    const expiry = localStorage.getItem(STORAGE_EXPIRY_KEY);
    if (!expiry) return null;
    const expiryTime = Number(expiry);
    if (Date.now() > expiryTime) {
      // 缓存已过期，清除
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_EXPIRY_KEY);
      return null;
    }
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached) as WordPressSchoolResponse;
    }
  } catch (error) {
    console.warn('[wordpressSchoolService] Failed to load from localStorage:', error);
    // 清除损坏的缓存
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_EXPIRY_KEY);
  }
  return null;
};

// 保存到 localStorage
const saveToStorage = (data: WordPressSchoolResponse, ttl: number) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(STORAGE_EXPIRY_KEY, String(Date.now() + ttl));
  } catch (error) {
    console.warn('[wordpressSchoolService] Failed to save to localStorage:', error);
    // localStorage 可能已满，尝试清除旧数据
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_EXPIRY_KEY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(STORAGE_EXPIRY_KEY, String(Date.now() + ttl));
    } catch (e) {
      console.error('[wordpressSchoolService] Failed to save to localStorage after cleanup:', e);
    }
  }
};

const EMPTY_RESPONSE: WordPressSchoolResponse = {
  profiles: [],
  universities: [],
  all: []
};

const sanitizeHtml = (value?: string | null): string => {
  if (!value) return '';
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const normalizeCategory = (value: string | null | undefined, type: WordPressSchoolType): WordPressSchoolCategory => {
  if (value) {
    const normalized = value.trim().toLowerCase();
    if (CATEGORY_ALIASES[normalized]) {
      return CATEGORY_ALIASES[normalized];
    }
    const exactMatch = (Object.values(CATEGORY_ALIASES) as WordPressSchoolCategory[]).find(
      (category) => category === value
    );
    if (exactMatch) {
      return exactMatch;
    }
  }
  return FALLBACK_CATEGORY_BY_TYPE[type];
};

const extractLogoUrl = (post: any): string | null => {
  // 1. Try ACF logo field first
  const fromAcf = post?.acf?.logo;
  if (typeof fromAcf === 'string') {
    return fromAcf;
  }
  if (fromAcf?.url) {
    return fromAcf.url;
  }
  
  // 2. Try _thumbnail_id meta key (WordPress featured image)
  const thumbnailId = post?.meta?._thumbnail_id || post?._thumbnail_id;
  if (thumbnailId) {
    // If we have embedded media, use it
    const embedded = post?._embedded?.['wp:featuredmedia'];
    if (Array.isArray(embedded) && embedded[0]?.source_url) {
      return embedded[0].source_url;
    }
    // If we have featured_media_url directly
    if (post?.featured_media_url) {
      return post.featured_media_url;
    }
    // If we have featured_media object with source_url
    if (post?.featured_media?.source_url) {
      return post.featured_media.source_url;
    }
  }
  
  // 3. Fallback to embedded featured media
  const embedded = post?._embedded?.['wp:featuredmedia'];
  if (Array.isArray(embedded) && embedded[0]?.source_url) {
    return embedded[0].source_url;
  }
  if (post?.featured_media_url) {
    return post.featured_media_url;
  }
  
  return null;
};

const normalizeAcf = (acfValue: any): Record<string, any> => {
  if (!acfValue) return {};
  if (Array.isArray(acfValue)) {
    return {};
  }
  if (typeof acfValue === 'object') {
    return acfValue;
  }
  return {};
};

const extractProfileType = (post: any): string | null => {
  // Try to get profile_type from taxonomy terms
  // WordPress REST API can return taxonomy terms in different formats:
  
  // 1. Direct taxonomy field (if custom endpoint includes it)
  if (post?.profile_type) {
    if (typeof post.profile_type === 'string') {
      return post.profile_type;
    }
    if (Array.isArray(post.profile_type) && post.profile_type.length > 0) {
      const firstTerm = post.profile_type[0];
      return typeof firstTerm === 'string' ? firstTerm : firstTerm?.name || firstTerm?.slug || null;
    }
    if (typeof post.profile_type === 'object' && post.profile_type.name) {
      return post.profile_type.name;
    }
  }
  
  // 2. From _embedded taxonomy terms
  const embeddedTerms = post?._embedded?.['wp:term'];
  if (Array.isArray(embeddedTerms)) {
    // Find profile_type taxonomy in embedded terms
    for (const termGroup of embeddedTerms) {
      if (Array.isArray(termGroup)) {
        for (const term of termGroup) {
          if (term?.taxonomy === 'profile_type' && term?.name) {
            return term.name;
          }
        }
      }
    }
  }
  
  // 3. From acf field
  if (post?.acf?.profile_type) {
    const acfValue = post.acf.profile_type;
    if (typeof acfValue === 'string') {
      return acfValue;
    }
    if (Array.isArray(acfValue) && acfValue.length > 0) {
      return typeof acfValue[0] === 'string' ? acfValue[0] : acfValue[0]?.name || null;
    }
    if (typeof acfValue === 'object' && acfValue.name) {
      return acfValue.name;
    }
  }
  
  return null;
};

const toWordPressSchool = (post: any, type: WordPressSchoolType): WordPressSchool => {
  const title = sanitizeHtml(post?.title?.rendered ?? post?.title ?? '');
  
  // First try to get profile_type from taxonomy
  const profileType = extractProfileType(post);
  
  // Then try other category sources
  const categorySource =
    profileType ||
    post?.category ||
    post?.categories ||
    post?.acf?.category ||
    post?.acf?.school_category ||
    post?.acf?.type ||
    post?.acf?.segment ||
    null;

  return {
    id: Number(post?.id ?? post?.ID ?? 0),
    title,
    type,
    category: normalizeCategory(categorySource, type),
    logo: extractLogoUrl(post),
    url: typeof post?.url === 'string' && post.url
      ? post.url
      : typeof post?.link === 'string' && post.link
        ? post.link
        : '',
    acf: normalizeAcf(post?.acf)
  };
};

const dedupeById = (schools: WordPressSchool[]): WordPressSchool[] => {
  const map = new Map<number, WordPressSchool>();
  schools.forEach((school) => {
    map.set(school.id, { ...map.get(school.id), ...school });
  });
  return Array.from(map.values());
};

const ensureBaseUrl = (options?: FetchOptions): string => {
  const raw =
    options?.baseUrl ??
    process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL ??
    process.env.WORDPRESS_BASE_URL;
  if (!raw) {
    throw new Error('WordPress base URL is not configured. Please set NEXT_PUBLIC_WORDPRESS_BASE_URL.');
  }
  return raw.replace(/\/+$/, '');
};

const normalizeUnifiedPayload = (payload: any): WordPressSchoolResponse => {
  if (!payload || typeof payload !== 'object') {
    return EMPTY_RESPONSE;
  }
  
  const normalizeArray = (items: any[], fallbackType: WordPressSchoolType): WordPressSchool[] =>
    (Array.isArray(items) ? items : []).map((item) =>
      toWordPressSchool(
        {
          ...item,
          title: { rendered: item?.title ?? item?.name ?? '' },
          acf: item?.acf ?? item
        },
        (item?.type as WordPressSchoolType) || fallbackType
      )
    );

  const profiles = normalizeArray(payload.profiles ?? [], 'profile');
  const universities = normalizeArray(payload.universities ?? [], 'university');
  const all = normalizeArray(
    payload.all ?? [...profiles, ...universities],
    'profile'
  );

  return {
    profiles,
    universities,
    all: dedupeById(all.length ? all : [...profiles, ...universities])
  };
};

const tryFetchUnifiedEndpoint = async (baseUrl: string): Promise<WordPressSchoolResponse | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
    
    const response = await fetch(`${baseUrl}${WORDPRESS_UNIFIED_ENDPOINT}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`WordPress unified endpoint responded with ${response.status}`);
    }
    const payload = await response.json();
    return normalizeUnifiedPayload(payload);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('[wordpressSchoolService] Unified endpoint fetch timed out');
    } else {
      console.warn('[wordpressSchoolService] Unified endpoint fetch failed', error);
    }
    return null;
  }
};

const fetchCollection = async (baseUrl: string, type: WordPressSchoolType): Promise<WordPressSchool[]> => {
  const results: WordPressSchool[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= MAX_PAGES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
      
      // _embed parameter includes taxonomy terms and featured media
      const endpoint = `${baseUrl}/wp-json/wp/v2/${type}?per_page=100&page=${page}&_embed&acf_format=standard`;
      const response = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`WordPress ${type} CPT responded with ${response.status}`);
      }

      const items = await response.json();
      if (!Array.isArray(items) || items.length === 0) {
        break;
      }
      items.forEach((item) => {
        results.push(toWordPressSchool(item, type));
      });

      const totalPagesHeader = response.headers.get('X-WP-TotalPages');
      totalPages = totalPagesHeader ? Number(totalPagesHeader) : totalPages;
      if (!Number.isFinite(totalPages) || totalPages < 1) {
        totalPages = 1;
      }

      page += 1;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error(`[wordpressSchoolService] ${type} fetch timed out at page ${page}`);
        throw new Error(`WordPress ${type} fetch timed out`);
      }
      console.error(`[wordpressSchoolService] ${type} fetch error at page ${page}:`, error);
      throw error;
    }
  }

  return results;
};

const fetchWithFallback = async (baseUrl: string): Promise<WordPressSchoolResponse> => {
  const [profiles, universities] = await Promise.all([
    fetchCollection(baseUrl, 'profile'),
    fetchCollection(baseUrl, 'university')
  ]);

  const all = dedupeById([...profiles, ...universities]);

  return {
    profiles,
    universities,
    all
  };
};

const shouldUseCache = (forceRefresh?: boolean) => {
  if (forceRefresh) return false;
  
  // 先检查内存缓存
  if (cache && cache.expiresAt > Date.now()) {
    return true;
  }
  
  // 再检查 localStorage 缓存（仅在浏览器环境）
  if (typeof window !== 'undefined') {
    const stored = loadFromStorage();
    if (stored) {
      // 恢复内存缓存
      cache = {
        data: stored,
        expiresAt: Date.now() + DEFAULT_CACHE_TTL
      };
      return true;
    }
  }
  
  return false;
};

const setCache = (data: WordPressSchoolResponse) => {
  cache = {
    data,
    expiresAt: Date.now() + DEFAULT_CACHE_TTL
  };
  
  // 同时保存到 localStorage（仅在浏览器环境）
  if (typeof window !== 'undefined') {
    saveToStorage(data, DEFAULT_CACHE_TTL);
  }
};

const fetchViaProxy = async (forceRefresh?: boolean): Promise<WordPressSchoolResponse> => {
  const url = `/api/wordpress/schools${forceRefresh ? '?refresh=true' : ''}`;
  try {
    // Add timeout for frontend requests (180 seconds for large data)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 180秒超时（3分钟）
    
    console.log('[wordpressSchoolService] Fetching via proxy:', url);
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    console.log('[wordpressSchoolService] Proxy response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Proxy API responded with ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    console.log('[wordpressSchoolService] Proxy response data:', {
      profilesCount: data.profiles?.length || 0,
      universitiesCount: data.universities?.length || 0,
      allCount: data.all?.length || 0
    });
    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      // Check if it was a timeout or manual abort
      const wasTimeout = error.message?.includes('timeout') || error.message?.includes('aborted');
      if (wasTimeout) {
        console.error('[wordpressSchoolService] Proxy fetch timed out after 180 seconds');
        throw new Error('请求超时。数据量较大，请稍后重试。如果问题持续，请联系管理员。');
      }
      // Otherwise, it might be HMR-related, don't throw error
      console.warn('[wordpressSchoolService] Proxy fetch was aborted (possibly due to HMR)');
      throw error;
    }
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      // This could be HMR-related or a real network error
      // Log it but don't throw a user-friendly error immediately
      console.warn('[wordpressSchoolService] Proxy fetch failed (may be HMR-related):', error);
      throw new Error('无法连接到服务器。请检查网络连接或服务器是否正在运行。');
    }
    console.error('[wordpressSchoolService] Proxy fetch error:', error);
    throw error;
  }
};

export const getWordPressSchools = async (
  options?: FetchOptions & { forceRefresh?: boolean }
): Promise<WordPressSchoolResponse> => {
  const { forceRefresh, ...rest } = options ?? {};

  // In browser environment, use our API proxy to avoid CORS issues
  if (typeof window !== 'undefined') {
    if (shouldUseCache(forceRefresh)) {
      return cache!.data;
    }
    if (!inFlightPromise) {
      inFlightPromise = fetchViaProxy(forceRefresh)
        .then((data) => {
          setCache(data);
          return data;
        })
        .catch((error) => {
          console.error('[wordpressSchoolService] Failed to load schools via proxy', error);
          throw error;
        })
        .finally(() => {
          inFlightPromise = null;
        });
    }
    return inFlightPromise;
  }

  // Server-side: directly fetch from WordPress
  if (shouldUseCache(forceRefresh)) {
    return cache!.data;
  }

  if (!inFlightPromise) {
    inFlightPromise = (async () => {
      const baseUrl = ensureBaseUrl(rest);
      console.log('[wordpressSchoolService] Server-side: fetching from', baseUrl);
      try {
        const unified = await tryFetchUnifiedEndpoint(baseUrl);
        if (unified) {
          console.log('[wordpressSchoolService] Server-side: got unified endpoint data');
          setCache(unified);
          return unified;
        }
        console.log('[wordpressSchoolService] Server-side: unified endpoint failed, using fallback');
        const data = await fetchWithFallback(baseUrl);
        console.log('[wordpressSchoolService] Server-side: fallback fetched', {
          profilesCount: data.profiles?.length || 0,
          universitiesCount: data.universities?.length || 0,
          allCount: data.all?.length || 0
        });
        setCache(data);
        return data;
      } catch (error) {
        console.error('[wordpressSchoolService] Server-side fetch error:', error);
        throw error;
      }
    })()
      .catch((error) => {
        console.error('[wordpressSchoolService] Failed to load schools', error);
        throw error;
      })
      .finally(() => {
        inFlightPromise = null;
      });
  }

  return inFlightPromise;
};

export const invalidateWordPressSchoolCache = () => {
  cache = null;
  inFlightPromise = null;
  
  // 清除 localStorage 缓存
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_EXPIRY_KEY);
    } catch (error) {
      console.warn('[wordpressSchoolService] Failed to clear localStorage cache:', error);
    }
  }
};

export const buildWordPressTemplateId = (school: WordPressSchool): string =>
  `wp-${school.type}-${school.id}`;

export const parseWordPressTemplateId = (
  value?: string | null
): { id: number; type: WordPressSchoolType } | null => {
  if (!value) return null;
  const trimmed = value.trim();
  const pattern = /^(?:wp-)?(profile|university)[-_]?(\d+)$/i;
  const matched = trimmed.match(pattern);
  if (matched) {
    return {
      type: matched[1].toLowerCase() as WordPressSchoolType,
      id: Number(matched[2])
    };
  }
  const numeric = trimmed.match(/^\d+$/);
  if (numeric) {
    return { type: 'profile', id: Number(trimmed) };
  }
  return null;
};

export const matchWordPressSchoolFromTemplate = (
  template: { schoolId?: string | null; schoolName?: string | { [key: string]: string } | null },
  schools: WordPressSchool[]
): WordPressSchool | null => {
  if (!schools.length) return null;
  if (template.schoolId) {
    const parsed = parseWordPressTemplateId(template.schoolId);
    if (parsed) {
      const matchedById = schools.find(
        (school) => school.id === parsed.id && school.type === parsed.type
      );
      if (matchedById) {
        return matchedById;
      }
    }
  }

  const nameCandidate = (() => {
    if (typeof template.schoolName === 'string') {
      return sanitizeHtml(template.schoolName);
    }
    if (template.schoolName && typeof template.schoolName === 'object') {
      const values = Object.values(template.schoolName)
        .map((val) => (typeof val === 'string' ? sanitizeHtml(val) : ''))
        .filter(Boolean);
      return values[0];
    }
    return '';
  })();

  if (nameCandidate) {
    const normalized = nameCandidate.toLowerCase();
    const matchedByName = schools.find((school) => school.title.toLowerCase() === normalized);
    if (matchedByName) {
      return matchedByName;
    }
  }

  return null;
};

export const groupWordPressSchoolsByCategory = (
  schools: WordPressSchool[]
): Record<string, WordPressSchool[]> => {
  return schools.reduce<Record<string, WordPressSchool[]>>((acc, school) => {
    const key = school.category || FALLBACK_CATEGORY_BY_TYPE[school.type];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(school);
    return acc;
  }, {});
};


