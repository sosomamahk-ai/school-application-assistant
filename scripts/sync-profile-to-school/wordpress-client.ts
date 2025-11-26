/**
 * WordPress REST API 客户端
 * 支持多种认证方式、重试机制和错误处理
 */

import fetch, { Response } from 'node-fetch';
import { SyncConfig, AuthConfig } from './config';
import { WordPressPostWithTerms } from './types';

export class WordPressClient {
  private config: SyncConfig;
  private baseUrl: string;

  constructor(config: SyncConfig) {
    this.config = config;
    this.baseUrl = config.wpBaseUrl;
  }

  /**
   * 构建请求头（包含认证信息）
   */
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    switch (this.config.auth.type) {
      case 'basic':
        if (this.config.auth.username && this.config.auth.password) {
          const credentials = Buffer.from(
            `${this.config.auth.username}:${this.config.auth.password}`
          ).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
        }
        break;
      
      case 'bearer':
        if (this.config.auth.token) {
          headers['Authorization'] = `Bearer ${this.config.auth.token}`;
        }
        break;
      
      case 'wp-app-password':
        if (this.config.auth.username && this.config.auth.appPassword) {
          const credentials = Buffer.from(
            `${this.config.auth.username}:${this.config.auth.appPassword}`
          ).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
        }
        break;
      
      case 'none':
      default:
        // 无需认证
        break;
    }

