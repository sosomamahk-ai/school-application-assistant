#!/usr/bin/env node

/**
 * 验证自动申请脚本功能
 * 检查页面、API和文件是否存在
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 验证自动申请脚本功能...\n');

let hasErrors = false;

// 1. 检查页面文件
console.log('1. 检查页面文件...');
const pageFile = path.join(__dirname, '../src/pages/admin/auto-apply-scripts.tsx');
if (fs.existsSync(pageFile)) {
  console.log('   ✅ 页面文件存在:', pageFile);
} else {
  console.log('   ❌ 页面文件不存在:', pageFile);
  hasErrors = true;
}

// 2. 检查API文件
console.log('\n2. 检查API文件...');
const apiFile = path.join(__dirname, '../src/pages/api/admin/auto-apply-scripts.ts');
if (fs.existsSync(apiFile)) {
  console.log('   ✅ API文件存在:', apiFile);
} else {
  console.log('   ❌ API文件不存在:', apiFile);
  hasErrors = true;
}

// 3. 检查Layout组件中的导航链接
console.log('\n3. 检查导航链接...');
const layoutFile = path.join(__dirname, '../src/components/Layout.tsx');
if (fs.existsSync(layoutFile)) {
  const layoutContent = fs.readFileSync(layoutFile, 'utf-8');
  if (layoutContent.includes('/admin/auto-apply-scripts')) {
    console.log('   ✅ 导航链接已添加到Layout组件');
  } else {
    console.log('   ❌ 导航链接未添加到Layout组件');
    hasErrors = true;
  }
} else {
  console.log('   ❌ Layout文件不存在');
  hasErrors = true;
}

// 4. 检查脚本目录
console.log('\n4. 检查脚本目录...');
const scriptsDir = path.join(__dirname, '../src/modules/auto-apply/schools');
if (fs.existsSync(scriptsDir)) {
  console.log('   ✅ 脚本目录存在:', scriptsDir);
  const files = fs.readdirSync(scriptsDir);
  const scriptFiles = files.filter(f => f.endsWith('.ts') && f !== 'common.ts');
  console.log(`   📁 找到 ${scriptFiles.length} 个脚本文件`);
  scriptFiles.forEach(file => {
    console.log(`      - ${file}`);
  });
} else {
  console.log('   ⚠️  脚本目录不存在（首次使用时会自动创建）');
}

// 5. 检查service文件
console.log('\n5. 检查服务文件...');
const serviceFile = path.join(__dirname, '../src/modules/auto-apply/autoApplyService.ts');
if (fs.existsSync(serviceFile)) {
  console.log('   ✅ 服务文件存在:', serviceFile);
  const serviceContent = fs.readFileSync(serviceFile, 'utf-8');
  if (serviceContent.includes('scriptRegistry')) {
    console.log('   ✅ 脚本注册表存在');
  } else {
    console.log('   ⚠️  脚本注册表可能有问题');
  }
} else {
  console.log('   ❌ 服务文件不存在');
  hasErrors = true;
}

// 6. 检查页面导出
console.log('\n6. 检查页面导出...');
if (fs.existsSync(pageFile)) {
  const pageContent = fs.readFileSync(pageFile, 'utf-8');
  if (pageContent.includes('export default')) {
    console.log('   ✅ 页面有默认导出');
  } else {
    console.log('   ❌ 页面缺少默认导出');
    hasErrors = true;
  }
  
  if (pageContent.includes('AdminAutoApplyScriptsPage')) {
    console.log('   ✅ 页面组件名称正确');
  } else {
    console.log('   ⚠️  页面组件名称可能不正确');
  }
}

// 7. 检查API导出
console.log('\n7. 检查API导出...');
if (fs.existsSync(apiFile)) {
  const apiContent = fs.readFileSync(apiFile, 'utf-8');
  if (apiContent.includes('export default async function handler')) {
    console.log('   ✅ API有默认导出');
  } else {
    console.log('   ❌ API缺少默认导出');
    hasErrors = true;
  }
}

// 总结
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ 发现一些问题，请检查上面的错误信息');
  process.exit(1);
} else {
  console.log('✅ 所有检查通过！');
  console.log('\n📝 下一步：');
  console.log('   1. 确保已提交代码到Git仓库');
  console.log('   2. 确保Vercel已部署最新代码');
  console.log('   3. 访问: https://sosomama.com/admin/auto-apply-scripts');
  console.log('   4. 确保使用管理员账号登录');
  console.log('   5. 检查浏览器控制台是否有错误');
  process.exit(0);
}

