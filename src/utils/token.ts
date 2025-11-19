/**
 * Utilities for managing JWT tokens across client & server.
 */

function resolveCookieAttributes() {
  if (typeof window === 'undefined') {
    return { sameSite: 'Lax', secure: '' };
  }

  let isEmbedded = false;
  try {
    // 如果跨域嵌入，访问 window.top 可能抛出异常
    isEmbedded = window.self !== window.top;
  } catch {
    isEmbedded = true;
  }
  const mustBeSecure = window.location.protocol === 'https:';

  if (isEmbedded) {
    // 在第三方 iframe 中需要 SameSite=None 且必须 Secure
    return { sameSite: 'None', secure: '; Secure' };
  }

  return { sameSite: 'Lax', secure: mustBeSecure ? '; Secure' : '' };
}

export function setAuthTokenCookie(token: string, maxAgeSeconds = 60 * 60 * 24 * 7) {
  if (typeof document === 'undefined') return;
  const { sameSite, secure } = resolveCookieAttributes();
  document.cookie = `token=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=${sameSite}${secure}`;
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

