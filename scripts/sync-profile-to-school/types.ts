/**
 * 类型定义
 */

export interface WordPressPost {
  id: number;
  slug: string;
  title: { rendered: string } | string;
  link?: string;
  acf?: Record<string, any>;
  meta?: Record<string, any>;
  meta_data?: Array<{ id: number; key: string; value: any }>;
  [key: string]: any; // 允许其他 WordPress REST API 字段
}

export interface WordPressTerm {
  id: number;
  name: string;
  slug: string;
  taxonomy: string;
  [key: string]: any;
}

export interface WordPressPostWithTerms extends WordPressPost {
  _embedded?: {
    'wp:term'?: WordPressTerm[][];
    [key: string]: any;
  };
  profile_type?: number[];
  'band-type'?: number[];
  country?: number[];
  location?: number[];
}

export interface ExtractedField {
  value: any;
  source: 'acf' | 'taxonomy' | 'post_field' | 'meta' | 'config';
  rawData: any;
  present: boolean; // 字段是否存在于 API 响应中
  path: string[]; // 字段路径（用于诊断）
}

export interface FieldDiagnosis {
  fieldName: string;
  present: boolean;
  value: any;
  rawPath: string[];
  possibleReasons: string[];
  suggestions: string[];
  curlExample?: string;
}

export interface SyncedRecord {
  wpPostId: number;
  wpPostSlug: string;
  timestamp: Date;
  fetchedFields: Record<string, ExtractedField>;
  dbStatus: 'created' | 'updated' | 'skipped' | 'error';
  dbId?: string;
  errorDetails?: string;
  diagnoses: FieldDiagnosis[];
}

export interface SyncResult {
  totalFetched: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  missingFieldsCount: number;
  records: SyncedRecord[];
  summary: {
    created: number;
    updated: number;
    errors: Array<{ wpId: number; error: string }>;
    missingFields: Array<{ wpId: number; field: string; diagnosis: FieldDiagnosis }>;
  };
}

export interface BatchProgress {
  currentBatch: number;
  totalBatches: number;
  processed: number;
  total: number;
  success: number;
  errors: number;
}

export interface SampleReport {
  sampleSize: number;
  totalAvailable: number;
  sampledIds: number[];
  successCount: number;
  failureCount: number;
  missingFieldsCount: number;
  failureRate: number;
  records: SyncedRecord[];
  missingFieldsSummary: Record<string, number>; // 字段名 -> 缺失数量
  recordsWithDiagnoses: Array<{
    wpId: number;
    wpSlug: string;
    diagnoses: FieldDiagnosis[];
    apiPayload?: any; // 原始 API 返回片段
  }>;
  warnings: string[];
}

export interface SamplingMode {
  isSampling: boolean;
  sampleSize: number;
  totalAvailable: number;
}

