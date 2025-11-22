#!/usr/bin/env node
/**
 * 自动检测并修复 localhost:3000 无法访问的问题
 * 功能：
 * 1. 检测端口 3000 是否被占用
 * 2. 测试 localhost:3000 是否可访问
 * 3. 关闭无效的进程（如果有）
 * 4. 尝试启动开发服务器（如果需要）
 */

const { execSync, spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = 3000;
const TIMEOUT = 5000; // 5秒超时

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[步骤 ${step}] ${message}`, 'cyan');
}

/**
 * 检测端口是否被占用 (Windows)
 */
function checkPortWindows(port) {
  try {
    const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    if (result.trim()) {
      const lines = result.trim().split('\n');
      const pids = [];
      for (const line of lines) {
        const match = line.match(/\s+(\d+)\s*$/);
        if (match) {
          const pid = parseInt(match[1]);
          if (pid && !pids.includes(pid)) {
            pids.push(pid);
          }
        }
      }
      return pids;
    }
    return [];
  } catch (error) {
    return [];
  }
}

/**
 * 获取进程信息 (Windows)
 */
function getProcessInfo(pid) {
  try {
    const result = execSync(
      `wmic process where processid=${pid} get ProcessId,Name,CommandLine,ExecutablePath /format:list`,
      { encoding: 'utf8', timeout: 3000 }
    );
    
    const info = {
      pid: pid,
      name: null,
      path: null,
      commandLine: null,
    };

    const lines = result.split('\n');
    for (const line of lines) {
      if (line.startsWith('Name=')) {
        info.name = line.replace('Name=', '').trim();
      } else if (line.startsWith('ExecutablePath=')) {
        info.path = line.replace('ExecutablePath=', '').trim();
      } else if (line.startsWith('CommandLine=')) {
        info.commandLine = line.replace('CommandLine=', '').trim();
      }
    }

    return info;
  } catch (error) {
    return { pid, name: 'Unknown', path: null, commandLine: null };
  }
}

/**
 * 测试 URL 是否可访问
 */
function testUrl(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: TIMEOUT }, (res) => {
      resolve({
        success: true,
        statusCode: res.statusCode,
        headers: res.headers,
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Connection timeout',
      });
    });

    req.setTimeout(TIMEOUT);
  });
}

/**
 * 关闭进程 (Windows)
 */
function killProcess(pid) {
  try {
    log(`正在关闭进程 PID: ${pid}...`, 'yellow');
    execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    log(`无法关闭进程 ${pid}: ${error.message}`, 'red');
    return false;
  }
}

/**
 * 检查是否是 Next.js 开发服务器进程
 */
function isNextDevProcess(processInfo) {
  if (!processInfo.commandLine && !processInfo.path) {
    return false;
  }

  const cmd = (processInfo.commandLine || processInfo.path || '').toLowerCase();
  return cmd.includes('next') || 
         cmd.includes('node_modules/.bin/next') ||
         cmd.includes('npm') && cmd.includes('dev');
}

/**
 * 检查 .next 目录是否损坏
 */
function checkNextBuild() {
  const nextDir = path.join(process.cwd(), '.next');
  if (!fs.existsSync(nextDir)) {
    return { corrupted: true, reason: '.next directory does not exist' };
  }

  // 检查关键文件
  const criticalFiles = [
    path.join(nextDir, 'server', 'webpack-runtime.js'),
  ];

  for (const file of criticalFiles) {
    if (!fs.existsSync(file)) {
      return { corrupted: true, reason: `Missing critical file: ${file}` };
    }
  }

  // 检查是否有模块找不到错误
  const webpackRuntime = path.join(nextDir, 'server', 'webpack-runtime.js');
  try {
    const content = fs.readFileSync(webpackRuntime, 'utf8');
    // 如果文件存在但可能引用缺失的模块，我们也认为需要重建
    if (content.includes('vendor-chunks/next.js')) {
      const vendorChunksDir = path.join(nextDir, 'server', 'chunks', 'vendor-chunks');
      if (!fs.existsSync(vendorChunksDir)) {
        return { corrupted: true, reason: 'Missing vendor-chunks directory' };
      }
    }
  } catch (error) {
    // 文件读取失败，可能已损坏
    return { corrupted: true, reason: `Cannot read webpack-runtime.js: ${error.message}` };
  }

  return { corrupted: false };
}

/**
 * 清理 .next 目录
 */
function cleanNextBuild() {
  const nextDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(nextDir)) {
    log('正在清理损坏的 .next 构建目录...', 'yellow');
    try {
      fs.rmSync(nextDir, { recursive: true, force: true });
      log('✓ 已清理 .next 目录', 'green');
      return true;
    } catch (error) {
      log(`✗ 清理失败: ${error.message}`, 'red');
      log('提示: 请手动删除 .next 目录后重试', 'yellow');
      return false;
    }
  }
  return true;
}

/**
 * 主诊断函数
 */
async function diagnose() {
  log('\n🔍 开始诊断 localhost:3000 问题...', 'blue');

  // 步骤 1: 检查端口占用
  logStep(1, '检查端口 3000 是否被占用');
  const pids = checkPortWindows(PORT);
  
  if (pids.length > 0) {
    log(`✓ 发现端口 ${PORT} 被以下进程占用:`, 'yellow');
    const processInfos = [];
    for (const pid of pids) {
      const info = getProcessInfo(pid);
      processInfos.push(info);
      log(`  - PID: ${pid}, 进程名: ${info.name || 'Unknown'}`, 'yellow');
      if (info.commandLine) {
        log(`    命令: ${info.commandLine.substring(0, 100)}...`, 'yellow');
      }
    }

    // 步骤 2: 测试端口是否可访问
    logStep(2, '测试 localhost:3000 是否可访问');
    const testResult = await testUrl(`http://localhost:${PORT}`);
    
    if (testResult.success && testResult.statusCode === 200) {
      log(`✓ localhost:${PORT} 可以访问 (状态码: ${testResult.statusCode})`, 'green');
      log('\n✅ 服务器正在正常运行，无需修复！', 'green');
      return { needsFix: false, reason: 'Server is running normally' };
    } else if (testResult.success && testResult.statusCode === 500) {
      // 服务器运行但返回 500 错误，可能是构建问题
      log(`⚠ localhost:${PORT} 返回错误 (状态码: ${testResult.statusCode})`, 'yellow');
      log('检测到服务器错误，检查构建文件...', 'yellow');
      
      const buildCheck = checkNextBuild();
      if (buildCheck.corrupted) {
        log(`✗ 构建文件损坏: ${buildCheck.reason}`, 'red');
        return { needsFix: true, reason: `Build corrupted: ${buildCheck.reason}`, action: 'rebuild' };
      }
      
      return { needsFix: true, reason: 'Server returns 500 error', action: 'restart' };
    } else {
      log(`✗ localhost:${PORT} 无法访问 (错误: ${testResult.error})`, 'red');
      
      // 步骤 3: 尝试关闭无效进程
      logStep(3, '尝试关闭占用端口的无效进程');
      
      let killedAny = false;
      for (const info of processInfos) {
        // 如果是 Next.js 相关进程，或者无法确定，尝试关闭
        if (isNextDevProcess(info) || !info.commandLine) {
          if (killProcess(info.pid)) {
            killedAny = true;
            log(`✓ 已关闭进程 PID: ${info.pid}`, 'green');
            
            // 等待一下让端口释放
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 再次测试
            const retest = await testUrl(`http://localhost:${PORT}`);
            if (!retest.success) {
              log(`  ⚠ 端口仍未释放，继续尝试...`, 'yellow');
            } else {
              log(`  ✓ 端口已释放！`, 'green');
              return { needsFix: false, reason: 'Port released after killing process' };
            }
          }
        }
      }

      if (!killedAny) {
        log('⚠ 未发现可关闭的 Next.js 进程，可能需要手动检查', 'yellow');
      }
    }
  } else {
    log(`✓ 端口 ${PORT} 未被占用`, 'green');
    
    // 步骤 2: 测试端口是否可访问
    logStep(2, '测试 localhost:3000 是否可访问');
    const testResult = await testUrl(`http://localhost:${PORT}`);
    
    if (testResult.success) {
      log(`✓ localhost:${PORT} 可以访问 (状态码: ${testResult.statusCode})`, 'green');
      log('\n✅ 服务器正在正常运行，无需修复！', 'green');
      return { needsFix: false, reason: 'Server is running normally' };
    }
  }

  return { needsFix: true, reason: 'Port is free but server is not responding' };
}

