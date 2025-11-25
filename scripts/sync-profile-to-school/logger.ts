/**
 * 日志模块
 * 支持控制台输出和文件日志
 */

import * as fs from 'fs';
import * as path from 'path';
import { SyncConfig } from './config';
import { SyncedRecord, SampleReport } from './types';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private config: SyncConfig;
  private logFileStream?: fs.WriteStream;
  private jsonlFileStream?: fs.WriteStream;

  constructor(config: SyncConfig) {
    this.config = config;
    
    // 初始化文件日志流
    if (config.logFilePath) {
      const logDir = path.dirname(config.logFilePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      this.logFileStream = fs.createWriteStream(config.logFilePath, { flags: 'a' });
      
      // 创建 JSONL 审计日志文件
      const jsonlPath = config.logFilePath.replace(/\.(log|txt)$/, '.jsonl');
      this.jsonlFileStream = fs.createWriteStream(jsonlPath, { flags: 'a' });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const configLevelIndex = levels.indexOf(this.config.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= configLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedArgs}`;
  }

  private writeToFile(message: string) {
    if (this.logFileStream) {
      this.logFileStream.write(message + '\n');
    }
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog('debug')) {
      const formatted = this.formatMessage('debug', message, ...args);
      console.debug(formatted);
      this.writeToFile(formatted);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog('info')) {
      const formatted = this.formatMessage('info', message, ...args);
      console.info(formatted);
      this.writeToFile(formatted);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog('warn')) {
      const formatted = this.formatMessage('warn', message, ...args);
      console.warn(formatted);
      this.writeToFile(formatted);
    }
  }

  error(message: string, ...args: any[]) {
    if (this.shouldLog('error')) {
      const formatted = this.formatMessage('error', message, ...args);
      console.error(formatted);
      this.writeToFile(formatted);
    }
  }

  /**
   * 记录同步记录到 JSONL 审计日志
   */
  logRecord(record: SyncedRecord) {
    if (this.jsonlFileStream) {
      this.jsonlFileStream.write(JSON.stringify(record) + '\n');
    }
  }

  /**
   * 打印同步摘要
   */
  printSummary(result: {
    totalFetched: number;
    successCount: number;
    errorCount: number;
    skippedCount: number;
    missingFieldsCount: number;
    summary: {
      created: number;
      updated: number;
      errors: Array<{ wpId: number; error: string }>;
      missingFields: Array<{ wpId: number; field: string; diagnosis: any }>;
    };
  }) {
    this.info('═══════════════════════════════════════════════════════════');
    this.info('同步摘要 (Sync Summary)');
    this.info('═══════════════════════════════════════════════════════════');
    this.info(`总共拉取: ${result.totalFetched} 条记录`);
    this.info(`成功同步: ${result.successCount} 条`);
    this.info(`创建新记录: ${result.summary.created} 条`);
    this.info(`更新记录: ${result.summary.updated} 条`);
    this.info(`跳过: ${result.skippedCount} 条`);
    this.info(`错误: ${result.errorCount} 条`);
    this.info(`缺失字段: ${result.missingFieldsCount} 条记录`);
    
    if (result.summary.errors.length > 0) {
      this.error('\n错误详情:');
      result.summary.errors.slice(0, 10).forEach(({ wpId, error }) => {
        this.error(`  WP Post ID ${wpId}: ${error}`);
      });
      if (result.summary.errors.length > 10) {
        this.error(`  ... 还有 ${result.summary.errors.length - 10} 个错误`);
      }
    }
    
    if (result.summary.missingFields.length > 0) {
      this.warn('\n缺失字段详情（前 10 条）:');
      result.summary.missingFields.slice(0, 10).forEach(({ wpId, field, diagnosis }) => {
        this.warn(`  WP Post ID ${wpId} - 字段 "${field}":`);
        this.warn(`    可能原因: ${diagnosis.possibleReasons.join('; ')}`);
        if (diagnosis.curlExample) {
          this.warn(`    验证命令: ${diagnosis.curlExample}`);
        }
      });
      if (result.summary.missingFields.length > 10) {
        this.warn(`  ... 还有 ${result.summary.missingFields.length - 10} 条缺失字段记录`);
      }
    }
    
    this.info('═══════════════════════════════════════════════════════════');
    
    if (this.config.dryRun) {
      this.info('⚠️  DRY RUN 模式：未实际修改数据库');
    } else {
      this.info('✅ 同步完成！请运行 npx prisma studio 验证数据');
    }
  }

  /**
   * 打印抽样报告
   */
  printSampleReport(report: SampleReport) {
    this.info('═══════════════════════════════════════════════════════════');
    this.info('抽样同步报告 (Sample Sync Report)');
    this.info('═══════════════════════════════════════════════════════════');
    this.info(`抽样数量: ${report.sampleSize}`);
    this.info(`总可用记录数: ${report.totalAvailable}`);
    this.info(`成功同步数量: ${report.successCount}`);
    this.info(`失败数量: ${report.failureCount}`);
    this.info(`缺失字段记录数: ${report.missingFieldsCount}`);
    this.info(`失败率: ${(report.failureRate * 100).toFixed(1)}%`);
    
    if (report.sampledIds.length > 0) {
      this.info(`\n抽样的 Post IDs: ${report.sampledIds.join(', ')}`);
    }
    
    // 缺失字段统计
    if (Object.keys(report.missingFieldsSummary).length > 0) {
      this.warn('\n缺失字段统计:');
      for (const [field, count] of Object.entries(report.missingFieldsSummary)) {
        this.warn(`  ${field}: ${count} 条记录缺失`);
      }
    }
    
    // 警告信息
    if (report.warnings.length > 0) {
      this.error('\n⚠️  警告:');
      for (const warning of report.warnings) {
        this.error(`  ${warning}`);
      }
    }
    
    // 失败记录详情
    if (report.failureCount > 0) {
      this.error('\n失败记录详情:');
      const failedRecords = report.records.filter(r => r.dbStatus === 'error');
      failedRecords.slice(0, 10).forEach(record => {
        this.error(`  WP Post ID ${record.wpPostId} (${record.wpPostSlug}): ${record.errorDetails || 'Unknown error'}`);
      });
      if (failedRecords.length > 10) {
        this.error(`  ... 还有 ${failedRecords.length - 10} 条失败记录`);
      }
    }
    
    // 带诊断的记录
    if (report.recordsWithDiagnoses.length > 0) {
      this.warn('\n字段缺失诊断详情（前 5 条）:');
      report.recordsWithDiagnoses.slice(0, 5).forEach(({ wpId, wpSlug, diagnoses, apiPayload }) => {
        this.warn(`\n  WP Post ID ${wpId} (${wpSlug}):`);
        for (const diagnosis of diagnoses) {
          this.warn(`    字段: ${diagnosis.fieldName}`);
          this.warn(`      状态: ${diagnosis.present ? '存在但为空' : '不存在'}`);
          this.warn(`      可能原因: ${diagnosis.possibleReasons.join('; ')}`);
          if (diagnosis.curlExample) {
            this.warn(`      验证命令: ${diagnosis.curlExample}`);
          }
        }
        
        // 如果有原始 API payload，输出关键部分
        if (apiPayload) {
          this.debug(`    原始 API 响应片段:`);
          const payload = typeof apiPayload === 'string' ? JSON.parse(apiPayload) : apiPayload;
          if (payload.acf) {
            this.debug(`      ACF 字段: ${Object.keys(payload.acf).join(', ') || '无'}`);
          } else {
            this.debug(`      ACF 对象: 不存在`);
          }
        }
      });
      if (report.recordsWithDiagnoses.length > 5) {
        this.warn(`  ... 还有 ${report.recordsWithDiagnoses.length - 5} 条记录有字段缺失`);
      }
    }
    
    this.info('\n' + '═'.repeat(60));
    
    // 失败率警告
    if (report.failureRate > (this.config.sampleFailureThreshold || 0.1)) {
      this.error('\n⚠️⚠️⚠️  重要警告 ⚠️⚠️⚠️');
      this.error(`抽样同步发现失败率 ${(report.failureRate * 100).toFixed(1)}% 超过阈值 ${((this.config.sampleFailureThreshold || 0.1) * 100).toFixed(0)}%`);
      this.error('建议在同步全部数据前先检查 WordPress 配置和脚本设置。');
      this.error('请查看上方的诊断详情，解决相关问题后再继续。');
    }
    
    // 手动确认提示
    this.info('\n📋 下一步操作:');
    if (this.config.dryRun) {
      this.info('✅ Dry Run 模式：未实际修改数据库');
    }
    this.info('如需继续同步全部 profile，请运行:');
    this.info('  npm run sync:profile-to-school');
    this.info('或者:');
    this.info('  ts-node --project tsconfig.scripts.json scripts/sync-profile-to-school/index.ts');
    this.info('\n注意：正式同步不会自动继续，需要您手动执行上述命令。');
    this.info('═══════════════════════════════════════════════════════════');
  }

  /**
   * 关闭日志流
   */
  close() {
    if (this.logFileStream) {
      this.logFileStream.end();
    }
    if (this.jsonlFileStream) {
      this.jsonlFileStream.end();
    }
  }
}

export function createLogger(config: SyncConfig): Logger {
  return new Logger(config);
}

