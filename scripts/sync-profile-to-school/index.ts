#!/usr/bin/env node

/**
 * WordPress Profile 到 School 同步脚本主入口
 * 
 * 使用方式:
 *   npm run sync:profile-to-school                    # 同步全部数据
 *   npm run sync:profile-to-school -- --dry-run       # Dry run 模式
 *   npm run sync:profile-to-school -- --id 123        # 单条调试
 *   npm run sync:profile-to-school -- --sample 20     # 抽样同步（推荐）
 *   npm run sync:profile-to-school -- --sample 20 --dry-run  # 抽样 + Dry run
 */

import { loadConfig, validateConfig } from './config';
import { createLogger } from './logger';
import { WordPressClient } from './wordpress-client';
import { PrismaSyncService } from './prisma-sync';
import { extractFields } from './field-extractor';
import { analyzeMissingFields, generateDiagnosisReport } from './diagnosis';
import { SyncResult, SyncedRecord, BatchProgress, SampleReport, ExtractedField } from './types';

/**
 * 主同步函数
 */
async function sync(): Promise<SyncResult> {
  // 加载配置
  console.log('加载配置...');
  const config = loadConfig();
  
  // 验证配置
  const configErrors = validateConfig(config);
  if (configErrors.length > 0) {
    console.error('配置错误:');
    configErrors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
  
  // 创建 logger
  const logger = createLogger(config);
  
  if (config.dryRun) {
    logger.info('⚠️  运行在 DRY RUN 模式下 - 不会实际修改数据库');
  }
  
  // 创建 WordPress 客户端
  const wpClient = new WordPressClient(config);
  
  // 创建 Prisma 同步服务
  const syncService = new PrismaSyncService(config, logger);
  
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
    
    // 验证 endpoint
    logger.info('验证 profile endpoint...');
    const endpointValidation = await wpClient.validateEndpoint();
    if (!endpointValidation.exists) {
      logger.error(endpointValidation.message);
      throw new Error(endpointValidation.message);
    }
    logger.info(endpointValidation.message);
    
    // 检查是否为抽样模式
    if (config.sampleSize) {
      logger.info(`\n═══════════════════════════════════════════════════════════`);
      logger.info(`🎲 抽样同步模式 (Sample Sync Mode)`);
      logger.info(`═══════════════════════════════════════════════════════════`);
      logger.info(`抽样数量: ${config.sampleSize}`);
      if (config.dryRun) {
        logger.info('⚠️  Dry Run 模式：不会实际修改数据库');
      }
      logger.info('开始获取随机样本...');
      
      // 执行抽样同步
      const sampleReport = await syncSample(config, wpClient, syncService, logger);
      
      // 打印抽样报告
      logger.printSampleReport(sampleReport);
      
      // 返回抽样结果（转换为 SyncResult 格式以保持兼容）
      return {
        totalFetched: sampleReport.sampleSize,
        successCount: sampleReport.successCount,
        errorCount: sampleReport.failureCount,
        skippedCount: 0,
        missingFieldsCount: sampleReport.missingFieldsCount,
        records: sampleReport.records,
        summary: {
          created: sampleReport.records.filter(r => r.dbStatus === 'created').length,
          updated: sampleReport.records.filter(r => r.dbStatus === 'updated').length,
          errors: sampleReport.records
            .filter(r => r.dbStatus === 'error')
            .map(r => ({ wpId: r.wpPostId, error: r.errorDetails || 'Unknown error' })),
          missingFields: sampleReport.recordsWithDiagnoses.flatMap(({ wpId, diagnoses }) =>
            diagnoses.map(d => ({ wpId, field: d.fieldName, diagnosis: d }))
          ),
        },
      };
    }
    
    // 获取 posts（正常模式或单条调试模式）
    logger.info('开始拉取 WordPress posts...');
    let posts;
    
    if (config.singlePostId) {
      logger.info(`单条调试模式: 拉取 post ID ${config.singlePostId}`);
      const singlePost = await wpClient.getPost(config.singlePostId);
      posts = singlePost ? [singlePost] : [];
      if (!singlePost) {
        logger.warn(`⚠️  post ID ${config.singlePostId} 不存在（404）`);
      }
    } else {
      posts = await wpClient.getAllPosts();
    }
    
    logger.info(`拉取到 ${posts.length} 条 posts`);
    
    if (posts.length === 0) {
      logger.warn('未找到任何 posts，请检查 WordPress 配置');
      return {
        totalFetched: 0,
        successCount: 0,
        errorCount: 0,
        skippedCount: 0,
        missingFieldsCount: 0,
        records: [],
        summary: {
          created: 0,
          updated: 0,
          errors: [],
          missingFields: [],
        },
      };
    }
    
    // 处理每条 post
    const records: SyncedRecord[] = [];
    const batchRecords: Array<{
      wpId: number | null;
      extractedFields: Record<string, ExtractedField>;
      postTitle: string;
    }> = [];
    
    logger.info('开始处理 posts...');
    
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const progress = ((i + 1) / posts.length * 100).toFixed(1);
      
      if ((i + 1) % 10 === 0 || i === 0) {
        logger.info(`进度: ${i + 1}/${posts.length} (${progress}%)`);
      }
      
      try {
        // 提取字段
        const extractedFields = extractFields(post, config);
        
        // 分析缺失字段
        const diagnoses = analyzeMissingFields(post, extractedFields, config);
        
        // 获取 post 标题
        const postTitle = typeof post.title === 'string'
          ? post.title
          : post.title?.rendered || `Post ${post.id}`;
        
        // 准备 upsert 数据
        const wpId = post.id || null;
        batchRecords.push({
          wpId,
          extractedFields,
          postTitle,
        });
        
        // 创建记录对象（待同步）
        const record: SyncedRecord = {
          wpPostId: post.id,
          wpPostSlug: post.slug,
          timestamp: new Date(),
          fetchedFields: extractedFields,
          dbStatus: 'skipped', // 待更新
          diagnoses,
        };
        
        records.push(record);
        
        // 如果有诊断信息，记录
        if (diagnoses.length > 0) {
          const report = generateDiagnosisReport(diagnoses, post, config);
          if (report) {
            logger.warn(`Post ID ${post.id} 字段诊断:${report}`);
          }
        }
      } catch (error: any) {
        logger.error(`处理 post ${post.id} 时出错:`, error.message);
        records.push({
          wpPostId: post.id,
          wpPostSlug: post.slug,
          timestamp: new Date(),
          fetchedFields: {},
          dbStatus: 'error',
          errorDetails: error.message,
          diagnoses: [],
        });
      }
    }
    
    // 批量同步到数据库
    logger.info('开始同步到数据库...');
    const syncResults = await syncService.batchUpsert(batchRecords);
    
    // 更新记录状态
    let successCount = 0;
    let errorCount = 0;
    let createdCount = 0;
    let updatedCount = 0;
    const errors: Array<{ wpId: number; error: string }> = [];
    const missingFields: Array<{ wpId: number; field: string; diagnosis: any }> = [];
    
    for (let i = 0; i < records.length && i < syncResults.length; i++) {
      const record = records[i];
      const syncResult = syncResults[i];
      
      if (syncResult.success) {
        record.dbStatus = syncResult.created ? 'created' : 'updated';
        record.dbId = syncResult.id;
        successCount++;
        if (syncResult.created) {
          createdCount++;
        } else {
          updatedCount++;
        }
      } else {
        record.dbStatus = 'error';
        record.errorDetails = syncResult.error;
        errorCount++;
        errors.push({
          wpId: record.wpPostId,
          error: syncResult.error || 'Unknown error',
        });
      }
      
      // 收集缺失字段信息
      if (record.diagnoses.length > 0) {
        for (const diagnosis of record.diagnoses) {
          missingFields.push({
            wpId: record.wpPostId,
            field: diagnosis.fieldName,
            diagnosis,
          });
        }
      }
      
      // 记录到审计日志
      logger.logRecord(record);
    }
    
    // 构建结果
    const result: SyncResult = {
      totalFetched: posts.length,
      successCount,
      errorCount,
      skippedCount: 0,
      missingFieldsCount: missingFields.length,
      records,
      summary: {
        created: createdCount,
        updated: updatedCount,
        errors,
        missingFields,
      },
    };
    
    // 打印摘要
    logger.printSummary(result);
    
    // 验证提示
    if (!config.dryRun && result.totalFetched > 0) {
      logger.info('');
      logger.info('验证步骤:');
      logger.info('1. 运行 npx prisma studio 打开数据库查看');
      logger.info(`2. 检查 School 表中应有 ${result.totalFetched} 条记录（或更多，如果之前已有记录）`);
      logger.info(`3. 成功同步的记录数: ${result.successCount}`);
    }
    
    return result;
  } catch (error: any) {
    logger.error('同步过程中发生错误:', error.message);
    logger.error(error.stack);
    throw error;
  } finally {
    // 关闭连接
    await syncService.close();
    logger.close();
  }
}

