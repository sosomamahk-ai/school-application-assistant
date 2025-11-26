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
import { buildPostTypeConfig, PostTypeKey } from './postTypeConfig';

dotenv.config();

const prisma = new PrismaClient();

type ResyncRecord = {
  id: string;
  wpId: number | null;
  name: string;
  postType: string | null;
};

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
    // 只同步缺失字段的记录（检查所有可能为 null 的字段）
    query = {
      wpId: { not: null },
      OR: [
        { school_profile_type: null },
        { profileType: null },
        { nameEnglish: null },
        { nameShort: null },
        { bandType: null },
        { country: null },
        { location: null },
        { postType: null },
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
  const rawRecords = await prisma.school.findMany({
    where: query,
    select: {
      id: true,
      wpId: true,
      name: true,
      postType: true, // Prisma 可能尚未生成，可通过 any 访问
    },
    take: limit,
    orderBy: {
      updatedAt: 'desc',
    },
  } as any);

  const recordsToSync: ResyncRecord[] = rawRecords.map((record: any) => ({
    id: record.id,
    wpId: record.wpId,
    name: record.name,
    postType: record.postType ?? null,
  }));

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
    const wpNumericId = Number(wpId);
    if (!Number.isFinite(wpNumericId)) {
      logger.warn(`⚠️  记录 ${record.id} 的 wpId 无效，跳过`);
      failureCount++;
      continue;
    }

    const recordPostType = (record as any).postType as string | null | undefined;
    logger.info(
      `[${i + 1}/${recordsToSync.length}] 重新同步 wpId=${wpId}: ${record.name} (postType: ${recordPostType || '未知'})`
    );

    try {
      // 智能检测 postType：如果 postType 为 null 或返回 404，尝试另一个 endpoint
      let detectedPostType: PostTypeKey | null = null;
      let post: any = null;
      let recordConfig: any = null;
      let recordWpClient: WordPressClient | null = null;

      // 确定要尝试的 postType 顺序
      const postTypesToTry: PostTypeKey[] = [];
      if (recordPostType === 'profile' || recordPostType === null) {
        // 如果标记为 profile 或 null，先尝试 profile
        postTypesToTry.push('profile', 'university');
      } else if (recordPostType === 'university') {
        // 如果标记为 university，先尝试 university
        postTypesToTry.push('university', 'profile');
      } else {
        // 未知类型，先尝试 profile
        postTypesToTry.push('profile', 'university');
      }

      // 尝试每个 postType
      for (const tryPostType of postTypesToTry) {
        try {
          recordConfig = buildPostTypeConfig(config, tryPostType);
          recordWpClient = new WordPressClient(recordConfig);
          
          logger.debug(`  尝试从 ${tryPostType} endpoint 获取 wpId=${wpId}...`);
          post = await recordWpClient.getPost(wpNumericId);
          
          if (post) {
            // 成功获取，记录检测到的 postType
            detectedPostType = tryPostType;
            logger.info(`  ✅ 从 ${tryPostType} endpoint 成功获取数据`);
            break;
          }
        } catch (error: any) {
          // 如果是 404 错误，尝试下一个 endpoint
          if (error.message?.includes('404') || error.message?.includes('Not Found')) {
            logger.debug(`  ⚠️  ${tryPostType} endpoint 返回 404，尝试下一个...`);
            continue;
          }
          // 其他错误，抛出
          throw error;
        }
      }

      // 如果所有尝试都失败
      if (!post || !detectedPostType) {
        logger.warn(`⚠️  wpId=${wpId} (${record.name}) 在所有 endpoint 中都不存在，跳过同步`);
        continue;
      }

      // 如果检测到的 postType 与数据库中的不一致，记录警告
      if (recordPostType && recordPostType !== detectedPostType) {
        logger.warn(`  ⚠️  检测到 postType 不一致：数据库=${recordPostType}，实际=${detectedPostType}，将更新为正确的 postType`);
      }

      // 提取字段（使用检测到的 postType 的配置）
      const extractedFields = extractFields(post, recordConfig!);

      // 获取 post 标题
      const postTitle =
        typeof post.title === 'string'
          ? post.title
          : typeof post.title?.rendered === 'string'
            ? post.title.rendered
            : record.name || `Post ${wpNumericId}`;

      // 获取现有记录，以便只更新 null 字段
      const existingRecord = await prisma.school.findFirst({
        where: { wpId: wpNumericId },
      });

      if (existingRecord) {
        // 只更新那些在数据库中为 null 但在 WordPress 中有值的字段
        const updateData: any = {
          updatedAt: new Date(),
          metadataSource: 'wordpress',
          metadataLastFetchedAt: new Date(),
        };

        // 检查每个字段，只更新 null 字段
        const fieldMappings: Array<{ extractedKey: string; dbKey: string }> = [
          { extractedKey: 'nameEnglish', dbKey: 'nameEnglish' },
          { extractedKey: 'nameShort', dbKey: 'nameShort' },
          { extractedKey: 'bandType', dbKey: 'bandType' },
          { extractedKey: 'country', dbKey: 'country' },
          { extractedKey: 'location', dbKey: 'location' },
          { extractedKey: 'schoolProfileTypeFromACF', dbKey: 'school_profile_type' },
          { extractedKey: 'profileTypeFromTaxonomy', dbKey: 'profileType' },
          { extractedKey: 'postType', dbKey: 'postType' },
        ];

        let hasUpdates = false;
        for (const mapping of fieldMappings) {
          const extracted = extractedFields[mapping.extractedKey];
          const existingValue = (existingRecord as any)[mapping.dbKey];
          
          // 更新条件：
          // 1) 数据库中为 null，且 WordPress 中有值
          // 2) 对于 postType：如果检测到的与数据库中的不一致，也要更新
          const shouldUpdate = 
            (existingValue === null && extracted?.value !== null && extracted?.value !== undefined) ||
            (mapping.dbKey === 'postType' && 
             existingValue !== null && 
             extracted?.value !== null && 
             existingValue !== extracted.value);
          
          if (shouldUpdate) {
            updateData[mapping.dbKey] = extracted.value;
            hasUpdates = true;
            if (existingValue === null) {
              logger.debug(`  将更新 ${mapping.dbKey}: null -> ${extracted.value}`);
            } else {
              logger.debug(`  将更新 ${mapping.dbKey}: ${existingValue} -> ${extracted.value}`);
            }
          }
        }

        if (hasUpdates) {
          // 执行更新
          await prisma.school.update({
            where: { id: existingRecord.id },
            data: updateData,
          });
          successCount++;
          logger.info(`✅ 成功更新缺失字段 wpId=${wpId} (postType: ${detectedPostType})`);
        } else {
          logger.info(`ℹ️  wpId=${wpId} 没有需要更新的字段（所有字段都已填充或 WordPress 中无数据）`);
        }
      } else {
        // 记录不存在，使用正常的 upsert 创建
        const result = await syncService.upsertSchool(wpNumericId, extractedFields, postTitle);
        if (result.success) {
          successCount++;
          logger.info(`✅ 成功创建新记录 wpId=${wpId} (postType: ${detectedPostType})`);
        } else {
          failureCount++;
          logger.error(`❌ 创建记录失败 wpId=${wpId}: ${result.error}`);
        }
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

