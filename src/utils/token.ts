/**
 * Utilities for managing JWT tokens across client & server.
 */

function resolveCookieAttributes() {
  if (typeof window === 'undefined') {
    return { sameSite: 'Lax', secure: '' };
  }

  let isEmbedded = false;
  let detectionMethod = 'none';
  
  try {
    // 方法 1: 检查 window.self !== window.top
    isEmbedded = window.self !== window.top;
    detectionMethod = 'window.self !== window.top';
  } catch (e) {
    // 方法 2: 如果访问 window.top 抛出异常，说明是跨域 iframe
    isEmbedded = true;
    detectionMethod = 'cross-origin exception';
  }

  // 方法 3: 检查 URL 参数（备用方案）
  if (!isEmbedded && typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('embed') === 'true' || urlParams.get('iframe') === 'true') {
      isEmbedded = true;
      detectionMethod = 'URL parameter';
    }
  }

  // 方法 4: 检查 referrer（如果来自 WordPress 域名）
  if (!isEmbedded && typeof document !== 'undefined' && document.referrer) {
    try {
      const referrerUrl = new URL(document.referrer);
      const currentUrl = new URL(window.location.href);
      // 如果 referrer 和当前域名不同，很可能是 iframe
      if (referrerUrl.origin !== currentUrl.origin) {
        isEmbedded = true;
        detectionMethod = 'referrer check (different origin)';
      }
      // 额外检查：如果 referrer 包含 WordPress 常见特征，强制认为是 iframe
      const referrerHost = referrerUrl.hostname.toLowerCase();
      const wordpressIndicators = [
        'wordpress.com',
        'wordpress.org',
        'wp-admin',
        'wp-content',
        'wp-includes'
      ];
      if (wordpressIndicators.some(indicator => referrerHost.includes(indicator))) {
        isEmbedded = true;
        detectionMethod = 'referrer check (WordPress detected)';
      }
    } catch (e) {
      // URL 解析失败，忽略
    }
  }

  // 方法 5: 检查是否有父窗口（即使 window.self === window.top，某些情况下仍可能是 iframe）
  if (!isEmbedded && typeof window !== 'undefined') {
    try {
      // 尝试访问 window.parent，如果抛出异常或不同，可能是 iframe
      if (window.parent && window.parent !== window.self) {
        isEmbedded = true;
        detectionMethod = 'window.parent check';
      }
    } catch (e) {
      // 跨域访问 window.parent 会抛出异常，说明是 iframe
      isEmbedded = true;
      detectionMethod = 'window.parent exception (cross-origin)';
    }
  }

  const mustBeSecure = window.location.protocol === 'https:';

  // 额外检查：如果 referrer 存在且与当前域名不同，强制认为是 iframe
  // 这是最可靠的检测方法，因为 WordPress iframe 一定会有不同的 referrer
  if (!isEmbedded && typeof document !== 'undefined' && document.referrer) {
    try {
      const referrerUrl = new URL(document.referrer);
      const currentUrl = new URL(window.location.href);
      if (referrerUrl.origin !== currentUrl.origin && referrerUrl.origin !== '') {
        isEmbedded = true;
        detectionMethod = 'referrer origin mismatch (most reliable)';
      }
    } catch (e) {
      // URL 解析失败，忽略
    }
  }

  // 调试日志
  if (typeof console !== 'undefined' && console.log) {
    console.log('[Cookie Debug] Detection:', {
      isEmbedded,
      detectionMethod,
      protocol: window.location.protocol,
      referrer: typeof document !== 'undefined' ? document.referrer : 'N/A',
      currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
      willUseSameSiteNone: isEmbedded,
      willUseSecure: isEmbedded || mustBeSecure
    });
  }

  if (isEmbedded) {
    // 在第三方 iframe 中需要 SameSite=None 且必须 Secure
    return { sameSite: 'None', secure: '; Secure' };
  }

  return { sameSite: 'Lax', secure: mustBeSecure ? '; Secure' : '' };
}

export function setAuthTokenCookie(token: string, maxAgeSeconds = 60 * 60 * 24 * 7) {
  if (typeof document === 'undefined') return;
  const { sameSite, secure } = resolveCookieAttributes();
  const cookieString = `token=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=${sameSite}${secure}`;
  
  // 调试日志
  if (typeof console !== 'undefined' && console.log) {
    console.log('[Cookie Debug] Setting cookie with attributes:', {
      sameSite,
      secure: secure ? 'Secure' : 'none',
      cookieString: cookieString.substring(0, 100) + '...' // 只显示前100个字符，不暴露完整 token
    });
  }
  
  document.cookie = cookieString;
  
  // 验证 cookie 是否设置成功
  setTimeout(() => {
    const setCookie = document.cookie.split(';').find(c => c.trim().startsWith('token='));
    if (typeof console !== 'undefined' && console.log) {
      console.log('[Cookie Debug] Cookie after setting:', setCookie ? '✅ Set successfully' : '❌ Failed to set');
    }
  }, 100);
}

export function clearAuthTokenCookie() {
  if (typeof document === 'undefined') return;
  const { sameSite, secure } = resolveCookieAttributes();
  document.cookie = `token=; Path=/; Max-Age=0; SameSite=${sameSite}${secure}`;
}

export function getTokenFromCookieHeader(cookieHeader?: string | null): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [rawKey, ...rest] = cookie.trim().split('=');
    if (!rawKey) continue;
    if (rawKey === 'token') {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}

