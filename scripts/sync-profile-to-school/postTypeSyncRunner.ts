import * as dotenv from 'dotenv';
import { loadConfig, validateConfig, SyncConfig } from './config';
import { buildPostTypeConfig, PostTypeKey } from './postTypeConfig';
import { createLogger } from './logger';
import { WordPressClient } from './wordpress-client';
import { PrismaSyncService } from './prisma-sync';
import { extractFields } from './field-extractor';

dotenv.config();

export interface ResyncOptions {
  dryRun?: boolean;
  batchSize?: number;
  limit?: number;
}

export async function runPostTypeResync(postType: PostTypeKey, options: ResyncOptions = {}) {
  const baseConfig = loadConfig();
  const configErrors = validateConfig(baseConfig);
  if (configErrors.length > 0) {
    throw new Error(`配置错误: ${configErrors.join(', ')}`);
  }

  const effectiveConfig: SyncConfig = {
    ...buildPostTypeConfig(baseConfig, postType),
    dryRun: options.dryRun ?? baseConfig.dryRun,
    batchSize: options.batchSize || baseConfig.batchSize,
  };

  const logger = createLogger(effectiveConfig);
  const wpClient = new WordPressClient(effectiveConfig);
  const syncService = new PrismaSyncService(effectiveConfig, logger);

  const label = postType === 'university' ? 'WordPress Universities' : 'WordPress Profiles';

  logger.info('\n═══════════════════════════════════════════════════════════');
  logger.info(`🔄 开始重新同步 ${label}`);
  logger.info('═══════════════════════════════════════════════════════════\n');

  try {
    logger.info('验证 Prisma Client...');
    await syncService.validatePrismaClient();

    logger.info('测试 WordPress 连接...');
    const connectionTest = await wpClient.testConnection();
    if (!connectionTest.success) {
      logger.error(connectionTest.message);
      throw new Error(connectionTest.message);
    }
    logger.info(connectionTest.message);

    logger.info(`获取所有 ${postType} post IDs...`);
    const allIds = await wpClient.getAllPostIds();
    if (!allIds.length) {
      logger.info('没有找到任何 posts');
      return;
    }

    const limit = options.limit;
    const idsToProcess = limit ? allIds.slice(0, limit) : allIds;
    const totalCount = idsToProcess.length;

    if (limit && limit < allIds.length) {
      logger.info(`⚠️  测试模式：仅处理前 ${limit} 条记录（共 ${allIds.length} 条）`);
    } else {
      logger.info(`总共找到 ${totalCount} 条 ${postType} posts`);
    }

    const batchSize = effectiveConfig.batchSize || 10;
    let successCount = 0;
    let failureCount = 0;
    const errors: Array<{ wpId: number; error: string }> = [];

    for (let batchStart = 0; batchStart < idsToProcess.length; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, idsToProcess.length);
      const batch = idsToProcess.slice(batchStart, batchEnd);
      const batchNumber = Math.floor(batchStart / batchSize) + 1;
      const totalBatches = Math.ceil(idsToProcess.length / batchSize);

      logger.info(`\n处理批次 ${batchNumber}/${totalBatches} (${batchStart + 1}-${batchEnd}/${totalCount})`);

      const batchPosts = await Promise.all(
        batch.map(async (id) => {
          try {
            const post = await wpClient.getPost(id);
            return { id, post, error: null };
          } catch (error: any) {
            // 非 404 错误（getPost 现在对 404 返回 null，不会抛出）
            return { id, post: null, error: error.message };
          }
        })
      );

      const batchRecords: Array<{ wpId: number; extractedFields: any; postTitle: string }> = [];
      for (const { id, post, error } of batchPosts) {
        if (error) {
          // 非 404 的其他错误
          logger.error(`❌ 获取 post ${id} 失败: ${error}`);
          failureCount++;
          errors.push({ wpId: id, error });
          continue;
        }

        if (!post) {
          // post 为 null 表示 404（post 不存在于当前 endpoint）
          logger.warn(`⚠️  wpId=${id} 在当前 endpoint 中不存在，跳过同步`);
          continue;
        }

        try {
          const extractedFields = extractFields(post, effectiveConfig);
          const postTitle = typeof post.title === 'string'
            ? post.title
            : post.title?.rendered || `Post ${id}`;

          batchRecords.push({
            wpId: id,
            extractedFields,
            postTitle,
          });

          logger.debug(`提取字段完成: wpId=${id}, title=${postTitle.substring(0, 30)}...`);
        } catch (extractError: any) {
          logger.error(`处理 post ${id} 时出错: ${extractError.message}`);
          failureCount++;
          errors.push({ wpId: id, error: extractError.message });
        }
      }

      if (batchRecords.length > 0) {
        logger.info(`同步 ${batchRecords.length} 条记录到数据库...`);
        const syncResults = await syncService.batchUpsert(
          batchRecords.map((r) => ({
            wpId: r.wpId,
            extractedFields: r.extractedFields,
            postTitle: r.postTitle,
          }))
        );

        syncResults.forEach((result, index) => {
          const record = batchRecords[index];
          if (result.success) {
            successCount++;
            logger.debug(`✅ 成功同步 wpId=${record.wpId}`);
          } else {
            failureCount++;
            logger.error(`❌ 同步失败 wpId=${record.wpId}: ${result.error}`);
            errors.push({ wpId: record.wpId, error: result.error || 'Unknown error' });
          }
        });
      }

      if (batchEnd < idsToProcess.length) {
        logger.info(`批次 ${batchNumber} 完成，等待 1 秒后继续...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    logger.info('\n═══════════════════════════════════════════════════════════');
    logger.info('✅ 重新同步完成');
    logger.info('═══════════════════════════════════════════════════════════');
    if (limit && limit < allIds.length) {
      logger.info(`总记录数: ${allIds.length} (本次处理 ${totalCount} 条)`);
    } else {
      logger.info(`总记录数: ${totalCount}`);
    }
    logger.info(`成功: ${successCount} 条 (${((successCount / totalCount) * 100).toFixed(1)}%)`);
    logger.info(`失败: ${failureCount} 条 (${((failureCount / totalCount) * 100).toFixed(1)}%)`);

    if (errors.length > 0) {
      logger.info('\n失败记录详情 (最多 20 条):');
      errors.slice(0, 20).forEach(({ wpId, error }) => {
        logger.error(`  wpId=${wpId}: ${error}`);
      });
    }

    logger.info('═══════════════════════════════════════════════════════════\n');
  } catch (error: any) {
    logger.error(`重新同步过程中发生错误: ${error.message}`);
    throw error;
  } finally {
    await syncService.close();
  }
}

