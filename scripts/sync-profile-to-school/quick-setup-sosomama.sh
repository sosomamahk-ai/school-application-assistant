#!/bin/bash

# 快速配置 sosomama.com 的同步脚本

echo "═══════════════════════════════════════════════════════════"
echo "快速配置 sosomama.com WordPress 同步"
echo "═══════════════════════════════════════════════════════════"
echo ""

# 设置 WordPress URL
export WP_BASE_URL="https://sosomama.com"

echo "1. 设置 WordPress URL: $WP_BASE_URL"
echo ""

# 运行端点检测
echo "2. 检测 REST API 端点..."
echo ""

npm run sync:profile-to-school:detect-endpoint

echo ""
echo "3. 端点检测完成！"
echo ""
echo "下一步："
echo "  - 如果端点已自动更新，可以直接运行配置脚本"
echo "  - 如果需要手动配置认证信息，运行: npm run sync:profile-to-school:setup"
echo ""

