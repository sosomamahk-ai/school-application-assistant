import type {
  WordPressSchool,
  WordPressSchoolResponse,
  WordPressSchoolCategory,
  WordPressSchoolType
} from '@/types/wordpress';

type FetchOptions = {
  baseUrl?: string;
};

const DEFAULT_CACHE_TTL = Number(process.env.NEXT_PUBLIC_WORDPRESS_SCHOOL_CACHE_TTL ?? 5 * 60 * 1000);
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
  const fromAcf = post?.acf?.logo;
  if (typeof fromAcf === 'string') {
    return fromAcf;
  }
  if (fromAcf?.url) {
    return fromAcf.url;
  }
  const embedded = post?._embedded?.['wp:featuredmedia'];
  if (Array.isArray(embedded) && embedded[0]?.source_url) {
    return embedded[0].source_url;
  }
  if (post?.featured_media_url) {
    return post.featured_media_url;
  }
  return null;
};

const toWordPressSchool = (post: any, type: WordPressSchoolType): WordPressSchool => {
  const title = sanitizeHtml(post?.title?.rendered ?? post?.title ?? '');
  const categorySource =
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
    acf: typeof post?.acf === 'object' && post?.acf !== null ? post.acf : {}
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
    const response = await fetch(`${baseUrl}${WORDPRESS_UNIFIED_ENDPOINT}`, {
      headers: { Accept: 'application/json' }
    });
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`WordPress unified endpoint responded with ${response.status}`);
    }
    const payload = await response.json();
    return normalizeUnifiedPayload(payload);
  } catch (error) {
    console.warn('[wordpressSchoolService] Unified endpoint fetch failed', error);
    return null;
  }
};

const fetchCollection = async (baseUrl: string, type: WordPressSchoolType): Promise<WordPressSchool[]> => {
  const results: WordPressSchool[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= MAX_PAGES) {
    const endpoint = `${baseUrl}/wp-json/wp/v2/${type}?per_page=100&page=${page}&_embed`;
    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json' }
    });

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
  if (!cache) return false;
  return cache.expiresAt > Date.now();
};

const setCache = (data: WordPressSchoolResponse) => {
  cache = {
    data,
    expiresAt: Date.now() + DEFAULT_CACHE_TTL
  };
};

const fetchViaProxy = async (forceRefresh?: boolean): Promise<WordPressSchoolResponse> => {
  const url = `/api/wordpress/schools${forceRefresh ? '?refresh=true' : ''}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' }
  });
  if (!response.ok) {
    throw new Error(`Proxy API responded with ${response.status}`);
  }
  return response.json();
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
      const unified = await tryFetchUnifiedEndpoint(baseUrl);
      const data = unified ?? (await fetchWithFallback(baseUrl));
      setCache(data);
      return data;
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


