import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env') });
config({ path: resolve(__dirname, '../.env.local') });

interface CheckResult {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  fix?: string;
}

async function checkACFToRESTAPIPlugin(baseUrl: string): Promise<CheckResult> {
  console.log('🔍 检查 1: ACF to REST API 插件是否安装并激活...');
  
  try {
    // 检查 ACF REST API v3 端点
    const acfV3Response = await fetch(`${baseUrl}/wp-json/acf/v3/profile/1`, {
      headers: { Accept: 'application/json' }
    });
    
    // 检查 ACF REST API v2 端点（旧版本）
    const acfV2Response = await fetch(`${baseUrl}/wp-json/acf/v2/profile/1`, {
      headers: { Accept: 'application/json' }
    });
    
    if (acfV3Response.ok || acfV2Response.ok) {
      return {
        check: 'ACF to REST API 插件',
        status: 'pass',
        message: '✅ ACF to REST API 插件已安装并激活',
        details: {
          v3Available: acfV3Response.ok,
          v2Available: acfV2Response.ok
        }
      };
    }
    
    // 如果 ACF REST API 端点不存在，检查标准 REST API 是否包含 ACF 数据
    const standardResponse = await fetch(`${baseUrl}/wp-json/wp/v2/profile?per_page=1&_embed&acf_format=standard`, {
      headers: { Accept: 'application/json' }
    });
    
    if (standardResponse.ok) {
      const data = await standardResponse.json();
      if (data.length > 0 && data[0].acf && typeof data[0].acf === 'object' && Object.keys(data[0].acf).length > 0) {
        return {
          check: 'ACF to REST API 插件',
          status: 'warning',
          message: '⚠️  ACF to REST API 插件可能未安装，但标准 REST API 返回了 ACF 数据',
          details: {
            acfFieldsFound: Object.keys(data[0].acf).length
          },
          fix: '建议安装 ACF to REST API 插件以确保完整的 ACF 支持'
        };
      }
    }
    
    return {
      check: 'ACF to REST API 插件',
      status: 'fail',
      message: '❌ ACF to REST API 插件未安装或未激活',
      fix: `1. 在 WordPress 后台安装 "ACF to REST API" 插件
2. 激活插件
3. 插件下载地址: https://wordpress.org/plugins/acf-to-rest-api/`
    };
  } catch (error: any) {
    return {
      check: 'ACF to REST API 插件',
      status: 'fail',
      message: `❌ 检查失败: ${error.message}`,
      details: { error: error.message }
    };
  }
}

