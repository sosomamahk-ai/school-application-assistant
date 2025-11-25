/**
 * 同步脚本配置文件
 * 包含所有可配置的参数和字段映射
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// 加载环境变量
dotenv.config();

export interface AuthConfig {
  type: 'none' | 'basic' | 'bearer' | 'wp-app-password';
  username?: string;
  password?: string;
  token?: string;
  appPassword?: string; // WordPress Application Password
}

export interface FieldMapping {
  wpField: string | string[]; // WordPress 字段名（支持多个候选）
  dbField: string; // 数据库字段名
  type: 'acf' | 'taxonomy' | 'post_field'; // 字段类型
  required: boolean; // 是否必需
  taxonomyName?: string; // 如果是 taxonomy，指定 taxonomy 名称
  termResolver?: 'id' | 'slug' | 'name'; // term 解析方式
}

export interface TaxonomyMapping {
  wpTaxonomy: string | string[]; // WordPress taxonomy 名称（支持多个候选）
  dbField: string; // 数据库字段名
  termResolver: 'id' | 'slug' | 'name'; // 保存 term 的哪个属性
}

export interface SyncConfig {
  // WordPress 配置
  wpBaseUrl: string;
  wpApiProfileEndpoint: string;
  
  // 认证配置
  auth: AuthConfig;
  
  // Prisma 配置
  prismaSchemaPath: string;
  
  // 批次配置
  batchSize: number;
  
  // 运行模式
  dryRun: boolean;
  
  // 日志配置
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logFilePath?: string;
  
  // 网络配置
  timeout: number; // 请求超时（毫秒）
  maxRetries: number; // 最大重试次数
  retryDelay: number; // 初始重试延迟（毫秒）
  maxConcurrency: number; // 最大并发请求数
  
  // 字段映射配置
  fieldMappings: FieldMapping[];
  taxonomyMappings: TaxonomyMapping[];
  
  // 单条调试模式
  singlePostId?: number;
  
  // 抽样模式
  sampleSize?: number; // 抽样数量（如果设置了，则为抽样模式）
  sampleFailureThreshold?: number; // 抽样失败率阈值（默认 0.1，即 10%）
}

/**
 * 从环境变量构建认证配置
 */
function buildAuthConfig(): AuthConfig {
  const authType = (process.env.WP_AUTH_TYPE || 'none').toLowerCase();
  
  switch (authType) {
    case 'basic':
      return {
        type: 'basic',
        username: process.env.WP_AUTH_USERNAME || '',
        password: process.env.WP_AUTH_PASSWORD || '',
      };
    
    case 'bearer':
      return {
        type: 'bearer',
        token: process.env.WP_AUTH_TOKEN || '',
      };
    
    case 'wp-app-password':
      return {
        type: 'wp-app-password',
        username: process.env.WP_AUTH_USERNAME || '',
        appPassword: process.env.WP_AUTH_APP_PASSWORD || '',
      };
    
    default:
      return { type: 'none' };
  }
}

/**
 * 默认字段映射配置
 */
function getDefaultFieldMappings(): FieldMapping[] {
  return [
    {
      wpField: 'name_english',
      dbField: 'nameEnglish',
      type: 'acf',
      required: false,
    },
    {
      wpField: ['name_short', 'nameShort'],
      dbField: 'nameShort',
      type: 'acf',
      required: false,
    },
    {
      wpField: 'school_profile_type',
      dbField: 'schoolProfileTypeFromACF', // ACF 字段，将映射到 school_profile_type 列
      type: 'acf',
      required: false,
    },
  ];
}

/**
 * 默认 Taxonomy 映射配置
 */
function getDefaultTaxonomyMappings(): TaxonomyMapping[] {
  return [
    {
      wpTaxonomy: 'profile_type',
      dbField: 'profileTypeFromTaxonomy', // Taxonomy 字段，将映射到 profileType 列
      termResolver: 'slug',
    },
    {
      wpTaxonomy: ['band-type', 'band_type', 'bandtype'],
      dbField: 'bandType',
      termResolver: 'slug',
    },
    {
      wpTaxonomy: 'country',
      dbField: 'country',
      termResolver: 'name',
    },
    {
      wpTaxonomy: 'location',
      dbField: 'location',
      termResolver: 'name',
    },
  ];
}

