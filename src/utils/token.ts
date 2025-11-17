/**
 * Utilities for managing JWT tokens across client & server.
 */

export function setAuthTokenCookie(token: string, maxAgeSeconds = 60 * 60 * 24 * 7) {
  if (typeof document === 'undefined') return;
  const secureFlag = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `token=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secureFlag}`;
}

export function clearAuthTokenCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'token=; Path=/; Max-Age=0; SameSite=Lax';
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

