/**
 * 测试页面 - 用于验证路由是否正常工作
 * 访问: /admin/auto-apply-scripts-test
 */
import Head from 'next/head';
import Layout from '@/components/Layout';

export default function AutoApplyScriptsTestPage() {
  return (
    <>
      <Head>
        <title>自动申请脚本测试页面</title>
      </Head>
      <Layout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">✅ 测试页面加载成功！</h1>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="font-semibold text-green-900 mb-2">路由测试</h2>
              <p className="text-green-800">如果您能看到这个页面，说明路由配置正常。</p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="font-semibold text-blue-900 mb-2">下一步测试</h2>
              <ul className="list-disc list-inside text-blue-800 space-y-1">
                <li>访问: <code className="bg-blue-100 px-2 py-1 rounded">/admin/auto-apply-scripts</code></li>
                <li>如果404，说明文件可能没有部署到生产环境</li>
                <li>检查导航菜单是否显示"自动申请脚本"链接</li>
                <li>确保使用管理员账号登录</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h2 className="font-semibold text-yellow-900 mb-2">调试信息</h2>
              <div className="text-yellow-800 space-y-2">
                <p><strong>当前路径:</strong> /admin/auto-apply-scripts-test</p>
                <p><strong>目标路径:</strong> /admin/auto-apply-scripts</p>
                <p><strong>文件位置:</strong> src/pages/admin/auto-apply-scripts.tsx</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

