import { SyncConfig } from './config';

export type PostTypeKey = 'profile' | 'university';

const DEFAULT_ENDPOINTS: Record<PostTypeKey, string> = {
  profile: '/wp-json/wp/v2/profile',
  university: '/wp-json/wp/v2/university',
};

/**
 * 根据 postType 构建配置（endpoint + postType）
 */
export function buildPostTypeConfig(baseConfig: SyncConfig, postType: PostTypeKey): SyncConfig {
  const config: SyncConfig = {
    ...baseConfig,
  };

  config.wpPostType = postType;

  const envEndpoint =
    postType === 'profile'
      ? process.env.WP_API_PROFILE_ENDPOINT
      : process.env.WP_API_UNIVERSITY_ENDPOINT;
  if (envEndpoint) {
    config.wpApiProfileEndpoint = envEndpoint;
    return config;
  }

  if (postType === 'profile') {
    config.wpApiProfileEndpoint = baseConfig.wpApiProfileEndpoint || DEFAULT_ENDPOINTS.profile;
    return config;
  }

  // For university, try to derive from profile endpoint if possible
  const profileEndpoint = baseConfig.wpApiProfileEndpoint || DEFAULT_ENDPOINTS.profile;
  const derived = profileEndpoint
    .replace(/profile(s)?/i, 'university$1')
    .replace(/school-profile/gi, 'university');

  config.wpApiProfileEndpoint = derived || DEFAULT_ENDPOINTS.university;
  return config;
}