/**
 * 加载配置
 */
export function loadConfig(): SyncConfig {
  const wpBaseUrl = process.env.WP_BASE_URL || 'http://localhost:3000';
  const prismaSchemaPath = process.env.PRISMA_SCHEMA_PATH || 
    path.join(process.cwd(), 'prisma', 'schema.prisma');
  
  // 验证 Prisma schema 文件是否存在
  if (!fs.existsSync(prismaSchemaPath)) {
    throw new Error(`Prisma schema file not found at: ${prismaSchemaPath}`);
  }
  
  // 解析 DRY_RUN
  const dryRun = process.env.DRY_RUN === 'true' || 
    process.env.DRY_RUN === '1' || 
    process.argv.includes('--dry-run');
  
  // 解析单条调试模式
  const singlePostIdIndex = process.argv.indexOf('--id');
  const singlePostId = singlePostIdIndex >= 0 && process.argv[singlePostIdIndex + 1]
    ? parseInt(process.argv[singlePostIdIndex + 1], 10)
    : undefined;
  
  // 解析抽样模式
  const sampleIndex = process.argv.indexOf('--sample');
  const sampleSize = sampleIndex >= 0 && process.argv[sampleIndex + 1]
    ? parseInt(process.argv[sampleIndex + 1], 10)
    : undefined;
  
  return {
    wpBaseUrl: wpBaseUrl.replace(/\/$/, ''), // 移除末尾斜杠
    wpApiProfileEndpoint: process.env.WP_API_PROFILE_ENDPOINT || '/wp-json/wp/v2/profile',
    auth: buildAuthConfig(),
    prismaSchemaPath,
    batchSize: parseInt(process.env.BATCH_SIZE || '50', 10),
    dryRun,
    logLevel: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
    logFilePath: process.env.LOG_FILE_PATH,
    timeout: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10),
    maxRetries: parseInt(process.env.MAX_RETRIES || '5', 10),
    retryDelay: parseInt(process.env.RETRY_DELAY || '1000', 10),
    maxConcurrency: parseInt(process.env.MAX_CONCURRENCY || '5', 10),
    fieldMappings: getDefaultFieldMappings(),
    taxonomyMappings: getDefaultTaxonomyMappings(),
    singlePostId,
    sampleSize,
    sampleFailureThreshold: parseFloat(process.env.SAMPLE_FAILURE_THRESHOLD || '0.1'),
  };
}

/**
 * 验证配置
 */
export function validateConfig(config: SyncConfig): string[] {
  const errors: string[] = [];
  
  if (!config.wpBaseUrl) {
    errors.push('WP_BASE_URL is required');
  }
  
  if (!config.wpBaseUrl.startsWith('http://') && !config.wpBaseUrl.startsWith('https://')) {
    errors.push('WP_BASE_URL must start with http:// or https://');
  }
  
  if (config.batchSize < 1) {
    errors.push('BATCH_SIZE must be at least 1');
  }
  
  if (config.timeout < 1000) {
    errors.push('REQUEST_TIMEOUT must be at least 1000ms');
  }
  
  if (config.maxRetries < 0) {
    errors.push('MAX_RETRIES must be non-negative');
  }
  
  if (config.maxConcurrency < 1) {
    errors.push('MAX_CONCURRENCY must be at least 1');
  }
  
  // 验证认证配置
  if (config.auth.type === 'basic' && (!config.auth.username || !config.auth.password)) {
    errors.push('WP_AUTH_USERNAME and WP_AUTH_PASSWORD are required for basic auth');
  }
  
  if (config.auth.type === 'bearer' && !config.auth.token) {
    errors.push('WP_AUTH_TOKEN is required for bearer auth');
  }
  
  if (config.auth.type === 'wp-app-password' && (!config.auth.username || !config.auth.appPassword)) {
    errors.push('WP_AUTH_USERNAME and WP_AUTH_APP_PASSWORD are required for WordPress app password auth');
  }
  
  return errors;
}

