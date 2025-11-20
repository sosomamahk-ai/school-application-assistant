/**
 * WordPress环境检测工具
 * 用于检测应用是否在WordPress iframe中运行
 */

/**
 * 检测是否在WordPress iframe环境中
 * 通过检查window.self !== window.top来判断是否在iframe中
 * 也可以通过URL参数或referrer来判断
 */
export function isWordPressEnvironment(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // 方法1: 检查是否在iframe中
  try {
    if (window.self !== window.top) {
      return true;
    }
  } catch (e) {
    // 跨域情况下会抛出异常，这也说明在iframe中
    return true;
  }

  // 方法2: 检查URL参数
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('wp_embed') === 'true' || urlParams.get('wp_iframe') === 'true') {
    return true;
  }

  // 方法3: 检查referrer（如果是从WordPress网站加载的）
  if (typeof document !== 'undefined' && document.referrer) {
    const referrer = document.referrer.toLowerCase();
    if (referrer.includes('wordpress') || referrer.includes('wp-admin')) {
      return true;
    }
  }

  return false;
}

/**
 * 获取WordPress环境参数
 */
export function getWordPressParams(): {
  wp_email?: string;
  wp_name?: string;
  wp_id?: string;
} {
  if (typeof window === 'undefined') {
    return {};
  }

  const urlParams = new URLSearchParams(window.location.search);
  return {
    wp_email: urlParams.get('wp_email') || undefined,
    wp_name: urlParams.get('wp_name') || undefined,
    wp_id: urlParams.get('wp_id') || undefined,
  };
}

