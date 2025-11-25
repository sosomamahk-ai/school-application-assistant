#!/usr/bin/env node

/**
 * 重新同步缺失字段的脚本
 * 用于更新数据库中字段为 null 的记录
 */

import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { loadConfig, validateConfig } from './config';
import { createLogger } from './logger';
import { WordPressClient } from './wordpress-client';
import { PrismaSyncService } from './prisma-sync';
import { extractFields } from './field-extractor';

dotenv.config();

const prisma = new PrismaClient();

async function resyncMissingFields(options: {
  limit?: number;
  dryRun?: boolean;
  wpId?: number;
  all?: boolean;
}) {
  const config = loadConfig();
  const configErrors = validateConfig(config);
  if (configErrors.length > 0) {
    throw new Error(`配置错误: ${configErrors.join(', ')}`);
  }
  
  const logger = createLogger(config);
  const wpClient = new WordPressClient(config);
  const syncService = new PrismaSyncService(config, logger);

  // 查找需要重新同步的记录
  let query: any;
  
  if (options.all) {
    // 全量同步：同步所有有 wpId 的记录
    query = {
      wpId: { not: null },
    };
    logger.info('⚠️  全量重新同步模式：将重新同步所有有 wpId 的记录');
  } else if (options.wpId) {
    // 单条同步
    query = {
      wpId: options.wpId,
    };
  } else {
    // 只同步缺失字段的记录
    query = {
      wpId: { not: null },
      OR: [
        { school_profile_type: null },
        { profileType: null },
        { nameEnglish: null },
      ],
    };
  }

  // 首先统计总数
  const totalCount = await prisma.school.count({
    where: query,
  });

  if (options.all) {
    logger.info(`找到 ${totalCount} 条有 wpId 的记录，将全部重新同步`);
  } else {
    logger.info(`找到 ${totalCount} 条需要重新同步的记录（缺失字段的记录）`);
  }

  if (totalCount === 0) {
    logger.info('没有需要重新同步的记录');
    await prisma.$disconnect();
    return;
  }

  // 如果指定了 limit，只同步部分记录；否则同步全部
  const limit = options.limit || totalCount;
  const recordsToSync = await prisma.school.findMany({
    where: query,
    select: {
      id: true,
      wpId: true,
      name: true,
    },
    take: limit,
    orderBy: {
      updatedAt: 'desc',
    },
  });

  if (limit < totalCount) {
    logger.info(`将同步前 ${limit} 条记录（共 ${totalCount} 条）`);
  } else {
    if (options.all) {
      logger.info(`将重新同步全部 ${totalCount} 条记录`);
    } else {
      logger.info(`将同步全部 ${totalCount} 条缺失字段的记录`);
    }
  }

  if (recordsToSync.length === 0) {
    logger.info('没有需要重新同步的记录');
    await prisma.$disconnect();
    return;
  }

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < recordsToSync.length; i++) {
    const record = recordsToSync[i];
    const wpId = record.wpId!;

    logger.info(`[${i + 1}/${recordsToSync.length}] 重新同步 wpId=${wpId}: ${record.name}`);

    try {
      // 从 WordPress 获取最新数据
      const post = await wpClient.getPost(wpId);
      
      if (!post) {
        logger.error(`无法获取 wpId=${wpId} 的 WordPress 数据`);
        failureCount++;
        continue;
      }

      // 提取字段
      const extractedFields = extractFields(post, config);

      // 获取 post 标题
      const postTitle = typeof post.title === 'string'
        ? post.title
        : post.title?.rendered || record.name;

      // 同步到数据库
      const result = await syncService.upsertSchool(wpId, extractedFields, postTitle);

      if (result.success) {
        successCount++;
        logger.info(`✅ 成功重新同步 wpId=${wpId}`);
      } else {
        failureCount++;
        logger.error(`❌ 重新同步失败 wpId=${wpId}: ${result.error}`);
      }

      // 添加延迟，避免请求过快
      if (i < recordsToSync.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error: any) {
      failureCount++;
      logger.error(`❌ 处理 wpId=${wpId} 时出错: ${error.message}`);
    }
  }

  logger.info('\n═══════════════════════════════════════════════════════════');
  logger.info('重新同步完成');
  logger.info(`成功: ${successCount} 条`);
  logger.info(`失败: ${failureCount} 条`);
  logger.info('═══════════════════════════════════════════════════════════\n');

  await prisma.$disconnect();
}

async function main() {
  const args = process.argv.slice(2);
  
  const options: {
    limit?: number;
    dryRun?: boolean;
    wpId?: number;
    all?: boolean;
  } = {};

  // 解析参数
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      options.limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--all') {
      // 同步所有有 wpId 的记录（不限制缺失字段）
      options.all = true;
    } else if (args[i] === '--dry-run') {
      options.dryRun = true;
    } else if (args[i] === '--wp-id' && args[i + 1]) {
      options.wpId = parseInt(args[i + 1], 10);
      i++;
    }
  }

  if (options.dryRun) {
    console.log('⚠️  DRY RUN 模式：不会实际修改数据库\n');
  }

  await resyncMissingFields(options);
}

main().catch(console.error);

