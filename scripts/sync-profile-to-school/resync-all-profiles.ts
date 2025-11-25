#!/usr/bin/env node

/**
 * 重新同步所有 WordPress profiles 的脚本
 * 从 WordPress 获取所有 profile posts 并更新到数据库
 */

import * as dotenv from 'dotenv';
import { loadConfig, validateConfig } from './config';
import { createLogger } from './logger';
import { WordPressClient } from './wordpress-client';
import { PrismaSyncService } from './prisma-sync';
import { extractFields } from './field-extractor';

dotenv.config();

async function resyncAllProfiles(options: {
  dryRun?: boolean;
  batchSize?: number;
}) {
  const config = loadConfig();
  const configErrors = validateConfig(config);
  if (configErrors.length > 0) {
    throw new Error(`配置错误: ${configErrors.join(', ')}`);
  }
  
  const logger = createLogger(config);
  const wpClient = new WordPressClient(config);
  const syncService = new PrismaSyncService(config, logger);

  logger.info('\n═══════════════════════════════════════════════════════════');
  logger.info('🔄 开始重新同步所有 WordPress Profiles');
  logger.info('═══════════════════════════════════════════════════════════\n');

  try {
    // 验证 Prisma Client
    logger.info('验证 Prisma Client...');
    await syncService.validatePrismaClient();
    
    // 测试 WordPress 连接
    logger.info('测试 WordPress 连接...');
    const connectionTest = await wpClient.testConnection();
    if (!connectionTest.success) {
      logger.error(connectionTest.message);
      throw new Error(connectionTest.message);
    }
    logger.info(connectionTest.message);

    // 获取所有 profile post IDs
    logger.info('获取所有 profile post IDs...');
    const allIds = await wpClient.getAllPostIds();
    const totalCount = allIds.length;
    
    logger.info(`总共找到 ${totalCount} 条 profile posts`);
    
    if (totalCount === 0) {
      logger.info('没有找到任何 profile posts');
      return;
    }

    const batchSize = options.batchSize || config.batchSize || 10;
    let successCount = 0;
    let failureCount = 0;
    const errors: Array<{ wpId: number; error: string }> = [];

    // 分批处理
    for (let batchStart = 0; batchStart < allIds.length; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, allIds.length);
      const batch = allIds.slice(batchStart, batchEnd);
      const batchNumber = Math.floor(batchStart / batchSize) + 1;
      const totalBatches = Math.ceil(allIds.length / batchSize);

      logger.info(`\n处理批次 ${batchNumber}/${totalBatches} (${batchStart + 1}-${batchEnd}/${totalCount})`);

      // 并发获取该批次的所有 posts
      const batchPosts = await Promise.all(
        batch.map(async (id) => {
          try {
            const post = await wpClient.getPost(id);
            return { id, post, error: null };
          } catch (error: any) {
            return { id, post: null, error: error.message };
          }
        })
      );

      // 处理每个 post
      const batchRecords = [];
      for (const { id, post, error } of batchPosts) {
        if (error) {
          logger.error(`获取 post ${id} 失败: ${error}`);
          failureCount++;
          errors.push({ wpId: id, error });
          continue;
        }

        if (!post) {
          logger.error(`post ${id} 为空`);
          failureCount++;
          continue;
        }

        try {
          // 提取字段
          const extractedFields = extractFields(post, config);

          // 获取 post 标题
          const postTitle = typeof post.title === 'string'
            ? post.title
            : post.title?.rendered || `Post ${id}`;

          batchRecords.push({
            wpId: id,
            extractedFields,
            postTitle,
          });

          logger.debug(`提取字段完成: wpId=${id}, title=${postTitle.substring(0, 30)}...`);
        } catch (error: any) {
          logger.error(`处理 post ${id} 时出错: ${error.message}`);
          failureCount++;
          errors.push({ wpId: id, error: error.message });
        }
      }

      // 批量同步到数据库
      if (batchRecords.length > 0) {
        logger.info(`同步 ${batchRecords.length} 条记录到数据库...`);
        
        const syncResults = await syncService.batchUpsert(
          batchRecords.map(r => ({
            wpId: r.wpId,
            extractedFields: r.extractedFields,
            postTitle: r.postTitle,
          }))
        );

        // 统计结果
        for (let i = 0; i < syncResults.length; i++) {
          const result = syncResults[i];
          const record = batchRecords[i];
          
          if (result.success) {
            successCount++;
            logger.debug(`✅ 成功同步 wpId=${record.wpId}`);
          } else {
            failureCount++;
            logger.error(`❌ 同步失败 wpId=${record.wpId}: ${result.error}`);
            errors.push({ wpId: record.wpId, error: result.error || 'Unknown error' });
          }
        }
      }

      // 批次间延迟
      if (batchEnd < allIds.length) {
        logger.info(`批次 ${batchNumber} 完成，等待 1 秒后继续...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // 打印最终报告
    logger.info('\n═══════════════════════════════════════════════════════════');
    logger.info('✅ 重新同步完成');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info(`总记录数: ${totalCount}`);
    logger.info(`成功: ${successCount} 条 (${((successCount / totalCount) * 100).toFixed(1)}%)`);
    logger.info(`失败: ${failureCount} 条 (${((failureCount / totalCount) * 100).toFixed(1)}%)`);

    if (errors.length > 0 && errors.length <= 20) {
      logger.info('\n失败记录详情:');
      errors.forEach(({ wpId, error }) => {
        logger.error(`  wpId=${wpId}: ${error}`);
      });
    } else if (errors.length > 20) {
      logger.info(`\n失败记录详情（前 20 条，共 ${errors.length} 条）:`);
      errors.slice(0, 20).forEach(({ wpId, error }) => {
        logger.error(`  wpId=${wpId}: ${error}`);
      });
    }

    logger.info('═══════════════════════════════════════════════════════════\n');

  } catch (error: any) {
    logger.error(`重新同步过程中发生错误: ${error.message}`);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  const options: {
    dryRun?: boolean;
    batchSize?: number;
  } = {};

  // 解析参数
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      options.dryRun = true;
    } else if (args[i] === '--batch-size' && args[i + 1]) {
      options.batchSize = parseInt(args[i + 1], 10);
      i++;
    }
  }

  if (options.dryRun) {
    console.log('⚠️  DRY RUN 模式：不会实际修改数据库\n');
  }

  await resyncAllProfiles(options);
}

main().catch(console.error);