    return headers;
  }

  /**
   * 带重试的请求函数（指数退避）
   */
  private async fetchWithRetry(
    url: string,
    options: any,
    retryCount = 0
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 如果是认证错误，不重试
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }

      // 如果是服务器错误，可以重试
      if (response.status >= 500 && retryCount < this.config.maxRetries) {
        const delay = this.config.retryDelay * Math.pow(2, retryCount);
        console.warn(
          `Server error ${response.status}, retrying in ${delay}ms (attempt ${retryCount + 1}/${this.config.maxRetries})`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, retryCount + 1);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);

      // 如果是超时或网络错误，可以重试
      if (
        (error.name === 'AbortError' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') &&
        retryCount < this.config.maxRetries
      ) {
        const delay = this.config.retryDelay * Math.pow(2, retryCount);
        console.warn(
          `Network error: ${error.message}, retrying in ${delay}ms (attempt ${retryCount + 1}/${this.config.maxRetries})`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * 获取单个 post
   * @returns Post 数据，如果不存在（404）则返回 null
   */
  async getPost(id: number): Promise<WordPressPostWithTerms | null> {
    const url = `${this.baseUrl}${this.config.wpApiProfileEndpoint}/${id}?_embed`;
    
    try {
      const response = await this.fetchWithRetry(url, {
        method: 'GET',
        headers: this.buildHeaders(),
      });

      const data = await response.json() as WordPressPostWithTerms;
      return data;
    } catch (error: any) {
      // 如果是 404 错误，返回 null 而不是抛出错误
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        return null;
      }
      throw new Error(`Failed to fetch post ${id}: ${error.message}`);
    }
  }

  /**
   * 获取所有 posts（支持分页）
   */
  async getAllPosts(): Promise<WordPressPostWithTerms[]> {
    const allPosts: WordPressPostWithTerms[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const url = `${this.baseUrl}${this.config.wpApiProfileEndpoint}?page=${page}&per_page=${this.config.batchSize}&_embed`;
      
      try {
        const response = await this.fetchWithRetry(url, {
          method: 'GET',
          headers: this.buildHeaders(),
        });

        const posts = await response.json() as WordPressPostWithTerms[];
        
        if (!Array.isArray(posts) || posts.length === 0) {
          hasMore = false;
        } else {
          allPosts.push(...posts);
          
          // 检查是否有下一页
          const totalPages = parseInt(
            response.headers.get('X-WP-TotalPages') || '1',
            10
          );
          hasMore = page < totalPages;
          page++;
        }
      } catch (error: any) {
        if (error.message.includes('Authentication failed')) {
          throw error; // 认证错误不重试
        }
        
        console.error(`Error fetching page ${page}:`, error.message);
        
        // 如果获取失败，尝试继续下一页（可能是最后一页）
        if (page > 1) {
          hasMore = false;
        } else {
          throw error;
        }
      }
    }

    return allPosts;
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const url = `${this.baseUrl}/wp-json/wp/v2`;
      const response = await this.fetchWithRetry(url, {
        method: 'GET',
        headers: this.buildHeaders(),
      });

      if (response.ok) {
        return {
          success: true,
          message: 'WordPress REST API 连接成功',
        };
      } else {
        return {
          success: false,
          message: `WordPress REST API 返回错误: ${response.status} ${response.statusText}`,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `连接失败: ${error.message}`,
      };
    }
  }

  /**
   * 获取所有 post IDs（轻量查询，只获取 ID）
   * 用于抽样模式
   */
  async getAllPostIds(): Promise<number[]> {
    const allIds: number[] = [];
    let page = 1;
    let hasMore = true;
    const maxPerPage = 100; // WordPress REST API 通常最大支持 100

    while (hasMore) {
      // 使用轻量查询，只获取 id 字段
      const url = `${this.baseUrl}${this.config.wpApiProfileEndpoint}?page=${page}&per_page=${maxPerPage}&_fields=id`;
      
      try {
        const response = await this.fetchWithRetry(url, {
          method: 'GET',
          headers: this.buildHeaders(),
        });

        const posts = await response.json() as Array<{ id: number }>;
        
        if (!Array.isArray(posts) || posts.length === 0) {
          hasMore = false;
        } else {
          allIds.push(...posts.map(p => p.id));
          
          // 检查是否有下一页
          const totalPages = parseInt(
            response.headers.get('X-WP-TotalPages') || '1',
            10
          );
          hasMore = page < totalPages;
          page++;
        }
      } catch (error: any) {
        if (error.message.includes('Authentication failed')) {
          throw error;
        }
        
        console.error(`Error fetching post IDs at page ${page}:`, error.message);
        
        if (page > 1) {
          hasMore = false;
        } else {
          throw error;
        }
      }
    }

    return allIds;
  }

  /**
   * 随机抽样 post IDs
   */
  async samplePostIds(sampleSize: number): Promise<{ sampledIds: number[]; totalAvailable: number }> {
    const allIds = await this.getAllPostIds();
    const totalAvailable = allIds.length;
    
    if (totalAvailable === 0) {
      throw new Error('No posts available to sample');
    }
    
    if (sampleSize >= totalAvailable) {
      // 如果抽样数量大于等于总数，返回所有 IDs
      return {
        sampledIds: allIds,
        totalAvailable,
      };
    }
    
    // Fisher-Yates shuffle 算法打乱数组，然后取前 sampleSize 个
    const shuffled = [...allIds];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return {
      sampledIds: shuffled.slice(0, sampleSize),
      totalAvailable,
    };
  }

  /**
   * 验证端点是否存在
   */
  async validateEndpoint(): Promise<{ exists: boolean; message: string }> {
    try {
      const url = `${this.baseUrl}${this.config.wpApiProfileEndpoint}?per_page=1`;
      const response = await this.fetchWithRetry(url, {
        method: 'GET',
        headers: this.buildHeaders(),
      });

      if (response.ok) {
        return {
          exists: true,
          message: 'Profile endpoint 可访问',
        };
      } else if (response.status === 404) {
        return {
          exists: false,
          message: 'Profile endpoint 不存在（404），请检查 post type 是否已注册到 REST API',
        };
      } else {
        return {
          exists: false,
          message: `Profile endpoint 返回错误: ${response.status} ${response.statusText}`,
        };
      }
    } catch (error: any) {
      return {
        exists: false,
        message: `无法访问 profile endpoint: ${error.message}`,
      };
    }
  }
}

