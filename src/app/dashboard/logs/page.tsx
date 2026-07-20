'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useApp } from '../../../context/AppContext';

const MODULE_META: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  USERS:       { icon: '👥', color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-950/30',    border: 'border-blue-200 dark:border-blue-800/50' },
  PROPERTIES:  { icon: '🏠', color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-950/30',  border: 'border-amber-200 dark:border-amber-800/50' },
  SERVICES:    { icon: '⚙️', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800/50' },
  PROJECTS:    { icon: '🏗️', color: 'text-cyan-600 dark:text-cyan-400',    bg: 'bg-cyan-50 dark:bg-cyan-950/30',    border: 'border-cyan-200 dark:border-cyan-800/50' },
  SETTINGS:    { icon: '🔧', color: 'text-red-600 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-950/30',      border: 'border-red-200 dark:border-red-800/50' },
  REQUESTS:    { icon: '📋', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800/50' },
  CONTENT:     { icon: '📰', color: 'text-pink-600 dark:text-pink-400',    bg: 'bg-pink-50 dark:bg-pink-950/30',    border: 'border-pink-200 dark:border-pink-800/50' },
};

const OP_META: Record<string, { icon: string; color: string; bg: string; border: string; labelAr: string; labelEn: string }> = {
  CREATE:  { icon: '➕', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800/50', labelAr: 'إضافة',   labelEn: 'Create' },
  UPDATE:  { icon: '✏️', color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-950/30',     border: 'border-blue-200 dark:border-blue-800/50',    labelAr: 'تعديل',   labelEn: 'Update' },
  DELETE:  { icon: '🗑️', color: 'text-red-600 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-950/30',       border: 'border-red-200 dark:border-red-800/50',      labelAr: 'حذف',     labelEn: 'Delete' },
  PUBLISH: { icon: '📢', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800/50', labelAr: 'نشر',     labelEn: 'Publish' },
  LOGIN:   { icon: '🔐', color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-950/30',   border: 'border-amber-200 dark:border-amber-800/50',  labelAr: 'تسجيل دخول', labelEn: 'Login' },
};

function ModuleBadge({ module }: { module: string }) {
  const m = MODULE_META[module] ?? { icon: '📦', color: 'text-zinc-500', bg: 'bg-zinc-100 dark:bg-zinc-800/50', border: 'border-zinc-200 dark:border-zinc-700' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${m.bg} ${m.color} ${m.border}`}>
      {m.icon} {module}
    </span>
  );
}

function OpBadge({ op, lang }: { op: string; lang: string }) {
  const m = OP_META[op] ?? { icon: '⚡', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', labelAr: op, labelEn: op };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${m.bg} ${m.color} ${m.border}`}>
      {m.icon} {lang === 'ar' ? m.labelAr : m.labelEn}
    </span>
  );
}

export default function LogsPage() {
  const { lang, theme } = useApp();
  const isRtl = lang === 'ar';

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState('');
  const [filterOp, setFilterOp] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);

  async function loadLogs() {
    setLoading(true);
    setSelected(null);
    try {
      let path = '/audit-logs';
      const params: string[] = [];
      if (filterModule) params.push(`module=${filterModule}`);
      if (filterOp) params.push(`action=${filterOp}`);
      if (params.length > 0) path += `?${params.join('&')}`;
      const res = await api.get(path);
      setLogs(res.logs || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadLogs(); }, [filterModule, filterOp]);

  const filtered = logs.filter(log => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (log.user?.name || '').toLowerCase().includes(q) ||
           (log.user?.email || '').toLowerCase().includes(q) ||
           (log.module || '').toLowerCase().includes(q) ||
           (log.ipAddress || '').toLowerCase().includes(q);
  });

  // Stats
  const totalSuccess = logs.filter(l => l.success).length;
  const totalFail = logs.filter(l => !l.success).length;

  const inputCls = `px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition ${
    theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-600' : 'bg-zinc-50 border-zinc-300 text-zinc-800 placeholder-zinc-400'
  }`;
  const card = `rounded-2xl border ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-zinc-200'}`;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{isRtl ? 'جاري تحميل السجلات...' : 'Loading audit logs...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isRtl ? 'text-right' : 'text-left'}`}>

      {/* ── Header ── */}
      <div className={`relative rounded-2xl overflow-hidden border p-6 ${
        theme === 'dark' ? 'bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800/60 border-zinc-800/80' : 'bg-gradient-to-br from-white via-zinc-50 to-red-50/10 border-zinc-200'
      }`}>
        <div className="absolute top-0 right-0 w-56 h-28 bg-red-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-bold text-red-500 tracking-wide uppercase">{isRtl ? 'سجل الرقابة' : 'Audit Trail'}</span>
            </div>
            <h1 className={`text-2xl font-black mb-1 ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
              {isRtl ? 'سجلات العمليات والرقابة' : 'System Audit Logs'}
            </h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {isRtl ? `${logs.length} سجل — ${totalSuccess} ناجح · ${totalFail} فاشل` : `${logs.length} events — ${totalSuccess} success · ${totalFail} failed`}
            </p>
          </div>
          <button onClick={loadLogs} className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-2 ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200'}`}>
            🔄 {isRtl ? 'تحديث' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: isRtl ? 'إجمالي السجلات' : 'Total Events',  icon: '📋', count: logs.length,  color: theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700', bg: theme === 'dark' ? 'bg-zinc-800/60' : 'bg-zinc-100', border: theme === 'dark' ? 'border-zinc-700' : 'border-zinc-200' },
          { label: isRtl ? 'عمليات ناجحة'   : 'Successful',    icon: '✅', count: totalSuccess,  color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20' },
          { label: isRtl ? 'عمليات فاشلة'   : 'Failed',        icon: '❌', count: totalFail,     color: 'text-red-600 dark:text-red-400',         bg: 'bg-red-50 dark:bg-red-500/10',         border: 'border-red-200 dark:border-red-500/20' },
          { label: isRtl ? 'عمليات الحذف'   : 'Deletions',     icon: '🗑️', count: logs.filter(l => l.operation === 'DELETE').length, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20' },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl border p-4 text-center ${s.bg} ${s.border}`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-2xl font-black ${s.color}`}>{s.count}</div>
            <div className={`text-[10px] font-bold mt-0.5 ${s.color} opacity-80`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div className={`${card} px-5 py-4 flex flex-wrap gap-3 items-center`}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={isRtl ? 'بحث بالاسم أو الإيميل أو الـ IP...' : 'Search by name, email or IP...'} className={`${inputCls} max-w-xs`} />
        <select value={filterModule} onChange={e => setFilterModule(e.target.value)} className={inputCls} aria-label={isRtl ? 'تصفية بالوحدة' : 'Filter by module'}>
          <option value="">{isRtl ? 'كل الوحدات' : 'All Modules'}</option>
          {['USERS','PROPERTIES','SERVICES','PROJECTS','SETTINGS','REQUESTS','CONTENT'].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select value={filterOp} onChange={e => setFilterOp(e.target.value)} className={inputCls} aria-label={isRtl ? 'تصفية بالعملية' : 'Filter by operation'}>
          <option value="">{isRtl ? 'كل العمليات' : 'All Operations'}</option>
          {Object.entries(OP_META).map(([key, m]) => (
            <option key={key} value={key}>{isRtl ? m.labelAr : m.labelEn}</option>
          ))}
        </select>
        {loading && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
        <span className={`ms-auto text-xs font-semibold ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{filtered.length} {isRtl ? 'سجل' : 'events'}</span>
      </div>

      {/* ── Two-pane Layout ── */}
      <div className="flex gap-5">

        {/* Logs Table */}
        <div className={`flex-1 min-w-0 ${card} overflow-hidden`}>
          <div className={`flex items-center justify-between px-5 py-3.5 border-b ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-red-500" />
              <span className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                🔍 {isRtl ? 'سجل الأحداث' : 'Event Log'}
              </span>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50">
              {filtered.length} {isRtl ? 'حدث' : 'events'}
            </span>
          </div>

          <table className={`w-full border-collapse text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className={`text-[11px] font-bold uppercase tracking-wider border-b ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 text-zinc-500' : 'bg-zinc-50/80 border-zinc-200 text-zinc-400'}`}>
                <th className="px-5 py-3">{isRtl ? 'التاريخ والوقت' : 'Timestamp'}</th>
                <th className="px-5 py-3">{isRtl ? 'المستخدم' : 'User'}</th>
                <th className="px-5 py-3">{isRtl ? 'الوحدة' : 'Module'}</th>
                <th className="px-5 py-3">{isRtl ? 'العملية' : 'Operation'}</th>
                <th className="px-5 py-3">{isRtl ? 'الحالة' : 'Status'}</th>
                <th className="px-5 py-3 hidden lg:table-cell">{isRtl ? 'الـ IP' : 'IP Address'}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-zinc-800/60' : 'divide-zinc-100'}`}>
              {filtered.map(log => {
                const isActive = selected?.id === log.id;
                return (
                  <tr key={log.id} onClick={() => setSelected(isActive ? null : log)}
                    className={`cursor-pointer transition-colors duration-150 ${
                      isActive
                        ? theme === 'dark' ? 'bg-primary/8 border-l-2 border-primary' : 'bg-amber-50/60 border-l-2 border-primary'
                        : log.success === false
                          ? theme === 'dark' ? 'hover:bg-red-950/10' : 'hover:bg-red-50/40'
                          : theme === 'dark' ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-50'
                    }`}>
                    <td className="px-5 py-3.5">
                      <div className={`text-[10px] font-mono ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>
                        {new Date(log.createdAt).toLocaleDateString()}
                      </div>
                      <div className={`text-[9px] font-mono ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className={`font-bold text-xs ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>
                        {log.user?.name || (isRtl ? 'مجهول' : 'Unknown')}
                      </div>
                      <div className={`text-[10px] font-mono ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {log.user?.email || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <ModuleBadge module={log.module} />
                    </td>
                    <td className="px-5 py-3.5">
                      <OpBadge op={log.operation} lang={lang} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        log.success
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/60'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${log.success ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {log.success ? (isRtl ? 'نجاح' : 'Success') : (isRtl ? 'فشل' : 'Failed')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className={`text-[10px] font-mono ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{log.ipAddress || '—'}</span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className={`py-14 text-center text-sm italic ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  {isRtl ? 'لا توجد سجلات مطابقة.' : 'No events match the current filter.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Detail Side Panel ── */}
        {selected && (
          <div className={`w-72 xl:w-80 shrink-0 ${card} flex flex-col overflow-hidden max-h-[calc(100vh-10rem)] sticky top-24`}>
            <div className={`px-5 py-4 border-b shrink-0 ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-5 rounded-full ${selected.success ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>{isRtl ? 'تفاصيل الحدث' : 'Event Details'}</span>
                </div>
                <button onClick={() => setSelected(null)} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer transition ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500'}`} aria-label={isRtl ? 'إغلاق' : 'Close'}>✕</button>
              </div>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto flex-1">
              {/* Status banner */}
              <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                selected.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
                  : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50'
              }`}>
                <span className="text-2xl">{selected.success ? '✅' : '❌'}</span>
                <div>
                  <div className={`font-extrabold text-xs ${selected.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {selected.success ? (isRtl ? 'عملية ناجحة' : 'Successful Operation') : (isRtl ? 'عملية فاشلة' : 'Failed Operation')}
                  </div>
                  <div className={`text-[10px] font-mono mt-0.5 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{new Date(selected.createdAt).toLocaleString()}</div>
                </div>
              </div>

              {/* User */}
              <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isRtl ? 'المستخدم' : 'User'}</span>
                <div className={`font-bold text-xs ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>{selected.user?.name || (isRtl ? 'مجهول' : 'Unknown')}</div>
                {selected.user?.email && <div className={`text-[10px] font-mono mt-0.5 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{selected.user.email}</div>}
              </div>

              {/* Module + Operation */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'الوحدة' : 'Module'}</span>
                  <ModuleBadge module={selected.module} />
                </div>
                <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'العملية' : 'Operation'}</span>
                  <OpBadge op={selected.operation} lang={lang} />
                </div>
              </div>

              {/* IP + Browser */}
              <div className={`p-3 rounded-xl border space-y-2 ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                <div>
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-0.5">{isRtl ? 'عنوان الـ IP' : 'IP Address'}</span>
                  <span className={`text-xs font-mono ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{selected.ipAddress || '—'}</span>
                </div>
                {(selected.browserInfo || selected.deviceInfo) && (
                  <div className={`pt-2 border-t ${theme === 'dark' ? 'border-zinc-700/60' : 'border-zinc-200'}`}>
                    <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-0.5">{isRtl ? 'المتصفح / الجهاز' : 'Browser / Device'}</span>
                    <p className={`text-[10px] leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{selected.browserInfo || selected.deviceInfo}</p>
                  </div>
                )}
              </div>

              {/* Target entity */}
              {selected.targetId && (
                <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isRtl ? 'المعرّف المستهدف' : 'Target ID'}</span>
                  <span className={`text-[10px] font-mono ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{selected.targetId}</span>
                </div>
              )}

              {/* Error message if failed */}
              {!selected.success && selected.errorMessage && (
                <div className="p-3 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/20">
                  <span className="block text-[10px] font-bold text-red-500 uppercase mb-1">⚠️ {isRtl ? 'رسالة الخطأ' : 'Error Message'}</span>
                  <p className="text-[10px] leading-relaxed text-red-600 dark:text-red-400">{selected.errorMessage}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
