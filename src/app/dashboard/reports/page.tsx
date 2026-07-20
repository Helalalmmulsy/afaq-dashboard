'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useApp } from '../../../context/AppContext';

export default function ReportsPage() {
  const { lang, theme } = useApp();
  const isRtl = lang === 'ar';

  const [stats, setStats] = useState({
    properties: { total: 0, published: 0, draft: 0, totalValue: 0 },
    projects: { total: 0, completed: 0, inProgress: 0, planned: 0, totalBudget: 0 },
    ai: { totalConvs: 0, totalTokens: 0, avgResponseTime: 0 },
    logs: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  async function loadStats() {
    try {
      const [propsRes, projRes, aiRes, logsRes] = await Promise.allSettled([
        api.get('/properties?status=ALL'),
        api.get('/services/projects/all'),
        api.get('/ai/stats'),
        api.get('/audit-logs'),
      ]);

      let propertiesStats = { total: 0, published: 0, draft: 0, totalValue: 0 };
      if (propsRes.status === 'fulfilled') {
        const props = propsRes.value?.properties || [];
        propertiesStats.total = props.length;
        propertiesStats.published = props.filter((p: any) => p.status === 'PUBLISHED').length;
        propertiesStats.draft = props.filter((p: any) => p.status === 'DRAFT').length;
        propertiesStats.totalValue = props.reduce((acc: number, cur: any) => acc + Number(cur.price || 0), 0);
      }

      let projectsStats = { total: 0, completed: 0, inProgress: 0, planned: 0, totalBudget: 0 };
      if (projRes.status === 'fulfilled') {
        const projs = projRes.value?.projects || [];
        projectsStats.total = projs.length;
        projectsStats.completed = projs.filter((p: any) => p.status === 'COMPLETED').length;
        projectsStats.inProgress = projs.filter((p: any) => p.status === 'IN_PROGRESS').length;
        projectsStats.planned = projs.filter((p: any) => p.status === 'PLANNED').length;
        projectsStats.totalBudget = projs.reduce((acc: number, cur: any) => acc + Number(cur.budget || 0), 0);
      }

      let aiStatsData = { totalConvs: 0, totalTokens: 0, avgResponseTime: 0 };
      if (aiRes.status === 'fulfilled') {
        aiStatsData.totalConvs = aiRes.value?.totalConversations || 0;
        aiStatsData.totalTokens = aiRes.value?.totalTokens || 0;
        aiStatsData.avgResponseTime = aiRes.value?.avgResponseTimeMs || 0;
      }

      let recentLogs: any[] = [];
      if (logsRes.status === 'fulfilled') {
        recentLogs = logsRes.value?.logs?.slice(0, 6) || [];
      }

      setStats({
        properties: propertiesStats,
        projects: projectsStats,
        ai: aiStatsData,
        logs: recentLogs,
      });
    } catch (err) {
      console.error('Failed to load analytical reports:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStats(); }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
            {isRtl ? 'جاري تحميل التقارير...' : 'Loading reports...'}
          </p>
        </div>
      </div>
    );
  }

  const propPublishedPct = stats.properties.total > 0
    ? Math.round((stats.properties.published / stats.properties.total) * 100) : 0;
  const propDraftPct = stats.properties.total > 0
    ? Math.round((stats.properties.draft / stats.properties.total) * 100) : 0;
  const projInProgressPct = stats.projects.total > 0
    ? Math.round((stats.projects.inProgress / stats.projects.total) * 100) : 0;
  const projCompletedPct = stats.projects.total > 0
    ? Math.round((stats.projects.completed / stats.projects.total) * 100) : 0;
  const projPlannedPct = stats.projects.total > 0
    ? Math.round((stats.projects.planned / stats.projects.total) * 100) : 0;

  const card = `rounded-2xl border ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-zinc-200'}`;
  const label = `text-xs font-semibold ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`;
  const dividerClass = `divide-y ${theme === 'dark' ? 'divide-zinc-800/60' : 'divide-zinc-100'}`;

  const TOP_CARDS = [
    {
      label: isRtl ? 'القيمة الإجمالية للعقارات' : 'Total Properties Value',
      value: `$${stats.properties.totalValue.toLocaleString()}`,
      sub: `${stats.properties.total} ${isRtl ? 'عقار مسجل' : 'properties registered'}`,
      icon: '🏢',
      accent: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      border: 'border-amber-200/60 dark:border-amber-500/20',
    },
    {
      label: isRtl ? 'ميزانية المشاريع' : 'Projects Budget',
      value: `$${stats.projects.totalBudget.toLocaleString()}`,
      sub: `${stats.projects.total} ${isRtl ? 'مشروع إجمالاً' : 'total projects'}`,
      icon: '⚙️',
      accent: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      border: 'border-emerald-200/60 dark:border-emerald-500/20',
    },
    {
      label: isRtl ? 'إجمالي محادثات الذكاء الاصطناعي' : 'AI Conversations',
      value: stats.ai.totalConvs.toLocaleString(),
      sub: `${stats.ai.totalTokens.toLocaleString()} ${isRtl ? 'توكن مستهلك' : 'tokens used'}`,
      icon: '🤖',
      accent: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
      border: 'border-blue-200/60 dark:border-blue-500/20',
    },
    {
      label: isRtl ? 'متوسط سرعة الاستجابة' : 'Avg Response Time',
      value: stats.ai.avgResponseTime > 0 ? `${(stats.ai.avgResponseTime / 1000).toFixed(2)}s` : '—',
      sub: isRtl ? 'مدعوم بـ Gemini API' : 'Powered by Gemini API',
      icon: '⚡',
      accent: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-500/10',
      border: 'border-purple-200/60 dark:border-purple-500/20',
    },
  ];

  return (
    <div className={`space-y-7 ${isRtl ? 'text-right' : 'text-left'}`}>

      {/* ── Page Header ── */}
      <div className={`relative rounded-2xl overflow-hidden border p-7 ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800/60 border-zinc-800/80'
          : 'bg-gradient-to-br from-white via-zinc-50 to-blue-50/30 border-zinc-200'
      }`}>
        <div className="absolute top-0 right-0 w-64 h-36 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3">
            <span className="text-primary text-sm">📈</span>
            <span className="text-[11px] font-bold text-primary tracking-wide uppercase">
              {isRtl ? 'التقارير والإحصائيات' : 'Reports & Analytics'}
            </span>
          </div>
          <h1 className={`text-2xl sm:text-3xl font-black mb-1.5 ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
            {isRtl ? 'لوحة التقارير التحليلية' : 'Analytics Dashboard'}
          </h1>
          <p className={`text-sm max-w-xl leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
            {isRtl
              ? 'عرض تفاعلي شامل لأداء قطاعات العقارات، المقاولات، ونشاط المساعد الذكي'
              : 'Comprehensive overview of property values, project budgets, and AI activity'}
          </p>
        </div>
      </div>

      {/* ── Top Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {TOP_CARDS.map((c, i) => (
          <div key={i} className={`rounded-2xl border p-5 ${c.bg} ${c.border}`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                theme === 'dark' ? 'bg-zinc-800/80' : 'bg-white'
              } shadow-sm`}>
                {c.icon}
              </div>
            </div>
            <div className={`text-2xl sm:text-3xl font-black mb-1 ${c.accent}`}>{c.value}</div>
            <p className={`text-xs font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{c.label}</p>
            <p className={`text-[10px] mt-0.5 ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Charts Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Properties Analysis */}
        <div className={`${card} p-6 space-y-5`}>
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-amber-500" />
            <h3 className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
              🏢 {isRtl ? 'تحليل حالة العقارات' : 'Properties Status Analysis'}
            </h3>
          </div>

          {/* Mini summary row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: isRtl ? 'الإجمالي' : 'Total', val: stats.properties.total, color: 'text-zinc-500 dark:text-zinc-400' },
              { label: isRtl ? 'منشور' : 'Published', val: stats.properties.published, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: isRtl ? 'مسودة' : 'Draft', val: stats.properties.draft, color: 'text-amber-600 dark:text-amber-400' },
            ].map((item, i) => (
              <div key={i} className={`p-3 rounded-xl border text-center ${
                theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <div className={`text-xl font-black ${item.color}`}>{item.val}</div>
                <div className={`text-[10px] mt-0.5 font-medium ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{item.label}</div>
              </div>
            ))}
          </div>

          {/* Progress bars */}
          <div className="space-y-4">
            <ProgressBar
              label={isRtl ? 'العقارات المنشورة' : 'Published Properties'}
              current={stats.properties.published}
              total={stats.properties.total}
              pct={propPublishedPct}
              color="bg-emerald-500"
              theme={theme}
            />
            <ProgressBar
              label={isRtl ? 'العقارات المسودة' : 'Draft Properties'}
              current={stats.properties.draft}
              total={stats.properties.total}
              pct={propDraftPct}
              color="bg-amber-500"
              theme={theme}
            />
          </div>
        </div>

        {/* Projects Analysis */}
        <div className={`${card} p-6 space-y-5`}>
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-emerald-500" />
            <h3 className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
              ⚙️ {isRtl ? 'تحليل حالة المشاريع' : 'Projects Status Analysis'}
            </h3>
          </div>

          {/* Mini summary row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: isRtl ? 'الإجمالي' : 'Total', val: stats.projects.total, color: 'text-zinc-500 dark:text-zinc-400' },
              { label: isRtl ? 'جاري' : 'In Progress', val: stats.projects.inProgress, color: 'text-blue-600 dark:text-blue-400' },
              { label: isRtl ? 'مكتمل' : 'Completed', val: stats.projects.completed, color: 'text-emerald-600 dark:text-emerald-400' },
            ].map((item, i) => (
              <div key={i} className={`p-3 rounded-xl border text-center ${
                theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <div className={`text-xl font-black ${item.color}`}>{item.val}</div>
                <div className={`text-[10px] mt-0.5 font-medium ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{item.label}</div>
              </div>
            ))}
          </div>

          {/* Progress bars */}
          <div className="space-y-4">
            <ProgressBar
              label={isRtl ? 'المشاريع الجارية' : 'In Progress'}
              current={stats.projects.inProgress}
              total={stats.projects.total}
              pct={projInProgressPct}
              color="bg-blue-500"
              theme={theme}
            />
            <ProgressBar
              label={isRtl ? 'المشاريع المخططة' : 'Planned'}
              current={stats.projects.planned}
              total={stats.projects.total}
              pct={projPlannedPct}
              color="bg-amber-500"
              theme={theme}
            />
            <ProgressBar
              label={isRtl ? 'المشاريع المكتملة' : 'Completed'}
              current={stats.projects.completed}
              total={stats.projects.total}
              pct={projCompletedPct}
              color="bg-emerald-500"
              theme={theme}
            />
          </div>
        </div>
      </div>

      {/* ── Recent Audit Logs ── */}
      <div className={`${card} overflow-hidden`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-primary" />
            <div>
              <h3 className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                📜 {isRtl ? 'سجل العمليات الإدارية الأخيرة' : 'Recent Admin Audit Logs'}
              </h3>
              <p className={`text-[11px] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {isRtl ? 'آخر ٦ عمليات إدارية' : 'Last 6 administrative operations'}
              </p>
            </div>
          </div>
        </div>

        <div className={`divide-y ${theme === 'dark' ? 'divide-zinc-800/60' : 'divide-zinc-100'}`}>
          {stats.logs.map((log: any, i: number) => (
            <div key={log.id || i} className={`flex items-center justify-between px-6 py-3.5 text-xs transition-colors ${
              theme === 'dark' ? 'hover:bg-zinc-800/30 text-zinc-300' : 'hover:bg-zinc-50 text-zinc-600'
            }`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                  theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'
                }`}>
                  📝
                </div>
                <div className="min-w-0">
                  <span className={`block font-bold truncate ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>
                    {log.action || log.operation || '—'}
                  </span>
                  {log.description && (
                    <span className={`block text-[10px] truncate mt-0.5 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {log.description}
                    </span>
                  )}
                </div>
              </div>
              <span className={`shrink-0 font-mono text-[10px] ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
          {stats.logs.length === 0 && (
            <div className={`py-10 text-center text-xs italic ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
              {isRtl ? 'لا توجد سجلات عمليات.' : 'No logs recorded yet.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Reusable Progress Bar Component ── */
function ProgressBar({
  label, current, total, pct, color, theme,
}: {
  label: string; current: number; total: number; pct: number; color: string; theme: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{label}</span>
        <span className={`text-xs font-bold font-mono ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>
          {current} / {total} <span className="text-primary">({pct}%)</span>
        </span>
      </div>
      <div className={`w-full h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-zinc-700/60' : 'bg-zinc-200'}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
