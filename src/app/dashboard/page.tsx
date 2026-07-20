'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';

export default function DashboardHome() {
  const { lang, theme, t } = useApp();
  const [stats, setStats] = useState({
    propertiesCount: 0,
    pendingRequests: 0,
    activeProjects: 0,
    aiConversations: 0,
    aiTokens: 0,
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [modalType, setModalType] = useState<'log' | 'project' | 'request' | null>(null);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [propsRes, reqsRes, projRes, aiStats, logsRes] = await Promise.allSettled([
        api.get('/properties'),
        api.get('/services/requests/all'),
        api.get('/services/projects/all'),
        api.get('/ai/stats'),
        api.get('/audit-logs'),
      ]);

      const propertiesCount = propsRes.status === 'fulfilled' ? (propsRes.value?.total || 0) : 0;
      const allRequests = reqsRes.status === 'fulfilled' ? (reqsRes.value?.requests || []) : [];
      const pendingRequests = allRequests.filter((r: any) => r.status === 'NEW' || r.status === 'UNDER_REVIEW').length;
      const allProjects = projRes.status === 'fulfilled' ? (projRes.value?.projects || []) : [];
      const activeProjects = allProjects.filter((p: any) => p.status === 'IN_PROGRESS' || p.status === 'PLANNED').length;
      const aiConversations = aiStats.status === 'fulfilled' ? (aiStats.value?.totalConversations || 0) : 0;
      const aiTokens = aiStats.status === 'fulfilled' ? (aiStats.value?.totalTokens || 0) : 0;

      setStats({ propertiesCount, pendingRequests, activeProjects, aiConversations, aiTokens });
      setRecentRequests(allRequests.slice(0, 3));
      setRecentProjects(allProjects.slice(0, 3));
      const logs = logsRes.status === 'fulfilled' ? (logsRes.value?.logs || []) : [];
      setRecentLogs(logs.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard live content', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDashboardData(); }, []);

  const handleOpenDetail = (item: any, type: 'log' | 'project' | 'request') => {
    setSelectedItem(item);
    setModalType(type);
  };
  const handleCloseDetail = () => {
    setSelectedItem(null);
    setModalType(null);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-400">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  const CARDS = [
    {
      title: t('totalProperties'),
      value: stats.propertiesCount,
      label: t('activePropertyCount'),
      icon: '🏢',
      accent: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      border: 'border-amber-200/60 dark:border-amber-500/20',
      hover: 'hover:border-amber-400/60 dark:hover:border-amber-400/40',
      link: '/dashboard/properties',
    },
    {
      title: t('pendingRequests'),
      value: stats.pendingRequests,
      label: t('pendingRequestCount'),
      icon: '📝',
      accent: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
      border: 'border-blue-200/60 dark:border-blue-500/20',
      hover: 'hover:border-blue-400/60 dark:hover:border-blue-400/40',
      link: '/dashboard/requests',
    },
    {
      title: t('activeProjects'),
      value: stats.activeProjects,
      label: t('activeProjectCount'),
      icon: '⚙️',
      accent: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      border: 'border-emerald-200/60 dark:border-emerald-500/20',
      hover: 'hover:border-emerald-400/60 dark:hover:border-emerald-400/40',
      link: '/dashboard/projects',
    },
    {
      title: t('aiUsage'),
      value: stats.aiTokens.toLocaleString(),
      label: t('aiTokensLabel'),
      icon: '🤖',
      accent: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-500/10',
      border: 'border-purple-200/60 dark:border-purple-500/20',
      hover: 'hover:border-purple-400/60 dark:hover:border-purple-400/40',
      link: '/dashboard/settings',
    },
  ];

  const QUICK_LINKS = [
    { href: '/dashboard/properties', icon: '🏢', label: lang === 'ar' ? 'إضافة عقار جديد' : 'Add Property' },
    { href: '/dashboard/requests', icon: '📝', label: lang === 'ar' ? 'مراجعة الطلبات' : 'Review Requests' },
    { href: '/dashboard/services', icon: '🏗️', label: lang === 'ar' ? 'إدارة الخدمات' : 'Manage Services' },
    { href: '/dashboard/users', icon: '👥', label: lang === 'ar' ? 'إدارة الأعضاء' : 'Manage Users' },
    { href: '/dashboard/community', icon: '🌐', label: lang === 'ar' ? 'محتوى المجتمع' : 'Community' },
    { href: '/dashboard/settings', icon: '🔧', label: lang === 'ar' ? 'الإعدادات' : 'Settings' },
  ];

  const isRtl = lang === 'ar';
  const card = `rounded-2xl border transition-all duration-200 ${theme === 'dark' ? 'bg-zinc-900/60' : 'bg-white'}`;

  return (
    <div className={`space-y-7 ${isRtl ? 'text-right' : 'text-left'}`}>

      {/* ── Welcome Banner ── */}
      <div className={`relative rounded-2xl overflow-hidden border ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800/60 border-zinc-800/80'
          : 'bg-gradient-to-br from-white via-zinc-50 to-amber-50/40 border-zinc-200'
      } p-7 sm:p-8`}>
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 w-72 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[11px] font-bold text-primary tracking-wide uppercase">
                {lang === 'ar' ? 'النظام متصل ويعمل' : 'System Online'}
              </span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-black mb-2 ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
              {t('welcome')}
            </h1>
            <p className={`text-sm max-w-xl leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {t('welcomeSub')}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <div className={`text-center px-4 py-3 rounded-xl border ${
              theme === 'dark' ? 'bg-zinc-800/60 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="text-2xl font-black text-primary">{stats.propertiesCount + stats.activeProjects}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{lang === 'ar' ? 'إجمالي السجلات' : 'Total Records'}</div>
            </div>
            <div className={`text-center px-4 py-3 rounded-xl border ${
              theme === 'dark' ? 'bg-zinc-800/60 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="text-2xl font-black text-emerald-500">{stats.activeProjects}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{lang === 'ar' ? 'مشاريع نشطة' : 'Active Projects'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {CARDS.map((card, idx) => (
          <Link
            key={idx}
            href={card.link}
            className={`group block rounded-2xl border p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${card.bg} ${card.border} ${card.hover} ${
              theme === 'dark' ? 'shadow-black/20' : 'shadow-zinc-100'
            } shadow-sm`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                theme === 'dark' ? 'bg-zinc-800/80' : 'bg-white'
              } shadow-sm`}>
                {card.icon}
              </div>
              <span className={`text-[10px] font-extrabold uppercase tracking-wider ${card.accent}`}>
                {lang === 'ar' ? 'اجمالي' : 'Total'}
              </span>
            </div>
            <div className={`text-3xl sm:text-4xl font-black mb-1 ${card.accent}`}>
              {card.value}
            </div>
            <p className={`text-xs font-semibold ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {card.title}
            </p>
            <p className={`text-[10px] mt-0.5 ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
              {card.label}
            </p>
          </Link>
        ))}
      </div>

      {/* ── Middle Grid: Quick Access + Projects + Requests ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Quick Access */}
        <div className={`rounded-2xl border ${
          theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-zinc-200'
        } p-5 space-y-4`}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-4 rounded-full bg-primary" />
            <h3 className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
              {t('quickAccess')}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {QUICK_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border text-center transition-all duration-150 group ${
                  theme === 'dark'
                    ? 'bg-zinc-800/40 border-zinc-700/60 hover:bg-zinc-800 hover:border-primary/50'
                    : 'bg-zinc-50 border-zinc-200 hover:bg-primary/5 hover:border-primary/40'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className={`text-[10px] font-bold leading-tight ${
                  theme === 'dark' ? 'text-zinc-400 group-hover:text-zinc-100' : 'text-zinc-500 group-hover:text-zinc-800'
                }`}>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Active Projects Progress */}
        <div className={`rounded-2xl border ${
          theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-zinc-200'
        } p-5 space-y-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-emerald-500" />
              <h3 className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                {t('recentProjectsTitle')}
              </h3>
            </div>
            <Link href="/dashboard/projects" className="text-[11px] text-primary hover:underline font-bold">
              {t('viewAll')} →
            </Link>
          </div>
          <div className="space-y-3">
            {recentProjects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => handleOpenDetail(proj, 'project')}
                className={`group p-3.5 rounded-xl border cursor-pointer transition-all duration-150 ${
                  theme === 'dark'
                    ? 'bg-zinc-800/30 border-zinc-700/60 hover:bg-zinc-800/60 hover:border-zinc-600'
                    : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-xs font-bold truncate max-w-[65%] group-hover:text-primary transition ${
                    theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'
                  }`}>{proj.name}</span>
                  <span className="text-xs font-extrabold text-primary font-mono">{proj.progressPercentage}%</span>
                </div>
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                  theme === 'dark' ? 'bg-zinc-700' : 'bg-zinc-200'
                }`}>
                  <div
                    className="h-full primary-gradient rounded-full transition-all duration-500"
                    style={{ width: `${proj.progressPercentage}%` }}
                  />
                </div>
              </div>
            ))}
            {recentProjects.length === 0 && (
              <div className={`text-center py-8 text-xs italic ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                {t('noData')}
              </div>
            )}
          </div>
        </div>

        {/* Recent Requests */}
        <div className={`rounded-2xl border ${
          theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-zinc-200'
        } p-5 space-y-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-blue-500" />
              <h3 className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                {t('recentRequestsTitle')}
              </h3>
            </div>
            <Link href="/dashboard/requests" className="text-[11px] text-primary hover:underline font-bold">
              {t('viewAll')} →
            </Link>
          </div>
          <div className="space-y-2.5">
            {recentRequests.map((req) => (
              <div
                key={req.id}
                onClick={() => handleOpenDetail(req, 'request')}
                className={`group p-3.5 rounded-xl border cursor-pointer transition-all duration-150 flex items-center justify-between gap-3 ${
                  theme === 'dark'
                    ? 'bg-zinc-800/30 border-zinc-700/60 hover:bg-zinc-800/60 hover:border-zinc-600'
                    : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <span className={`block text-xs font-bold truncate group-hover:text-primary transition ${
                    theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'
                  }`}>{req.projectName}</span>
                  <span className={`block text-[10px] mt-0.5 truncate ${
                    theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
                  }`}>{req.location}</span>
                </div>
                <span className={`shrink-0 text-[9px] px-2 py-0.5 rounded-full border uppercase font-extrabold whitespace-nowrap ${
                  req.status === 'APPROVED' || req.status === 'PROJECT_CREATED'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                }`}>
                  {req.status === 'NEW' ? (lang === 'ar' ? 'جديد' : 'New')
                    : req.status === 'UNDER_REVIEW' ? (lang === 'ar' ? 'مراجعة' : 'Review')
                    : req.status === 'PROJECT_CREATED' ? (lang === 'ar' ? 'مُعتمد' : 'Approved')
                    : req.status}
                </span>
              </div>
            ))}
            {recentRequests.length === 0 && (
              <div className={`text-center py-8 text-xs italic ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                {t('noData')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── System Activity Logs Table ── */}
      <div className={`rounded-2xl border ${
        theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-zinc-200'
      } overflow-hidden`}>
        {/* Table header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-primary" />
            <div>
              <h3 className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                {t('recentSystemLogs')}
              </h3>
              <p className={`text-[11px] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {t('recentEvents')}
              </p>
            </div>
          </div>
          <Link href="/dashboard/logs" className="text-[11px] text-primary hover:underline font-bold">
            {t('viewAll')} →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className={`w-full text-xs border-collapse ${isRtl ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                theme === 'dark'
                  ? 'bg-zinc-900/40 border-zinc-800 text-zinc-500'
                  : 'bg-zinc-50/80 border-zinc-200 text-zinc-400'
              }`}>
                <th className="px-6 py-3">{t('logAction')}</th>
                <th className="px-6 py-3">{t('logUser')}</th>
                <th className="px-6 py-3 hidden md:table-cell">{t('logDate')}</th>
                <th className="px-6 py-3 hidden lg:table-cell">{t('logDetails')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-zinc-800/60' : 'divide-zinc-100'}`}>
              {recentLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => handleOpenDetail(log, 'log')}
                  className={`cursor-pointer transition-colors duration-150 ${
                    theme === 'dark'
                      ? 'hover:bg-zinc-800/40 text-zinc-300'
                      : 'hover:bg-zinc-50 text-zinc-600'
                  }`}
                >
                  <td className="px-6 py-3.5">
                    <span className="font-bold text-primary">{log.action}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex flex-col">
                      <span className={`font-semibold ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>
                        {log.user?.name || t('admin')}
                      </span>
                      <span className={`text-[10px] font-mono ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        {log.user?.email || 'system@afaq.com'}
                      </span>
                    </div>
                  </td>
                  <td className={`px-6 py-3.5 hidden md:table-cell font-mono text-[11px] ${
                    theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
                  }`}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className={`px-6 py-3.5 hidden lg:table-cell max-w-[200px] truncate ${
                    theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
                  }`}>
                    {log.description}
                  </td>
                </tr>
              ))}
              {recentLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className={`px-6 py-10 text-center text-xs italic ${
                    theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'
                  }`}>
                    {t('noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${isRtl ? 'text-right' : 'text-left'} ${
            theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between ${
              theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-primary" />
                <h3 className={`text-sm font-black ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                  {modalType === 'log' && ('📜 ' + t('logDetails'))}
                  {modalType === 'project' && ('⚙️ ' + (lang === 'ar' ? 'تفاصيل المشروع' : 'Project Details'))}
                  {modalType === 'request' && ('📝 ' + (lang === 'ar' ? 'تفاصيل الطلب' : 'Request Details'))}
                </h3>
              </div>
              <button
                onClick={handleCloseDetail}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
                  theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500'
                }`}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              {modalType === 'log' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                      <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{t('logAction')}</span>
                      <span className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>{selectedItem.action}</span>
                    </div>
                    <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                      <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{t('logDate')}</span>
                      <span className={`font-medium text-[11px] ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{new Date(selectedItem.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                    <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{t('logUser')}</span>
                    <span className={`font-semibold block ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>{selectedItem.user?.name || 'مدير النظام'}</span>
                    <span className={`text-[10px] font-mono ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{selectedItem.user?.email || 'system@afaq.com'}</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                    <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">IP & Agent</span>
                    <span className="text-primary font-mono font-bold">{selectedItem.ipAddress || '127.0.0.1'}</span>
                    <p className={`text-[10px] mt-1 font-mono break-all ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>{selectedItem.userAgent || 'Mozilla/5.0'}</p>
                  </div>
                  <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                    <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{lang === 'ar' ? 'الوصف' : 'Description'}</span>
                    <p className={`leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{selectedItem.description}</p>
                  </div>
                </div>
              )}

              {modalType === 'project' && (
                <div className="space-y-4">
                  <div>
                    <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{t('projectName')}</span>
                    <h4 className={`text-base font-extrabold ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>{selectedItem.name}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                      <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{lang === 'ar' ? 'الميزانية' : 'Budget'}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm font-mono">${selectedItem.budget?.toLocaleString()}</span>
                    </div>
                    <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                      <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{t('progress')}</span>
                      <span className="text-primary font-extrabold text-sm font-mono">{selectedItem.progressPercentage}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                      <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{lang === 'ar' ? 'تاريخ البدء' : 'Start Date'}</span>
                      <span className={`font-medium ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{new Date(selectedItem.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                      <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{lang === 'ar' ? 'التسليم المتوقع' : 'Expected End'}</span>
                      <span className={`font-medium ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{new Date(selectedItem.expectedEndDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {selectedItem.description && (
                    <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                      <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{lang === 'ar' ? 'وصف المشروع' : 'Description'}</span>
                      <p className={`leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{selectedItem.description}</p>
                    </div>
                  )}
                  <Link href="/dashboard/projects" className="block w-full text-center py-2.5 rounded-xl bg-primary text-zinc-950 font-bold text-xs hover:opacity-90 transition">
                    🛠️ {lang === 'ar' ? 'فتح لوحة التحكم بالمشروع' : 'Open Project Console'}
                  </Link>
                </div>
              )}

              {modalType === 'request' && (
                <div className="space-y-4">
                  <div>
                    <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{lang === 'ar' ? 'اسم الطلب' : 'Request Name'}</span>
                    <h4 className={`text-base font-extrabold ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>{selectedItem.projectName}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                      <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{lang === 'ar' ? 'الميزانية المتوقعة' : 'Expected Budget'}</span>
                      <span className="text-amber-600 dark:text-amber-400 font-extrabold text-sm font-mono">${selectedItem.expectedBudget?.toLocaleString()}</span>
                    </div>
                    <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                      <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{lang === 'ar' ? 'الموقع' : 'Location'}</span>
                      <span className={`font-bold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>{selectedItem.location}</span>
                    </div>
                  </div>
                  {selectedItem.description && (
                    <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                      <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{lang === 'ar' ? 'تفاصيل الطلب' : 'Details'}</span>
                      <p className={`leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{selectedItem.description}</p>
                    </div>
                  )}
                  <Link href="/dashboard/requests" className="block w-full text-center py-2.5 rounded-xl bg-primary text-zinc-950 font-bold text-xs hover:opacity-90 transition">
                    ✏️ {lang === 'ar' ? 'الانتقال لإدارة الطلبات' : 'Go to Requests'}
                  </Link>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`px-6 py-4 border-t flex justify-end ${
              theme === 'dark' ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'
            }`}>
              <button
                onClick={handleCloseDetail}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  theme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                }`}
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