/**
 * 检查项目依赖是否安装
 */
function checkDependencies() {
  logStep('检查', '检查项目依赖');
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    log('✗ node_modules 目录不存在，需要安装依赖', 'red');
    return false;
  }

  const nextPath = path.join(nodeModulesPath, 'next');
  if (!fs.existsSync(nextPath)) {
    log('✗ Next.js 未安装，需要运行 npm install', 'red');
    return false;
  }

  log('✓ 项目依赖已安装', 'green');
  return true;
}

/**
 * 启动开发服务器
 */
function startDevServer() {
  logStep('启动', '启动开发服务器');
  
  if (!checkDependencies()) {
    log('\n❌ 请先运行: npm install', 'red');
    return false;
  }

  log('正在启动 Next.js 开发服务器...', 'cyan');
  log('提示: 服务器将在后台启动，您可以关闭此窗口或按 Ctrl+C 停止服务器', 'yellow');
  
  const devProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd(),
  });

  devProcess.on('error', (error) => {
    log(`✗ 启动失败: ${error.message}`, 'red');
  });

  devProcess.on('exit', (code) => {
    if (code !== 0) {
      log(`✗ 开发服务器退出，代码: ${code}`, 'red');
    }
  });

  return true;
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const shouldStart = args.includes('--start') || args.includes('-s');

  try {
    const result = await diagnose();
    
    if (result.needsFix) {
      log('\n⚠ 需要修复: ' + result.reason, 'yellow');
      
      // 如果是构建问题，先清理
      if (result.action === 'rebuild') {
        logStep('修复', '清理损坏的构建文件');
        if (cleanNextBuild()) {
          log('✓ 构建文件已清理', 'green');
          
          // 如果端口被占用，先关闭进程
          const pids = checkPortWindows(PORT);
          if (pids && pids.length > 0) {
            logStep('修复', '关闭旧的服务器进程');
            for (const pid of pids) {
              const info = getProcessInfo(pid);
              if (isNextDevProcess(info)) {
                killProcess(pid);
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
          }
        }
      }
      
      if (shouldStart || result.action === 'rebuild') {
        log('\n🚀 自动启动开发服务器...', 'blue');
        startDevServer();
      } else {
        log('\n💡 提示: 运行以下命令修复问题:', 'cyan');
        if (result.action === 'rebuild') {
          log('  1. 清理构建: 删除 .next 目录（已自动完成）', 'cyan');
          log('  2. 手动启动: npm run dev', 'cyan');
        } else {
          log('  1. 手动启动: npm run dev', 'cyan');
        }
        log('  2. 或自动修复并启动: npm run fix:localhost:start', 'cyan');
      }
    } else {
      log('\n✅ 诊断完成，无需修复！', 'green');
    }
  } catch (error) {
    log(`\n❌ 诊断过程中出错: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { diagnose, testUrl, checkPortWindows };

