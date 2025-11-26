#!/usr/bin/env node

/**
 * 验证同步状态的脚本
 * 用于检查 WordPress 数据是否成功同步到数据库
 */

import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import { loadConfig } from './config';
import { extractFields } from './field-extractor';

dotenv.config();

const prisma = new PrismaClient();

interface SyncStats {
  total: number;
  withWpId: number;
  postType: {
    total: number;
    profile: number;
    university: number;
    null: number;
  };
  school_profile_type: {
    total: number;
    filled: number;
    null: number;
  };
  profileType: {
    total: number;
    filled: number;
    null: number;
  };
  nameEnglish: {
    total: number;
    filled: number;
    null: number;
  };
}

async function getSyncStats(): Promise<SyncStats> {
  const total = await prisma.school.count();
  const withWpId = await prisma.school.count({
    where: { wpId: { not: null } },
  });

  // 使用原始 SQL 查询来避免 TypeScript 类型问题
  const school_profile_type_filled_result = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count 
    FROM "School" 
    WHERE "wpId" IS NOT NULL 
    AND "school_profile_type" IS NOT NULL
  `;
  const school_profile_type_filled = Number(school_profile_type_filled_result[0]?.count || 0);

  const profileType_filled_result = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count 
    FROM "School" 
    WHERE "wpId" IS NOT NULL 
    AND "profileType" IS NOT NULL
  `;
  const profileType_filled = Number(profileType_filled_result[0]?.count || 0);

  const nameEnglish_filled = await prisma.school.count({
    where: {
      wpId: { not: null },
      nameEnglish: { not: null },
    },
  });

  // 统计 postType
  const postType_profile_result = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count 
    FROM "School" 
    WHERE "wpId" IS NOT NULL 
    AND "postType" = 'profile'
  `;
  const postType_profile = Number(postType_profile_result[0]?.count || 0);

  const postType_university_result = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count 
    FROM "School" 
    WHERE "wpId" IS NOT NULL 
    AND "postType" = 'university'
  `;
  const postType_university = Number(postType_university_result[0]?.count || 0);

  const postType_null_result = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count 
    FROM "School" 
    WHERE "wpId" IS NOT NULL 
    AND "postType" IS NULL
  `;
  const postType_null = Number(postType_null_result[0]?.count || 0);

  return {
    total,
    withWpId,
    postType: {
      total: withWpId,
      profile: postType_profile,
      university: postType_university,
      null: postType_null,
    },
    school_profile_type: {
      total: withWpId,
      filled: school_profile_type_filled,
      null: withWpId - school_profile_type_filled,
    },
    profileType: {
      total: withWpId,
      filled: profileType_filled,
      null: withWpId - profileType_filled,
    },
    nameEnglish: {
      total: withWpId,
      filled: nameEnglish_filled,
      null: withWpId - nameEnglish_filled,
    },
  };
}

async function verifySingleRecord(wpId: number) {
  const config = loadConfig();
  
  // 从数据库获取记录（使用原始查询避免类型问题）
  const dbRecords = await prisma.$queryRaw<Array<{
    id: string;
    name: string;
    wpId: number | null;
    nameEnglish: string | null;
    nameShort: string | null;
    school_profile_type: string | null;
    profileType: string | null;
    postType: string | null;
    country: string | null;
    location: string | null;
    bandType: string | null;
    metadataLastFetchedAt: Date | null;
  }>>`
    SELECT 
      id, name, "wpId", "nameEnglish", "nameShort", 
      "school_profile_type", "profileType", "postType",
      country, location, "bandType", "metadataLastFetchedAt"
    FROM "School"
    WHERE "wpId" = ${wpId}
    LIMIT 1
  `;
  const dbRecord = dbRecords[0];

  if (!dbRecord) {
    console.log(`❌ 数据库中未找到 wpId=${wpId} 的记录`);
    return;
  }

  // 从 WordPress 获取原始数据
  const wpUrl = `${config.wpBaseUrl}${config.wpApiProfileEndpoint}/${wpId}?_embed`;
  const wpResponse = await fetch(wpUrl, {
    headers: { 'Accept': 'application/json' },
  });

  if (!wpResponse.ok) {
    console.log(`❌ WordPress API 请求失败: ${wpResponse.status}`);
    return;
  }

  const wpPost = await wpResponse.json();
  
  // 提取字段
  const extractedFields = extractFields(wpPost, config);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`验证记录: wpId=${wpId}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`数据库记录:`);
  console.log(`  名称: ${dbRecord.name}`);
  console.log(`  postType: ${dbRecord.postType || '(null)'} ⭐`);
  console.log(`  nameEnglish: ${dbRecord.nameEnglish || '(null)'}`);
  console.log(`  nameShort: ${dbRecord.nameShort || '(null)'}`);
  console.log(`  school_profile_type (ACF): ${dbRecord.school_profile_type || '(null)'}`);
  console.log(`  profileType (Taxonomy): ${dbRecord.profileType || '(null)'}`);
  console.log(`  country: ${dbRecord.country || '(null)'}`);
  console.log(`  location: ${dbRecord.location || '(null)'}`);
  console.log(`  bandType: ${dbRecord.bandType || '(null)'}`);
  console.log(`  最后同步时间: ${dbRecord.metadataLastFetchedAt || '(null)'}`);

  console.log(`\nWordPress 原始数据:`);
  console.log(`  ACF school_profile_type: ${wpPost.acf?.school_profile_type || '(null)'}`);
  console.log(`  Taxonomy profile_type: ${wpPost._embedded?.['wp:term']?.flat().find((t: any) => t.taxonomy === 'profile_type')?.name || '(null)'}`);
  console.log(`  ACF name_english: ${wpPost.acf?.name_english || '(null)'}`);
  console.log(`  ACF name_short: ${wpPost.acf?.name_short || '(null)'}`);

  console.log(`\n提取的字段:`);
  console.log(`  schoolProfileTypeFromACF: ${extractedFields['schoolProfileTypeFromACF']?.value || '(null)'} (存在: ${extractedFields['schoolProfileTypeFromACF']?.present})`);
  console.log(`  profileTypeFromTaxonomy: ${extractedFields['profileTypeFromTaxonomy']?.value || '(null)'} (存在: ${extractedFields['profileTypeFromTaxonomy']?.present})`);
  console.log(`  nameEnglish: ${extractedFields['nameEnglish']?.value || '(null)'} (存在: ${extractedFields['nameEnglish']?.present})`);
  console.log(`  nameShort: ${extractedFields['nameShort']?.value || '(null)'} (存在: ${extractedFields['nameShort']?.present})`);

  // 比较
  console.log(`\n比较结果:`);
  const issues: string[] = [];
  
  if (extractedFields['schoolProfileTypeFromACF']?.value && dbRecord.school_profile_type !== extractedFields['schoolProfileTypeFromACF'].value) {
    issues.push(`school_profile_type 不匹配: DB=${dbRecord.school_profile_type}, WP=${extractedFields['schoolProfileTypeFromACF'].value}`);
  }
  
  if (extractedFields['profileTypeFromTaxonomy']?.value && dbRecord.profileType !== extractedFields['profileTypeFromTaxonomy'].value) {
    issues.push(`profileType 不匹配: DB=${dbRecord.profileType}, WP=${extractedFields['profileTypeFromTaxonomy'].value}`);
  }
  
  if (issues.length === 0) {
    console.log(`  ✅ 数据同步正确`);
  } else {
    console.log(`  ⚠️  发现不匹配:`);
    issues.forEach(issue => console.log(`    - ${issue}`));
  }
  console.log('═══════════════════════════════════════════════════════════\n');
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === '--wp-id' && args[1]) {
    // 验证单个记录
    const wpId = parseInt(args[1], 10);
    await verifySingleRecord(wpId);
    await prisma.$disconnect();
    return;
  }

  // 显示统计信息
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 同步状态统计');
  console.log('═══════════════════════════════════════════════════════════\n');

  const stats = await getSyncStats();

  console.log(`总记录数: ${stats.total}`);
  console.log(`有 wpId 的记录数: ${stats.withWpId} (${((stats.withWpId / stats.total) * 100).toFixed(1)}%)\n`);

  console.log(`postType (WordPress Post Type) ⭐:`);
  console.log(`  总数: ${stats.postType.total}`);
  console.log(`  profile: ${stats.postType.profile} (${((stats.postType.profile / stats.postType.total) * 100).toFixed(1)}%)`);
  console.log(`  university: ${stats.postType.university} (${((stats.postType.university / stats.postType.total) * 100).toFixed(1)}%)`);
  console.log(`  未设置: ${stats.postType.null} (${((stats.postType.null / stats.postType.total) * 100).toFixed(1)}%)\n`);

  console.log(`school_profile_type (ACF 字段):`);
  console.log(`  总数: ${stats.school_profile_type.total}`);
  console.log(`  已填充: ${stats.school_profile_type.filled} (${((stats.school_profile_type.filled / stats.school_profile_type.total) * 100).toFixed(1)}%)`);
  console.log(`  为空: ${stats.school_profile_type.null} (${((stats.school_profile_type.null / stats.school_profile_type.total) * 100).toFixed(1)}%)\n`);

  console.log(`profileType (Taxonomy 字段):`);
  console.log(`  总数: ${stats.profileType.total}`);
  console.log(`  已填充: ${stats.profileType.filled} (${((stats.profileType.filled / stats.profileType.total) * 100).toFixed(1)}%)`);
  console.log(`  为空: ${stats.profileType.null} (${((stats.profileType.null / stats.profileType.total) * 100).toFixed(1)}%)\n`);

  console.log(`nameEnglish (ACF 字段):`);
  console.log(`  总数: ${stats.nameEnglish.total}`);
  console.log(`  已填充: ${stats.nameEnglish.filled} (${((stats.nameEnglish.filled / stats.nameEnglish.total) * 100).toFixed(1)}%)`);
  console.log(`  为空: ${stats.nameEnglish.null} (${((stats.nameEnglish.null / stats.nameEnglish.total) * 100).toFixed(1)}%)\n`);

  // 查找有 wpId 但 school_profile_type 为 null 的记录
  const emptyProfileType_result = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count 
    FROM "School" 
    WHERE "wpId" IS NOT NULL 
    AND "school_profile_type" IS NULL
  `;
  const emptyProfileType = Number(emptyProfileType_result[0]?.count || 0);

  if (emptyProfileType > 0) {
    console.log(`⚠️  发现 ${emptyProfileType} 条记录有 wpId 但 school_profile_type 为 null`);
    console.log(`\n示例记录 (前 5 条):`);
    const examples = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      wpId: number;
      school_profile_type: string | null;
      profileType: string | null;
    }>>`
      SELECT id, name, "wpId", "school_profile_type", "profileType"
      FROM "School"
      WHERE "wpId" IS NOT NULL 
      AND "school_profile_type" IS NULL
      LIMIT 5
    `;

    examples.forEach(record => {
      console.log(`  - wpId=${record.wpId}, name="${record.name}", school_profile_type=${record.school_profile_type}, profileType=${record.profileType}`);
    });
  } else {
    console.log(`✅ 所有有 wpId 的记录都填充了 school_profile_type`);
  }

  // 显示最近同步的 university 记录示例
  if (stats.postType.university > 0) {
    console.log(`\n📚 最近同步的 University 记录示例 (前 5 条):`);
    const universityExamples = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      wpId: number;
      postType: string | null;
      nameEnglish: string | null;
      nameShort: string | null;
      metadataLastFetchedAt: Date | null;
    }>>`
      SELECT id, name, "wpId", "postType", "nameEnglish", "nameShort", "metadataLastFetchedAt"
      FROM "School"
      WHERE "wpId" IS NOT NULL 
      AND "postType" = 'university'
      ORDER BY "metadataLastFetchedAt" DESC NULLS LAST, "updatedAt" DESC
      LIMIT 5
    `;

    universityExamples.forEach((record, index) => {
      console.log(`  ${index + 1}. wpId=${record.wpId}, name="${record.name}"`);
      console.log(`     postType=${record.postType}, nameEnglish=${record.nameEnglish || '(null)'}, nameShort=${record.nameShort || '(null)'}`);
      console.log(`     最后同步: ${record.metadataLastFetchedAt ? new Date(record.metadataLastFetchedAt).toLocaleString() : '(null)'}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('使用方法:');
  console.log('  查看统计: npm run sync:profile-to-school:verify');
  console.log('  验证单条: npm run sync:profile-to-school:verify -- --wp-id <wpId>');
  console.log('═══════════════════════════════════════════════════════════\n');

  await prisma.$disconnect();
}

main().catch(console.error);
