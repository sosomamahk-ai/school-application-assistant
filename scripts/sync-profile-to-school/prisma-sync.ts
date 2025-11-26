/**
 * Prisma 数据库同步模块
 * 实现幂等的 upsert 操作
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { SyncConfig } from './config';
import { ExtractedField } from './types';
import { Logger } from './logger';

export class PrismaSyncService {
  private prisma: PrismaClient;
  private config: SyncConfig;
  private logger: Logger;

  constructor(config: SyncConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.prisma = new PrismaClient({
      log: config.logLevel === 'debug' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  /**
   * 验证 Prisma Client 和 School 模型（带重试机制）
   */
  async validatePrismaClient(): Promise<void> {
    const maxRetries = 3;
    const retryDelay = 2000; // 2 秒
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 尝试查询 School 模型（简单的 count 查询），设置超时
        await Promise.race([
          this.prisma.school.count(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('数据库连接超时（5秒）')), 5000)
          )
        ]);
        this.logger.info('Prisma Client 验证成功，School 模型可用');
        return; // 成功，退出函数
      } catch (error: any) {
        const isConnectionError = error.message?.includes('Can\'t reach database') ||
                                 error.message?.includes('connection') ||
                                 error.message?.includes('timeout') ||
                                 error.message?.includes('超时') ||
                                 error.code === 'P1001' ||
                                 error.code === 'P1008';
        
        if (attempt < maxRetries && isConnectionError) {
          this.logger.warn(`数据库连接失败，正在重试 (${attempt}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          continue;
        }
        
        // 最后一次尝试失败，或者不是连接错误
        const errorMsg = isConnectionError
          ? `无法连接到数据库服务器。请检查：\n` +
            `  1. 数据库服务器是否运行\n` +
            `  2. 网络连接是否正常\n` +
            `  3. DATABASE_URL 环境变量是否正确\n` +
            `  4. 防火墙设置是否允许连接\n` +
            `\n原始错误: ${error.message}`
          : `Prisma Client 验证失败: ${error.message}。请确保已运行 'npx prisma generate'`;
        
        throw new Error(errorMsg);
      }
    }
  }

  /**
 * 将提取的字段转换为 Prisma 数据对象
 */
  private extractToPrismaData(
    extractedFields: Record<string, ExtractedField>,
    postTitle: string
  ): any {
    const data: any = {
      name: postTitle, // 必需字段
      updatedAt: new Date(),
      metadataSource: 'wordpress',
      metadataLastFetchedAt: new Date(),
    };

    // 映射字段 - 分别处理 ACF 和 Taxonomy 字段
    for (const [dbField, extracted] of Object.entries(extractedFields)) {
      if (extracted.value !== null && extracted.value !== undefined) {
        // 根据数据库字段名映射
        switch (dbField) {
          case 'wpId':
            data.wpId = parseInt(extracted.value, 10) || null;
            break;
          case 'nameEnglish':
            data.nameEnglish = extracted.value;
            break;
          case 'nameShort':
            data.nameShort = extracted.value;
            break;
          case 'bandType':
            data.bandType = extracted.value;
            break;
          case 'country':
            data.country = extracted.value;
            break;
          case 'location':
            data.location = extracted.value;
            break;
          case 'schoolProfileTypeFromACF':
            // ACF 字段 school_profile_type -> 数据库字段 school_profile_type
            data.school_profile_type = extracted.value;
            break;
          case 'profileTypeFromTaxonomy':
            // Taxonomy 字段 profile_type -> 数据库字段 profileType
            data.profileType = extracted.value;
            break;
          case 'postType':
            data.postType = extracted.value;
            break;
          case 'slug':
            // slug 可以存储在 notes 或作为标识符，但 schema 中没有 slug 字段
            // 如果需要可以添加到 notes
            break;
          default:
            // 忽略未知字段
            this.logger.debug(`未映射的字段: ${dbField} = ${extracted.value}`);
        }
      }
    }

    if (!data.postType && this.config.wpPostType) {
      data.postType = this.config.wpPostType;
    }

    return data;
  }

  /**
   * 幂等的 upsert 操作（带重试机制）
   */
  async upsertSchool(
    wpId: number | null,
    extractedFields: Record<string, ExtractedField>,
    postTitle: string,
    retryCount: number = 0
  ): Promise<{ success: boolean; created: boolean; id: string; error?: string }> {
    if (this.config.dryRun) {
      this.logger.debug(`[DRY RUN] 将 upsert school: wpId=${wpId}, title=${postTitle}`);
      return {
        success: true,
        created: false,
        id: 'dry-run-id',
      };
    }

    const maxRetries = 3;
    const retryDelay = 1000 * (retryCount + 1); // 递增延迟：1s, 2s, 3s

    try {
      const data = this.extractToPrismaData(extractedFields, postTitle);

      if (!wpId) {
        throw new Error('wpId 是必需的用于 upsert');
      }

      // 不使用事务，直接查找然后更新/创建（避免连接池耗尽）
      // 对于单个记录的 upsert，不需要事务也能保证一致性
      const existing = await this.prisma.school.findFirst({
        where: { wpId },
      });

      let result: { created: boolean; id: string };
      
      if (existing) {
        // 更新现有记录
        const updated = await this.prisma.school.update({
          where: { id: existing.id },
          data: {
            ...data,
            // 保留 createdAt
            createdAt: existing.createdAt,
          },
        });
        result = { created: false, id: updated.id };
      } else {
        // 创建新记录（如果并发创建导致冲突，捕获错误并重试）
        try {
          const created = await this.prisma.school.create({
            data: {
              ...data,
              wpId,
              id: randomUUID(),
            },
          });
          result = { created: true, id: created.id };
        } catch (createError: any) {
          // 如果是唯一约束冲突（并发创建），尝试查找已存在的记录
          if (createError.code === 'P2002' || createError.message?.includes('Unique constraint')) {
            const retryExisting = await this.prisma.school.findFirst({
              where: { wpId },
            });
            if (retryExisting) {
              // 记录已存在，更新它
              const updated = await this.prisma.school.update({
                where: { id: retryExisting.id },
                data: {
                  ...data,
                  createdAt: retryExisting.createdAt,
                },
              });
              result = { created: false, id: updated.id };
            } else {
              throw createError; // 重新抛出其他错误
            }
          } else {
            throw createError; // 重新抛出其他错误
          }
        }
      }

      return {
        success: true,
        created: result.created,
        id: result.id,
      };
    } catch (error: any) {
      // 判断是否应该重试的错误（网络错误、连接超时、临时性错误）
      const isRetryableError = error.message?.includes('timeout') ||
                               error.message?.includes('Unable to') ||
                               error.message?.includes('connection') ||
                               error.message?.includes('ECONNREFUSED') ||
                               error.message?.includes('ETIMEDOUT') ||
                               error.code === 'P1001' || // Prisma connection error
                               error.code === 'P1008' || // Prisma timeout error
                               error.code === 'P1017';   // Prisma connection closed
      
      if (isRetryableError && retryCount < maxRetries) {
        this.logger.warn(`Upsert school 失败，准备重试 (wpId=${wpId}, 重试 ${retryCount + 1}/${maxRetries}): ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.upsertSchool(wpId, extractedFields, postTitle, retryCount + 1);
      }
      
      this.logger.error(`Upsert school 失败 (wpId=${wpId}):`, error.message);
      return {
        success: false,
        created: false,
        id: '',
        error: error.message,
      };
    }
  }

  /**
   * 批量 upsert（限制并发，降低数据库并发以减轻连接池压力）
   */
  async batchUpsert(
    records: Array<{
      wpId: number | null;
      extractedFields: Record<string, ExtractedField>;
      postTitle: string;
    }>
  ): Promise<Array<{ success: boolean; created: boolean; id: string; error?: string }>> {
    const results: Array<{ success: boolean; created: boolean; id: string; error?: string }> = [];
    // 降低数据库操作的并发数，避免连接池耗尽
    const dbConcurrency = Math.min(this.config.maxConcurrency, 3); // 最多 3 个并发

    // 分批处理，限制并发
    for (let i = 0; i < records.length; i += dbConcurrency) {
      const batch = records.slice(i, i + dbConcurrency);
      
      // 顺序处理批次，但批次内可以并发
      const batchResults = await Promise.all(
        batch.map(record => this.upsertSchool(record.wpId, record.extractedFields, record.postTitle))
      );
      
      results.push(...batchResults);
      
      // 批次之间添加小延迟，避免连接池压力
      if (i + dbConcurrency < records.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      this.logger.debug(`处理批次 ${Math.floor(i / dbConcurrency) + 1}: ${batchResults.length} 条记录`);
    }

    return results;
  }

  /**
   * 获取数据库中的 school 总数
   */
  async getTotalCount(): Promise<number> {
    return await this.prisma.school.count();
  }

  /**
   * 获取通过 wpId 关联的 school 数量
   */
  async getWPSchoolCount(): Promise<number> {
    return await this.prisma.school.count({
      where: {
        wpId: {
          not: null,
        },
      },
    });
  }

  /**
   * 关闭 Prisma 连接
   */
  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