async function checkACFFieldName(baseUrl: string): Promise<CheckResult> {
  console.log('🔍 检查 2: ACF 字段名是否为 name_short...');
  
  try {
    // 获取几个 profile 来检查字段名
    const response = await fetch(`${baseUrl}/wp-json/wp/v2/profile?per_page=10&_embed&acf_format=standard`, {
      headers: { Accept: 'application/json' }
    });
    
    if (!response.ok) {
      return {
        check: 'ACF 字段名',
        status: 'fail',
        message: `❌ 无法访问 WordPress REST API: ${response.status}`,
        details: { status: response.status }
      };
    }
    
    const profiles = await response.json();
    
    if (profiles.length === 0) {
      return {
        check: 'ACF 字段名',
        status: 'warning',
        message: '⚠️  没有找到任何 profile 数据',
        fix: '请确保 WordPress 中有 profile 类型的文章'
      };
    }
    
    // 检查所有可能的字段名变体
    const fieldNameVariants = ['name_short', 'nameShort', 'name-short', 'name_short_', 'school_short_name'];
    const foundFields: Record<string, number> = {};
    const sampleAcfData: any[] = [];
    
    for (const profile of profiles) {
      if (profile.acf && typeof profile.acf === 'object' && !Array.isArray(profile.acf)) {
        const acfKeys = Object.keys(profile.acf);
        sampleAcfData.push({
          id: profile.id,
          title: profile.title?.rendered || profile.title,
          acfKeys: acfKeys
        });
        
        // 检查每个可能的字段名
        for (const variant of fieldNameVariants) {
          if (profile.acf[variant]) {
            foundFields[variant] = (foundFields[variant] || 0) + 1;
          }
        }
        
        // 也检查包含 "name" 和 "short" 的字段
        for (const key of acfKeys) {
          const lowerKey = key.toLowerCase();
          if (lowerKey.includes('name') && lowerKey.includes('short')) {
            if (!fieldNameVariants.includes(key)) {
              foundFields[key] = (foundFields[key] || 0) + 1;
            }
          }
        }
      }
    }
    
    if (foundFields['name_short']) {
      return {
        check: 'ACF 字段名',
        status: 'pass',
        message: '✅ 找到 name_short 字段',
        details: {
          foundInProfiles: foundFields['name_short'],
          totalProfiles: profiles.length,
          allFoundFields: foundFields
        }
      };
    }
    
    if (Object.keys(foundFields).length > 0) {
      return {
        check: 'ACF 字段名',
        status: 'warning',
        message: `⚠️  未找到 name_short 字段，但找到了其他可能的字段: ${Object.keys(foundFields).join(', ')}`,
        details: {
          foundFields: foundFields,
          sampleAcfData: sampleAcfData.slice(0, 3)
        },
        fix: `请将 ACF 字段名改为 name_short，或更新代码以使用找到的字段名: ${Object.keys(foundFields)[0]}`
      };
    }
    
    // 检查是否有 ACF 数据但没有相关字段
    const hasAcfData = profiles.some((p: any) => p.acf && typeof p.acf === 'object' && Object.keys(p.acf).length > 0);
    
    if (hasAcfData) {
      return {
        check: 'ACF 字段名',
        status: 'fail',
        message: '❌ 有 ACF 数据，但未找到 name_short 字段',
        details: {
          sampleAcfData: sampleAcfData.slice(0, 3)
        },
        fix: '请在 WordPress ACF 中创建名为 name_short 的字段'
      };
    }
    
    return {
      check: 'ACF 字段名',
      status: 'fail',
      message: '❌ 未找到任何 ACF 数据',
      details: {
        totalProfiles: profiles.length,
        profilesWithAcf: profiles.filter((p: any) => p.acf && typeof p.acf === 'object').length
      },
      fix: '请先解决 ACF 数据在 REST API 中可见的问题'
    };
  } catch (error: any) {
    return {
      check: 'ACF 字段名',
      status: 'fail',
      message: `❌ 检查失败: ${error.message}`,
      details: { error: error.message }
    };
  }
}

