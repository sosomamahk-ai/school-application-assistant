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
import { useTranslation } from '@/contexts/TranslationContext';

interface AdminUser {
  id: string;
  email: string;
  username?: string | null;
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
  const { t } = useTranslation();
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
        throw new Error(data.error || t('admin.users.loadFailed'));
      }

      setUsers(data.users || []);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError(err.message || t('admin.users.loadError'));
      if (err?.status === 401 || err?.status === 403) {
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  }, [query, roleFilter, router, t]);

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
      !confirm(t('admin.users.confirmDowngrade').replace('{email}', user.email))
    ) {
      return;
    }
    if (
      nextRole === 'admin' &&
      !confirm(t('admin.users.confirmUpgrade').replace('{email}', user.email))
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
        throw new Error(data.error || t('admin.users.updateRoleFailed'));
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u))
      );
    } catch (err: any) {
      alert(err.message || t('admin.users.updateRoleFailed'));
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

    if (!confirm(t('admin.users.confirmDelete').replace('{email}', user.email))) {
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
        throw new Error(data.error || t('admin.users.deleteFailed'));
      }

      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err: any) {
      alert(err.message || t('admin.users.deleteFailed'));
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
        <title>{t('admin.users.title')} - {t('common.appName')}</title>
      </Head>

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
            <Users className="h-8 w-8 text-primary-600" />
            <span>{t('admin.users.title')}</span>
          </h1>
          <p className="text-gray-600 mt-2">
            {t('admin.users.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-xl shadow border border-gray-100">
            <p className="text-sm text-gray-500">{t('admin.users.totalUsers')}</p>
            <p className="text-3xl font-semibold text-gray-900">{stats.total}</p>
          </div>
          <div className="p-4 bg-white rounded-xl shadow border border-gray-100">
            <p className="text-sm text-gray-500">{t('admin.users.admins')}</p>
            <p className="text-3xl font-semibold text-purple-700">{stats.admins}</p>
          </div>
          <div className="p-4 bg-white rounded-xl shadow border border-gray-100">
            <p className="text-sm text-gray-500">{t('admin.users.normalUsers')}</p>
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
                {t('admin.users.searchLabel')}
              </label>
              <div className="relative">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="input-field pl-10"
                  placeholder={t('admin.users.searchPlaceholder')}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                {t('admin.users.roleFilter')}
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'user')}
                className="input-field"
              >
                <option value="all">{t('admin.users.all')}</option>
                <option value="admin">{t('admin.users.admin')}</option>
                <option value="user">{t('admin.users.user')}</option>
              </select>
            </div>

            <div className="flex items-end space-x-3">
              <button
                type="submit"
                className="btn-primary flex-1 flex items-center justify-center space-x-2"
              >
                <Search className="h-4 w-4" />
                <span>{t('admin.users.search')}</span>
              </button>
              <button
                type="button"
                onClick={() => fetchUsers()}
                className="btn-secondary px-3"
                title={t('admin.users.refreshTitle')}
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn-secondary px-3"
                title={t('admin.users.resetTitle')}
              >
                {t('admin.users.reset')}
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
                    {t('admin.users.name')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('admin.users.email')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('admin.users.role')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('admin.users.registeredAt')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('admin.users.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
                        <span>{t('admin.users.loading')}</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                      {t('admin.users.noUsers')}
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.fullName || '—'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span>{user.email}</span>
                          {user.username && (
                            <span className="text-xs text-gray-500">@{user.username}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${ROLE_BADGE_STYLES[user.role]}`}
                        >
                          {user.role === 'admin' ? t('admin.users.admin') : t('admin.users.user')}
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
                          {user.role === 'admin' ? t('admin.users.downgrade') : t('admin.users.upgradeToAdmin')}
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
                          {t('admin.users.delete')}
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