// 运行主函数
if (require.main === module) {
  sync()
    .then((result) => {
      if (result.errorCount > 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

/**
 * 抽样同步函数
 * 从 WordPress 中随机抽样指定数量的 posts 进行同步测试
 */
async function syncSample(
  config: any,
  wpClient: WordPressClient,
  syncService: PrismaSyncService,
  logger: any
): Promise<SampleReport> {
  try {
    // 1. 获取所有 post IDs
    logger.info('获取所有 profile post IDs...');
    const { sampledIds, totalAvailable } = await wpClient.samplePostIds(config.sampleSize!);
    logger.info(`总可用记录数: ${totalAvailable}`);
    logger.info(`随机抽取的 IDs: ${sampledIds.join(', ')}`);
    
    // 2. 获取抽样的 posts 详细信息
    logger.info(`开始获取 ${sampledIds.length} 条抽样 posts 的详细信息...`);
    const posts: any[] = [];
    
    for (let i = 0; i < sampledIds.length; i++) {
      const id = sampledIds[i];
      const progress = ((i + 1) / sampledIds.length * 100).toFixed(1);
      logger.info(`进度: ${i + 1}/${sampledIds.length} (${progress}%) - 获取 post ID ${id}`);
      
      try {
        const post = await wpClient.getPost(id);
        if (post) {
          posts.push(post);
        } else {
          logger.warn(`⚠️  post ID ${id} 不存在（404），跳过`);
        }
      } catch (error: any) {
        logger.error(`获取 post ${id} 失败: ${error.message}`);
        // 继续处理其他 posts
      }
    }
    
    logger.info(`成功获取 ${posts.length} 条 posts 的详细信息`);
    
    // 3. 处理每条 post（复用主同步流程的所有组件）
    const records: SyncedRecord[] = [];
    const batchRecords: Array<{
      wpId: number | null;
      extractedFields: Record<string, ExtractedField>;
      postTitle: string;
      postPayload?: any; // 保存原始 API payload 用于诊断
    }> = [];
    
    logger.info('开始处理抽样 posts...');
    
    for (const post of posts) {
      try {
        // 提取字段
        const extractedFields = extractFields(post, config);
        
        // 分析缺失字段
        const diagnoses = analyzeMissingFields(post, extractedFields, config);
        
        // 获取 post 标题
        const postTitle = typeof post.title === 'string'
          ? post.title
          : post.title?.rendered || `Post ${post.id}`;
        
        // 准备 upsert 数据
        const wpId = post.id || null;
        batchRecords.push({
          wpId,
          extractedFields,
          postTitle,
          postPayload: post, // 保存原始 payload
        });
        
        // 创建记录对象
        const record: SyncedRecord = {
          wpPostId: post.id,
          wpPostSlug: post.slug,
          timestamp: new Date(),
          fetchedFields: extractedFields,
          dbStatus: 'skipped',
          diagnoses,
        };
        
        records.push(record);
        
        // 记录诊断信息
        if (diagnoses.length > 0) {
          const report = generateDiagnosisReport(diagnoses, post, config);
          if (report) {
            logger.warn(`Post ID ${post.id} 字段诊断:${report}`);
          }
        }
      } catch (error: any) {
        logger.error(`处理 post ${post.id} 时出错:`, error.message);
        records.push({
          wpPostId: post.id,
          wpPostSlug: post.slug || 'unknown',
          timestamp: new Date(),
          fetchedFields: {},
          dbStatus: 'error',
          errorDetails: error.message,
          diagnoses: [],
        });
      }
    }
    
    // 4. 批量同步到数据库
    logger.info('开始同步抽样数据到数据库...');
    const syncResults = await syncService.batchUpsert(
      batchRecords.map(r => ({
        wpId: r.wpId,
        extractedFields: r.extractedFields,
        postTitle: r.postTitle,
      }))
    );
    
    // 5. 更新记录状态并收集统计信息
    let successCount = 0;
    let failureCount = 0;
    const missingFieldsSummary: Record<string, number> = {};
    const recordsWithDiagnoses: Array<{
      wpId: number;
      wpSlug: string;
      diagnoses: any[];
      apiPayload?: any;
    }> = [];
    const warnings: string[] = [];
    
    for (let i = 0; i < records.length && i < syncResults.length; i++) {
      const record = records[i];
      const syncResult = syncResults[i];
      const batchRecord = batchRecords[i];
      
      if (syncResult.success) {
        record.dbStatus = syncResult.created ? 'created' : 'updated';
        record.dbId = syncResult.id;
        successCount++;
      } else {
        record.dbStatus = 'error';
        record.errorDetails = syncResult.error;
        failureCount++;
      }
      
      // 统计缺失字段
      for (const diagnosis of record.diagnoses) {
        if (!missingFieldsSummary[diagnosis.fieldName]) {
          missingFieldsSummary[diagnosis.fieldName] = 0;
        }
        missingFieldsSummary[diagnosis.fieldName]++;
      }
      
      // 收集有诊断的记录
      if (record.diagnoses.length > 0) {
        recordsWithDiagnoses.push({
          wpId: record.wpPostId,
          wpSlug: record.wpPostSlug,
          diagnoses: record.diagnoses,
          apiPayload: batchRecord?.postPayload,
        });
      }
      
      // 记录到审计日志
      logger.logRecord(record);
    }
    
    // 6. 计算失败率
    const failureRate = posts.length > 0 ? failureCount / posts.length : 0;
    
    // 7. 生成警告
    if (failureRate > (config.sampleFailureThreshold || 0.1)) {
      warnings.push(
        `失败率 ${(failureRate * 100).toFixed(1)}% 超过阈值 ${((config.sampleFailureThreshold || 0.1) * 100).toFixed(0)}%`
      );
    }
    
    // 检查关键字段缺失（例如 school_profile_type）
    const criticalFields = ['profileType', 'school_profile_type'];
    for (const field of criticalFields) {
      const missingCount = missingFieldsSummary[field] || 0;
      if (missingCount > 0 && missingCount / posts.length > 0.5) {
        warnings.push(
          `超过 50% 的记录缺少关键字段 "${field}"，建议检查 WordPress 配置`
        );
      }
    }
    
    // 8. 构建抽样报告
    const sampleReport: SampleReport = {
      sampleSize: config.sampleSize!,
      totalAvailable,
      sampledIds,
      successCount,
      failureCount,
      missingFieldsCount: recordsWithDiagnoses.length,
      failureRate,
      records,
      missingFieldsSummary,
      recordsWithDiagnoses,
      warnings,
    };
    
    return sampleReport;
  } catch (error: any) {
    logger.error('抽样同步过程中发生错误:', error.message);
    logger.error(error.stack);
    throw error;
  }
}

export { sync, syncSample };