async function checkACFVisibleInRESTAPI(baseUrl: string): Promise<CheckResult> {
  console.log('🔍 检查 3: ACF 字段是否在 REST API 中可见...');
  
  try {
    // 测试标准 REST API
    const standardResponse = await fetch(`${baseUrl}/wp-json/wp/v2/profile?per_page=5&_embed&acf_format=standard`, {
      headers: { Accept: 'application/json' }
    });
    
    if (!standardResponse.ok) {
      return {
        check: 'ACF 在 REST API 中可见',
        status: 'fail',
        message: `❌ 无法访问 WordPress REST API: ${standardResponse.status}`,
        details: { status: standardResponse.status }
      };
    }
    
    const profiles = await standardResponse.json();
    
    if (profiles.length === 0) {
      return {
        check: 'ACF 在 REST API 中可见',
        status: 'warning',
        message: '⚠️  没有找到任何 profile 数据',
        fix: '请确保 WordPress 中有 profile 类型的文章'
      };
    }
    
    // 统计有多少 profile 有 ACF 数据
    const profilesWithAcf = profiles.filter((p: any) => {
      if (!p.acf) return false;
      if (Array.isArray(p.acf)) return p.acf.length > 0;
      if (typeof p.acf === 'object') return Object.keys(p.acf).length > 0;
      return false;
    });
    
    const acfDataSamples = profilesWithAcf.slice(0, 3).map((p: any) => ({
      id: p.id,
      title: p.title?.rendered || p.title,
      acfType: typeof p.acf,
      acfIsArray: Array.isArray(p.acf),
      acfKeys: p.acf && typeof p.acf === 'object' && !Array.isArray(p.acf) 
        ? Object.keys(p.acf) 
        : (Array.isArray(p.acf) ? `Array(${p.acf.length})` : 'N/A')
    }));
    
    if (profilesWithAcf.length === profiles.length) {
      return {
        check: 'ACF 在 REST API 中可见',
        status: 'pass',
        message: `✅ 所有 profile 的 ACF 数据在 REST API 中可见 (${profilesWithAcf.length}/${profiles.length})`,
        details: {
          totalProfiles: profiles.length,
          profilesWithAcf: profilesWithAcf.length,
          samples: acfDataSamples
        }
      };
    }
    
    if (profilesWithAcf.length > 0) {
      return {
        check: 'ACF 在 REST API 中可见',
        status: 'warning',
        message: `⚠️  部分 profile 的 ACF 数据在 REST API 中可见 (${profilesWithAcf.length}/${profiles.length})`,
        details: {
          totalProfiles: profiles.length,
          profilesWithAcf: profilesWithAcf.length,
          samples: acfDataSamples
        },
        fix: '某些 profile 的 ACF 字段可能未设置为在 REST API 中可见，请检查 ACF 字段组设置'
      };
    }
    
    // 尝试 ACF REST API 端点
    const acfResponse = await fetch(`${baseUrl}/wp-json/acf/v3/profile/${profiles[0].id}`, {
      headers: { Accept: 'application/json' }
    });
    
    if (acfResponse.ok) {
      return {
        check: 'ACF 在 REST API 中可见',
        status: 'warning',
        message: '⚠️  标准 REST API 未返回 ACF 数据，但 ACF REST API 端点可用',
        details: {
          standardApiHasAcf: false,
          acfApiAvailable: true
        },
        fix: '建议使用 ACF REST API 端点 (/wp-json/acf/v3/) 或配置 ACF 字段在标准 REST API 中可见'
      };
    }
    
    return {
      check: 'ACF 在 REST API 中可见',
      status: 'fail',
      message: '❌ ACF 数据在 REST API 中不可见',
      details: {
        totalProfiles: profiles.length,
        profilesWithAcf: 0,
        samples: acfDataSamples
      },
      fix: `1. 确保安装了 ACF to REST API 插件
2. 在 ACF 字段组设置中，启用 "Show in REST API"
3. 检查字段组的 "Location Rules" 确保应用到正确的 post type
4. 如果使用 ACF Pro，检查 "REST API" 设置`
    };
  } catch (error: any) {
    return {
      check: 'ACF 在 REST API 中可见',
      status: 'fail',
      message: `❌ 检查失败: ${error.message}`,
      details: { error: error.message }
    };
  }
}

async function main() {
  const baseUrl = process.env.WORDPRESS_BASE_URL || process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL;
  
  if (!baseUrl) {
    console.error('❌ WordPress base URL 未配置');
    console.error('请在 .env 文件中设置 WORDPRESS_BASE_URL 或 NEXT_PUBLIC_WORDPRESS_BASE_URL');
    process.exit(1);
  }
  
  console.log('🔍 开始检查 ACF 配置...\n');
  console.log(`WordPress URL: ${baseUrl}\n`);
  console.log('='.repeat(60));
  console.log('');
  
  const results: CheckResult[] = [];
  
  // 执行所有检查
  results.push(await checkACFToRESTAPIPlugin(baseUrl));
  console.log('');
  
  results.push(await checkACFFieldName(baseUrl));
  console.log('');
  
  results.push(await checkACFVisibleInRESTAPI(baseUrl));
  console.log('');
  
  // 输出总结
  console.log('='.repeat(60));
  console.log('📊 检查结果总结\n');
  
  const passed = results.filter(r => r.status === 'pass').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const failed = results.filter(r => r.status === 'fail').length;
  
  results.forEach(result => {
    console.log(`${result.message}`);
    if (result.details) {
      console.log(`   详情: ${JSON.stringify(result.details, null, 2).split('\n').join('\n   ')}`);
    }
    if (result.fix) {
      console.log(`   修复建议:`);
      result.fix.split('\n').forEach(line => {
        console.log(`     ${line}`);
      });
    }
    console.log('');
  });
  
  console.log('='.repeat(60));
  console.log(`✅ 通过: ${passed} | ⚠️  警告: ${warnings} | ❌ 失败: ${failed}`);
  console.log('='.repeat(60));
  
  if (failed > 0) {
    console.log('\n❌ 发现问题，请根据上述修复建议进行修复');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('\n⚠️  发现警告，建议检查并修复');
    process.exit(0);
  } else {
    console.log('\n✅ 所有检查通过！');
    process.exit(0);
  }
}

main()
  .catch((error) => {
    console.error('\n❌ 检查过程出错:', error);
    process.exit(1);
  });

