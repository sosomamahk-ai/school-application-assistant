import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import {
  Users,
  Search,
  RefreshCw,
  Shield,
  ShieldOff,
  Trash2,
  Loader2
} from 'lucide-react';
import jwt from 'jsonwebtoken';
import type { JWTPayload } from '@/utils/auth';
import { getTokenFromCookieHeader } from '@/utils/token';

interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
  fullName: string | null;
}

const ROLE_BADGE_STYLES: Record<'admin' | 'user', string> = {
  admin: 'bg-purple-100 text-purple-700',
  user: 'bg-blue-100 text-blue-700'
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');

  const fetchUsers = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query) {
        params.set('search', query);
      }
      if (roleFilter !== 'all') {
        params.set('role', roleFilter);
      }

      const queryString = params.toString();
      const endpoint = queryString ? `/api/admin/users?${queryString}` : '/api/admin/users';
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '加载用户列表失败');
      }

      setUsers(data.users || []);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError(err.message || '加载失败');
      if (err?.status === 401 || err?.status === 403) {
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  }, [query, roleFilter, router]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/auth/login');
      return;
    }
    try {
      const parsed = JSON.parse(userStr);
      if (parsed.role !== 'admin') {
        router.push('/');
        return;
      }
    } catch {
      router.push('/auth/login');
      return;
    }

    fetchUsers();
  }, [fetchUsers, router]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setQuery(searchInput.trim());
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setQuery('');
    setRoleFilter('all');
  };

  const handleRoleToggle = async (user: AdminUser) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    if (
      nextRole === 'user' &&
      !confirm(`确定要将 ${user.email} 降级为普通用户吗？`)
    ) {
      return;
    }
    if (
      nextRole === 'admin' &&
      !confirm(`确定要将 ${user.email} 升级为管理员吗？`)
    ) {
      return;
    }

    try {
      setActionLoading(user.id);
      const response = await fetch(`/api/admin/user/${user.id}/role`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: nextRole })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '更新角色失败');
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u))
      );
    } catch (err: any) {
      alert(err.message || '更新角色失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (!confirm(`确定要永久删除 ${user.email} 吗？此操作不可恢复。`)) {
      return;
    }

    try {
      setActionLoading(user.id);
      const response = await fetch(`/api/admin/user/${user.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || '删除用户失败');
      }

      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err: any) {
      alert(err.message || '删除用户失败');
    } finally {
      setActionLoading(null);
    }
  };

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === 'admin').length;
    const normal = total - admins;
    return { total, admins, normal };
  }, [users]);

  return (
    <Layout>
      <Head>
        <title>用户管理 - 管理后台</title>
      </Head>

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
            <Users className="h-8 w-8 text-primary-600" />
            <span>用户管理</span>
          </h1>
          <p className="text-gray-600 mt-2">
            查看、搜索并管理系统中的所有用户账号
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-xl shadow border border-gray-100">
            <p className="text-sm text-gray-500">用户总数</p>
            <p className="text-3xl font-semibold text-gray-900">{stats.total}</p>
          </div>
          <div className="p-4 bg-white rounded-xl shadow border border-gray-100">
            <p className="text-sm text-gray-500">管理员</p>
            <p className="text-3xl font-semibold text-purple-700">{stats.admins}</p>
          </div>
          <div className="p-4 bg-white rounded-xl shadow border border-gray-100">
            <p className="text-sm text-gray-500">普通用户</p>
            <p className="text-3xl font-semibold text-blue-700">{stats.normal}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-100 p-6 space-y-6">
          <form
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            onSubmit={handleSearchSubmit}
          >
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                搜索（邮箱 / 姓名）
              </label>
              <div className="relative">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="input-field pl-10"
                  placeholder="输入邮箱或姓名关键字"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                角色筛选
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'user')}
                className="input-field"
              >
                <option value="all">全部</option>
                <option value="admin">管理员</option>
                <option value="user">普通用户</option>
              </select>
            </div>

            <div className="flex items-end space-x-3">
              <button
                type="submit"
                className="btn-primary flex-1 flex items-center justify-center space-x-2"
              >
                <Search className="h-4 w-4" />
                <span>搜索</span>
              </button>
              <button
                type="button"
                onClick={() => fetchUsers()}
                className="btn-secondary px-3"
                title="刷新列表"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn-secondary px-3"
                title="清除筛选"
              >
                重置
              </button>
            </div>
          </form>

          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    姓名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    邮箱
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    注册时间
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
                        <span>正在加载用户数据...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                      暂无用户数据
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.fullName || '—'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${ROLE_BADGE_STYLES[user.role]}`}
                        >
                          {user.role === 'admin' ? '管理员' : '普通用户'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right space-x-2">
                        <button
                          onClick={() => handleRoleToggle(user)}
                          disabled={actionLoading === user.id}
                          className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium border ${
                            user.role === 'admin'
                              ? 'border-yellow-200 text-yellow-700 bg-yellow-50 hover:bg-yellow-100'
                              : 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                          } disabled:opacity-50`}
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : user.role === 'admin' ? (
                            <ShieldOff className="h-4 w-4 mr-2" />
                          ) : (
                            <Shield className="h-4 w-4 mr-2" />
                          )}
                          {user.role === 'admin' ? '降级' : '升级为管理员'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          disabled={actionLoading === user.id}
                          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          删除
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const token = getTokenFromCookieHeader(req.headers.cookie);

  if (!token) {
    return {
      redirect: {
        destination: '/',
        permanent: false
      }
    };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    if (decoded.role !== 'admin') {
      return {
        redirect: {
          destination: '/',
          permanent: false
        }
      };
    }
  } catch {
    return {
      redirect: {
        destination: '/',
        permanent: false
      }
    };
  }

  return { props: {} };
};

