'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useApp } from '../../../context/AppContext';

const STATUS_META: Record<string, { label: string; labelEn: string; cls: string; dot: string; bar: string }> = {
  PLANNED:     { label: 'مخطط',       labelEn: 'Planned',     cls: 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',             dot: 'bg-zinc-400',    bar: 'bg-zinc-400' },
  IN_PROGRESS: { label: 'قيد التنفيذ', labelEn: 'In Progress', cls: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60',           dot: 'bg-blue-500',    bar: 'bg-blue-500' },
  COMPLETED:   { label: 'مكتمل',      labelEn: 'Completed',   cls: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
  ON_HOLD:     { label: 'موقوف',      labelEn: 'On Hold',     cls: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',       dot: 'bg-amber-500',   bar: 'bg-amber-500' },
};

function StatusBadge({ status, lang }: { status: string; lang: string }) {
  const m = STATUS_META[status] ?? { label: status, labelEn: status, cls: 'bg-zinc-100 text-zinc-500 border-zinc-200', dot: 'bg-zinc-400', bar: 'bg-zinc-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${m.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {lang === 'ar' ? m.label : m.labelEn}
    </span>
  );
}

function ProgressBar({ value, status }: { value: number; status: string }) {
  const bar = STATUS_META[status]?.bar ?? 'bg-primary';
  const color = value >= 100 ? 'bg-emerald-500' : value >= 60 ? 'bg-blue-500' : value >= 30 ? 'bg-amber-500' : 'bg-zinc-400';
  return (
    <div className="space-y-1">
      <div className="w-full bg-zinc-200 dark:bg-zinc-700/60 rounded-full h-1.5 overflow-hidden">
        <div className={`${color} h-full rounded-full transition-all duration-500`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className={`text-[10px] font-bold ${color.replace('bg-', 'text-').replace('500','600')} dark:${color.replace('bg-', 'text-').replace('500','400')}`}>{value}%</span>
    </div>
  );
}

const getCurrencySymbol = (currency: string, isRtl: boolean) => {
  switch (currency) {
    case 'YER': return isRtl ? 'ر.ي' : 'YER';
    case 'SAR': return isRtl ? 'ر.س' : 'SAR';
    case 'USD': default: return '$';
  }
};

const formatPrice = (price: number, currency: string, isRtl: boolean) => {
  const formatted = Number(price).toLocaleString();
  const symbol = getCurrencySymbol(currency, isRtl);
  if (currency === 'USD') return `${symbol}${formatted}`;
  return `${formatted} ${symbol}`;
};

export default function ProjectsPage() {
  const { lang, theme, showAlert, showConfirm } = useApp();
  const isRtl = lang === 'ar';

  const [projects, setProjects] = useState<any[]>([]);
  const [engineers, setEngineers] = useState<any[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  // Side detail panel
  const [selected, setSelected] = useState<any | null>(null);

  // Assignment modal
  const [assignTarget, setAssignTarget] = useState<any | null>(null);
  const [assignedEngineers, setAssignedEngineers] = useState<string[]>([]);
  const [assignedContractors, setAssignedContractors] = useState<string[]>([]);

  // Progress modal
  const [progressTarget, setProgressTarget] = useState<any | null>(null);
  const [progressVal, setProgressVal] = useState(0);

  // Publish to Public Content modal
  const [publishTarget, setPublishTarget] = useState<any | null>(null);
  const [publishForm, setPublishForm] = useState({
    department: 'ENGINEERING',
    subCategory: 'ARCH',
    titleAr: '',
    category: '',
    coverImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&fit=crop&q=80',
    descriptionAr: '',
    city: 'محافظة ذمار',
  });

  const openPublishModal = (project: any) => {
    setPublishTarget(project);
    const linkedDept = project.request?.service?.department || 'ENGINEERING';
    setPublishForm({
      department: linkedDept,
      subCategory: linkedDept === 'ENGINEERING' ? 'ARCH' : 'CONCRETE',
      titleAr: project.name || '',
      category: linkedDept === 'ENGINEERING' ? 'تصميم وإشراف هندسي' : 'مقاولات عامة وتشطيبات',
      coverImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&fit=crop&q=80',
      descriptionAr: project.description || '',
      city: 'محافظة ذمار',
    });
  };

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishTarget) return;
    setSaving(true);
    try {
      await api.post(`/services/projects/${publishTarget.id}/publish-showcase`, publishForm);
      showAlert(
        isRtl
          ? 'تم نشر المشروع بنجاح في المحتوى العام للتطبيق تحت قسم ' + (publishForm.department === 'ENGINEERING' ? 'الهندسة' : 'المقاولات') + '!'
          : 'Project published successfully to app public content!',
        'success'
      );
      setPublishTarget(null);
      loadData();
    } catch (err: any) {
      showAlert(err?.message || (isRtl ? 'فشل نشر المشروع في المحتوى العام.' : 'Failed to publish project.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  async function loadData() {
    setLoading(true);
    try {
      const [projRes, engRes, contRes] = await Promise.allSettled([
        api.get('/services/projects/all'),
        api.get('/users?roleName=ENGINEER'),
        api.get('/users?roleName=CONTRACTOR'),
      ]);
      if (projRes.status === 'fulfilled') setProjects(projRes.value.projects || []);
      if (engRes.status === 'fulfilled') setEngineers(engRes.value.users || []);
      if (contRes.status === 'fulfilled') setContractors(contRes.value.users || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const openAssign = (project: any) => {
    setAssignTarget(project);
    setAssignedEngineers(project.members?.filter((m: any) => m.engineerId).map((m: any) => m.engineerId) || []);
    setAssignedContractors(project.members?.filter((m: any) => m.contractorId).map((m: any) => m.contractorId) || []);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTarget) return;
    setSaving(true);
    try {
      await api.post(`/services/projects/${assignTarget.id}/assign`, { engineerIds: assignedEngineers, contractorIds: assignedContractors });
      setAssignTarget(null);
      loadData();
    } catch (err: any) { showAlert(err?.message || (isRtl ? 'فشل التعيين.' : 'Assignment failed.'), 'error'); }
    finally { setSaving(false); }
  };

  const openProgress = (project: any) => {
    setProgressTarget(project);
    setProgressVal(project.progressPercentage || 0);
  };

  const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressTarget) return;
    setSaving(true);
    try {
      await api.patch(`/services/projects/${progressTarget.id}/progress`, { progressPercentage: Number(progressVal) });
      setProgressTarget(null);
      setProjects(prev => prev.map(p => p.id === progressTarget.id ? { ...p, progressPercentage: progressVal } : p));
      if (selected?.id === progressTarget.id) setSelected((s: any) => ({ ...s, progressPercentage: progressVal }));
      loadData();
    } catch (err: any) { showAlert(err?.message || (isRtl ? 'فشل التحديث.' : 'Update failed.'), 'error'); }
    finally { setSaving(false); }
  };

  const counts = {
    total: projects.length,
    PLANNED: projects.filter(p => p.status === 'PLANNED').length,
    IN_PROGRESS: projects.filter(p => p.status === 'IN_PROGRESS').length,
    COMPLETED: projects.filter(p => p.status === 'COMPLETED').length,
    ON_HOLD: projects.filter(p => p.status === 'ON_HOLD').length,
  };

  const filtered = projects.filter(p => {
    const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q || (p.name || '').toLowerCase().includes(q) || (p.request?.customer?.name || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const inputCls = `px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition ${
    theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-600' : 'bg-zinc-50 border-zinc-300 text-zinc-800 placeholder-zinc-400'
  }`;
  const card = `rounded-2xl border ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-zinc-200'}`;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{isRtl ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isRtl ? 'text-right' : 'text-left'}`}>

      {/* ── Header ── */}
      <div className={`relative rounded-2xl overflow-hidden border p-6 ${
        theme === 'dark' ? 'bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800/60 border-zinc-800/80' : 'bg-gradient-to-br from-white via-zinc-50 to-blue-50/30 border-zinc-200'
      }`}>
        <div className="absolute top-0 right-0 w-56 h-28 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[11px] font-bold text-primary tracking-wide uppercase">{isRtl ? 'إدارة المشاريع' : 'Project Management'}</span>
            </div>
            <h1 className={`text-2xl font-black mb-1 ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
              {isRtl ? 'المشاريع التشغيلية الجارية' : 'Operational Projects Console'}
            </h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {isRtl ? `${projects.length} مشروع — ${counts.IN_PROGRESS} قيد التنفيذ · ${counts.COMPLETED} مكتمل` : `${projects.length} projects — ${counts.IN_PROGRESS} in progress · ${counts.COMPLETED} completed`}
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { key: 'PLANNED',     label: isRtl ? 'مخطط'         : 'Planned',     icon: '📋', color: 'text-zinc-600 dark:text-zinc-300',       bg: theme === 'dark' ? 'bg-zinc-800/60' : 'bg-zinc-100', border: theme === 'dark' ? 'border-zinc-700' : 'border-zinc-200' },
          { key: 'IN_PROGRESS', label: isRtl ? 'قيد التنفيذ'  : 'In Progress', icon: '⚡', color: 'text-blue-600 dark:text-blue-400',         bg: 'bg-blue-50 dark:bg-blue-500/10',    border: 'border-blue-200 dark:border-blue-500/20' },
          { key: 'COMPLETED',   label: isRtl ? 'مكتمل'         : 'Completed',   icon: '✅', color: 'text-emerald-600 dark:text-emerald-400',  bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20' },
          { key: 'ON_HOLD',     label: isRtl ? 'موقوف'         : 'On Hold',     icon: '⏸️', color: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-500/10',  border: 'border-amber-200 dark:border-amber-500/20' },
        ].map(s => (
          <button key={s.key} onClick={() => setFilterStatus(filterStatus === s.key ? 'ALL' : s.key)}
            className={`rounded-2xl border p-4 text-center transition-all duration-200 cursor-pointer ${
              filterStatus === s.key ? `${s.bg} ${s.border} scale-[1.02] shadow-md` : theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
            }`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-2xl font-black ${filterStatus === s.key ? s.color : theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>{counts[s.key as keyof typeof counts]}</div>
            <div className={`text-[10px] font-bold mt-0.5 ${filterStatus === s.key ? s.color : theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* ── Filter + Search Bar ── */}
      <div className={`${card} px-5 py-4 flex flex-wrap gap-3 items-center`}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={isRtl ? 'بحث بالاسم أو المالك...' : 'Search by name or owner...'} className={`${inputCls} max-w-xs`} />
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                filterStatus === s ? 'bg-primary text-zinc-950 border-primary' : theme === 'dark' ? 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-primary/50' : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-primary/50'
              }`}>
              {s === 'ALL' ? (isRtl ? 'الكل' : 'All') : s === 'PLANNED' ? (isRtl ? 'مخطط' : 'Planned') : s === 'IN_PROGRESS' ? (isRtl ? 'جارٍ' : 'In Progress') : s === 'COMPLETED' ? (isRtl ? 'مكتمل' : 'Completed') : (isRtl ? 'موقوف' : 'On Hold')}
            </button>
          ))}
        </div>
        <span className={`ms-auto text-xs font-semibold ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{filtered.length} {isRtl ? 'مشروع' : 'projects'}</span>
      </div>

      {/* ── Two-pane Layout ── */}
      <div className="flex gap-5">

        {/* Projects Table */}
        <div className={`flex-1 min-w-0 ${card} overflow-hidden`}>
          <div className={`flex items-center justify-between px-5 py-3.5 border-b ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-blue-500" />
              <span className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>🏗️ {isRtl ? 'قائمة المشاريع' : 'Projects List'}</span>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60`}>
              {filtered.length} {isRtl ? 'مشروع' : 'projects'}
            </span>
          </div>

          <table className={`w-full border-collapse text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className={`text-[11px] font-bold uppercase tracking-wider border-b ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 text-zinc-500' : 'bg-zinc-50/80 border-zinc-200 text-zinc-400'}`}>
                <th className="px-5 py-3">{isRtl ? 'المشروع / المالك' : 'Project / Owner'}</th>
                <th className="px-5 py-3 hidden md:table-cell">{isRtl ? 'الخدمة' : 'Service'}</th>
                <th className="px-5 py-3">{isRtl ? 'الإنجاز' : 'Progress'}</th>
                <th className="px-5 py-3 hidden lg:table-cell">{isRtl ? 'الميزانية' : 'Budget'}</th>
                <th className="px-5 py-3">{isRtl ? 'الحالة' : 'Status'}</th>
                <th className="px-5 py-3 text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-zinc-800/60' : 'divide-zinc-100'}`}>
              {filtered.map(project => {
                const isActive = selected?.id === project.id;
                const engMembers = project.members?.filter((m: any) => m.engineerId) || [];
                const contMembers = project.members?.filter((m: any) => m.contractorId) || [];
                return (
                  <tr key={project.id} onClick={() => setSelected(isActive ? null : project)}
                    className={`cursor-pointer transition-colors duration-150 ${
                      isActive
                        ? theme === 'dark' ? 'bg-primary/8 border-l-2 border-primary' : 'bg-amber-50/60 border-l-2 border-primary'
                        : theme === 'dark' ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-50'
                    }`}>
                    <td className="px-5 py-3.5">
                      <div className={`font-bold text-xs leading-tight ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>{project.name}</div>
                      <div className="text-[10px] text-primary font-semibold mt-0.5">
                        👤 {project.request?.customer?.name || (isRtl ? 'مالك مجهول' : 'Unknown')}
                      </div>
                      {(engMembers.length > 0 || contMembers.length > 0) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {engMembers.slice(0,2).map((m: any) => (
                            <span key={m.id} className="bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30 px-1.5 py-0.5 rounded-full text-[9px] font-bold">👷 {m.engineer?.user?.name}</span>
                          ))}
                          {contMembers.slice(0,1).map((m: any) => (
                            <span key={m.id} className="bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/30 px-1.5 py-0.5 rounded-full text-[9px] font-bold">🏗️ {m.contractor?.user?.name || m.contractor?.companyName}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className={`text-[10px] px-2 py-1 rounded-lg font-semibold border ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-600'}`}>
                        {isRtl ? (project.request?.service?.nameAr || project.request?.service?.nameEn) : (project.request?.service?.nameEn || project.request?.service?.nameAr)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 min-w-[100px]">
                      <ProgressBar value={project.progressPercentage || 0} status={project.status} />
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell font-bold text-primary font-mono text-xs">
                      {formatPrice(project.budget, project.currency, isRtl)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={project.status} lang={lang} />
                    </td>
                    <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      {(project.status === 'COMPLETED' || (project.progressPercentage || 0) >= 100) ? (
                        <button
                          type="button"
                          onClick={() => openPublishModal(project)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 shadow-md transition transform hover:scale-105 cursor-pointer whitespace-nowrap"
                          title={isRtl ? 'إضافة المشروع إلى المحتوى العام (سابقة أعمال)' : 'Publish to Showcase'}
                        >
                          📢 {isRtl ? 'نقل للمحتوى العام' : 'Publish'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openProgress(project)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                            theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200'
                          }`}
                        >
                          📈 {isRtl ? 'تحديث' : 'Update'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className={`py-14 text-center text-sm italic ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  {isRtl ? 'لا توجد مشاريع تطابق الفلتر.' : 'No projects match the current filter.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Detail Side Panel ── */}
        {selected && (
          <div className={`w-80 xl:w-96 shrink-0 ${card} flex flex-col overflow-hidden max-h-[calc(100vh-10rem)] sticky top-24`}>
            <div className={`px-5 py-4 border-b shrink-0 ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-5 rounded-full ${STATUS_META[selected.status]?.bar ?? 'bg-primary'}`} />
                  <span className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>{isRtl ? 'تفاصيل المشروع' : 'Project Details'}</span>
                </div>
                <button onClick={() => setSelected(null)} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer transition ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500'}`} aria-label={isRtl ? 'إغلاق' : 'Close'}>✕</button>
              </div>
              <StatusBadge status={selected.status} lang={lang} />
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Completed Notice Banner with Direct Publish Action */}
              {(selected.status === 'COMPLETED' || (selected.progressPercentage || 0) >= 100) && (
                <div className="p-3.5 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent flex flex-col gap-2.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📢</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black text-amber-600 dark:text-amber-400">
                        {isRtl ? 'المشروع مكتمل وجاهز للنشر' : 'Project Completed'}
                      </div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {isRtl ? 'يمكنك نقله مباشرة ليظهر كسابقة أعمال في تطبيق الموبايل' : 'Ready to be published to mobile app showcase'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openPublishModal(selected)}
                    className="w-full py-2.5 px-3 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    ✨ {isRtl ? 'إضافة المشروع إلى المحتوى العام (سابقة أعمال)' : 'Publish to Public Showcase'}
                  </button>
                </div>
              )}
              {/* Name */}
              <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isRtl ? 'اسم المشروع' : 'Project Name'}</span>
                <span className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>{selected.name}</span>
              </div>

              {/* Progress */}
              <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">{isRtl ? 'نسبة الإنجاز' : 'Progress'}</span>
                  <span className="text-sm font-black text-primary">{selected.progressPercentage || 0}%</span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700/60 rounded-full h-2.5 overflow-hidden">
                  <div className="primary-gradient h-full rounded-full transition-all duration-500" style={{ width: `${selected.progressPercentage || 0}%` }} />
                </div>
              </div>

              {/* Key stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isRtl ? 'الميزانية' : 'Budget'}</span>
                  <span className="text-primary font-extrabold text-sm font-mono">{formatPrice(selected.budget, selected.currency, isRtl)}</span>
                </div>
                <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isRtl ? 'المالك' : 'Owner'}</span>
                  <span className={`font-bold text-xs ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>{selected.request?.customer?.name || '—'}</span>
                </div>
              </div>

              {/* Dates */}
              {(selected.startDate || selected.expectedEndDate) && (
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                    <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isRtl ? 'تاريخ البدء' : 'Start Date'}</span>
                    <span className={`text-xs font-mono ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{selected.startDate ? new Date(selected.startDate).toLocaleDateString() : '—'}</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                    <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isRtl ? 'التسليم المتوقع' : 'End Date'}</span>
                    <span className={`text-xs font-mono ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{selected.expectedEndDate ? new Date(selected.expectedEndDate).toLocaleDateString() : '—'}</span>
                  </div>
                </div>
              )}

              {/* Service */}
              {selected.request?.service && (
                <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isRtl ? 'الخدمة المرتبطة' : 'Linked Service'}</span>
                  <span className={`font-bold text-xs ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>
                    {isRtl ? (selected.request.service.nameAr || selected.request.service.nameEn) : (selected.request.service.nameEn || selected.request.service.nameAr)}
                  </span>
                </div>
              )}

              {/* Team */}
              {(() => {
                const eng = selected.members?.filter((m: any) => m.engineerId) || [];
                const cont = selected.members?.filter((m: any) => m.contractorId) || [];
                return (
                  <div className={`p-3 rounded-xl border space-y-2 ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                    <span className="block text-[10px] font-bold text-zinc-500 uppercase">{isRtl ? 'فريق العمل' : 'Team'}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {eng.map((m: any) => (
                        <span key={m.id} className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          👷 {m.engineer?.user?.name}
                        </span>
                      ))}
                      {cont.map((m: any) => (
                        <span key={m.id} className="bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          🏗️ {m.contractor?.user?.name || m.contractor?.companyName}
                        </span>
                      ))}
                      {eng.length === 0 && cont.length === 0 && (
                        <span className={`text-[10px] italic ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>{isRtl ? 'لم يعين فريق بعد' : 'No team assigned'}</span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Actions */}
            <div className={`p-4 border-t space-y-2 shrink-0 ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900/60' : 'border-zinc-200 bg-zinc-50'}`}>
              {(selected.status === 'COMPLETED' || (selected.progressPercentage || 0) >= 100) && (
                <button
                  type="button"
                  onClick={() => openPublishModal(selected)}
                  className="w-full py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 shadow-md transition cursor-pointer flex items-center justify-center gap-2 mb-2"
                >
                  📢 {isRtl ? 'إضافة المشروع إلى المحتوى العام (سابقة أعمال)' : 'Publish to Showcase'}
                </button>
              )}
              <button onClick={() => openProgress(selected)}
                className="w-full py-2.5 rounded-xl text-xs font-bold border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition cursor-pointer flex items-center justify-center gap-2">
                📈 {isRtl ? 'تحديث نسبة الإنجاز' : 'Update Progress'}
              </button>
              <button onClick={() => openAssign(selected)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700' : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100'}`}>
                👷 {isRtl ? 'إدارة فريق العمل' : 'Manage Team'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Assign Team Modal ── */}
      {assignTarget && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${isRtl ? 'text-right' : 'text-left'} ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-blue-500" />
                <div>
                  <h3 className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                    👷 {isRtl ? 'تعيين فريق العمل' : 'Assign Team'}
                  </h3>
                  <p className={`text-[10px] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{assignTarget.name}</p>
                </div>
              </div>
              <button onClick={() => setAssignTarget(null)} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer transition ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500'}`} aria-label={isRtl ? 'إغلاق' : 'Close'}>✕</button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-6 space-y-5">
              {/* Engineers */}
              <div>
                <h4 className={`text-[11px] font-extrabold uppercase mb-3 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                  👷 {isRtl ? 'المهندسون المشرفون' : 'Supervising Engineers'}
                </h4>
                <div className={`grid grid-cols-2 gap-2.5 max-h-40 overflow-y-auto p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                  {engineers.map(user => {
                    const engId = user.engineerProfile?.id;
                    if (!engId) return null;
                    return (
                      <label key={user.id} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={assignedEngineers.includes(engId)}
                          onChange={e => setAssignedEngineers(e.target.checked ? [...assignedEngineers, engId] : assignedEngineers.filter(id => id !== engId))}
                          className="rounded accent-primary" />
                        <span className={`text-xs font-medium ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                          {user.name} <span className="text-[10px] text-zinc-500">({user.engineerProfile?.specialization})</span>
                        </span>
                      </label>
                    );
                  })}
                  {engineers.length === 0 && <p className={`text-xs italic col-span-2 text-center ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>{isRtl ? 'لا يوجد مهندسون' : 'No engineers'}</p>}
                </div>
              </div>

              {/* Contractors */}
              <div>
                <h4 className={`text-[11px] font-extrabold uppercase mb-3 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                  🏗️ {isRtl ? 'مقاولو التنفيذ' : 'Executing Contractors'}
                </h4>
                <div className={`grid grid-cols-2 gap-2.5 max-h-40 overflow-y-auto p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                  {contractors.map(user => {
                    const contId = user.contractorProfile?.id;
                    if (!contId) return null;
                    return (
                      <label key={user.id} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={assignedContractors.includes(contId)}
                          onChange={e => setAssignedContractors(e.target.checked ? [...assignedContractors, contId] : assignedContractors.filter(id => id !== contId))}
                          className="rounded accent-primary" />
                        <span className={`text-xs font-medium ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>{user.name}</span>
                      </label>
                    );
                  })}
                  {contractors.length === 0 && <p className={`text-xs italic col-span-2 text-center ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>{isRtl ? 'لا يوجد مقاولون' : 'No contractors'}</p>}
                </div>
              </div>

              <div className={`flex justify-end gap-3 -mx-6 -mb-6 px-6 py-4 border-t ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
                <button type="button" onClick={() => setAssignTarget(null)} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${theme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'}`}>
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl primary-gradient text-zinc-950 font-bold text-xs hover:opacity-90 transition disabled:opacity-60 cursor-pointer flex items-center gap-2">
                  {saving && <span className="w-3.5 h-3.5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />}
                  {isRtl ? 'حفظ التعيين' : 'Save Assignments'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Progress Update Modal ── */}
      {progressTarget && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden ${isRtl ? 'text-right' : 'text-left'} ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-primary" />
                <div>
                  <h3 className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                    📈 {isRtl ? 'تحديث نسبة الإنجاز' : 'Update Progress'}
                  </h3>
                  <p className={`text-[10px] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{progressTarget.name}</p>
                </div>
              </div>
              <button onClick={() => setProgressTarget(null)} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer transition ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500'}`} aria-label={isRtl ? 'إغلاق' : 'Close'}>✕</button>
            </div>

            <form onSubmit={handleProgressSubmit} className="p-6 space-y-5">
              {/* Big percentage display */}
              <div className="text-center">
                <div className={`text-6xl font-black text-primary leading-none mb-1`}>{progressVal}%</div>
                <div className={`text-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{isRtl ? 'نسبة الإنجاز الحالية' : 'Current Completion Rate'}</div>
              </div>

              {/* Progress bar preview */}
              <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700/60 rounded-full h-3 overflow-hidden">
                  <div className="primary-gradient h-full rounded-full transition-all duration-200" style={{ width: `${progressVal}%` }} />
                </div>
              </div>

              {/* Range slider */}
              <div>
                <input type="range" min="0" max="100" value={progressVal} onChange={e => setProgressVal(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer" aria-label={isRtl ? 'نسبة الإنجاز' : 'Progress percentage'} />
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setProgressVal(100)}
                    className="w-full py-2 px-3 rounded-lg text-xs font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    ✅ {isRtl ? 'تعيين المشروع كمكتمل فوراً (100%)' : 'Set 100% & Mark Completed'}
                  </button>
                </div>
                <div className={`flex justify-between text-[10px] font-bold mt-1 ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                </div>
              </div>

              <div className={`flex justify-end gap-3 -mx-6 -mb-6 px-6 py-4 border-t ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
                <button type="button" onClick={() => setProgressTarget(null)} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${theme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'}`}>
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl primary-gradient text-zinc-950 font-bold text-xs hover:opacity-90 transition disabled:opacity-60 cursor-pointer flex items-center gap-2">
                  {saving && <span className="w-3.5 h-3.5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />}
                  {isRtl ? 'حفظ التحديث' : 'Save Progress'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    
      {/* ── Publish Completed Project to Public Content Modal ── */}
      {publishTarget && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col ${isRtl ? 'text-right' : 'text-left'} ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">📢</span>
                <div>
                  <h3 className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                    {isRtl ? 'نشر المشروع في المحتوى العام للتطبيق (سابقة أعمال)' : 'Publish Project to App Showcase'}
                  </h3>
                  <p className={`text-[10px] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {publishTarget.name}
                  </p>
                </div>
              </div>
              <button onClick={() => setPublishTarget(null)} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer transition ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500'}`} aria-label={isRtl ? 'إغلاق' : 'Close'}>✕</button>
            </div>

            <form onSubmit={handlePublishSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Department selection */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-2">
                  {isRtl ? 'القسم في التطبيق *' : 'App Section / Department *'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPublishForm({ ...publishForm, department: 'ENGINEERING', subCategory: 'ARCH', category: 'تصميم وإشراف هندسي' })}
                    className={`p-3 rounded-xl border text-right transition cursor-pointer ${
                      publishForm.department === 'ENGINEERING'
                        ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary'
                        : theme === 'dark' ? 'border-zinc-800 bg-zinc-800/40 text-zinc-400' : 'border-zinc-200 bg-zinc-50 text-zinc-600'
                    }`}
                  >
                    <div className="font-extrabold text-xs">📐 {isRtl ? 'خدمات هندسية' : 'Engineering'}</div>
                    <div className="text-[10px] opacity-75 mt-0.5">{isRtl ? 'يظهر في تبويب هندسة' : 'Appears in Engineering tab'}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPublishForm({ ...publishForm, department: 'CONTRACTING', subCategory: 'CONCRETE', category: 'مقاولات عامة وتشطيبات' })}
                    className={`p-3 rounded-xl border text-right transition cursor-pointer ${
                      publishForm.department === 'CONTRACTING'
                        ? 'border-purple-500 bg-purple-500/10 text-purple-500 shadow-sm ring-1 ring-purple-500'
                        : theme === 'dark' ? 'border-zinc-800 bg-zinc-800/40 text-zinc-400' : 'border-zinc-200 bg-zinc-50 text-zinc-600'
                    }`}
                  >
                    <div className="font-extrabold text-xs">🏗️ {isRtl ? 'مقاولات وإنشاءات' : 'Contracting'}</div>
                    <div className="text-[10px] opacity-75 mt-0.5">{isRtl ? 'يظهر في تبويب مقاولات' : 'Appears in Contracting tab'}</div>
                  </button>
                </div>
              </div>

              {/* Sub-Category selection */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">
                  {isRtl ? 'التصنيف في التطبيق *' : 'Mobile Filter Category *'}
                </label>
                <select
                  value={publishForm.subCategory}
                  onChange={e => setPublishForm({ ...publishForm, subCategory: e.target.value })}
                  className={`${inputCls} w-full`}
                >
                  {publishForm.department === 'ENGINEERING' ? (
                    <>
                      <option value="ARCH">{isRtl ? '📐 معماري وتصميم' : 'Architectural'}</option>
                      <option value="STRUCT">{isRtl ? '🏛️ إنشائي وإشراف' : 'Structural'}</option>
                      <option value="CONSULT">{isRtl ? '💡 استشارات هندسية' : 'Consulting'}</option>
                    </>
                  ) : (
                    <>
                      <option value="CONCRETE">{isRtl ? '🧱 خرسانة وعظم وبناء' : 'Concrete & Core'}</option>
                      <option value="FINISH">{isRtl ? '🎨 تشطيبات وديكور' : 'Finishes'}</option>
                    </>
                  )}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">
                  {isRtl ? 'عنوان المشروع في التطبيق *' : 'Showcase Title *'}
                </label>
                <input
                  required
                  value={publishForm.titleAr}
                  onChange={e => setPublishForm({ ...publishForm, titleAr: e.target.value })}
                  className={`${inputCls} w-full`}
                />
              </div>

              {/* Category / Sub-classification */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">
                    {isRtl ? 'التصنيف الفرعي' : 'Sub-Category'}
                  </label>
                  <input
                    value={publishForm.category}
                    onChange={e => setPublishForm({ ...publishForm, category: e.target.value })}
                    placeholder={isRtl ? 'مثال: معماري، إنشائي، تشطيبات' : 'e.g. Architectural, Finishes'}
                    className={`${inputCls} w-full`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">
                    {isRtl ? 'المدينة / الموقع' : 'City / Location'}
                  </label>
                  <input
                    value={publishForm.city}
                    onChange={e => setPublishForm({ ...publishForm, city: e.target.value })}
                    className={`${inputCls} w-full`}
                  />
                </div>
              </div>

              {/* Image URL & Preview */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">
                  {isRtl ? 'رابط صورة المشروع (مع رابط افتراضي ذكي)' : 'Cover Image URL'}
                </label>
                <input
                  type="url"
                  required
                  value={publishForm.coverImage}
                  onChange={e => setPublishForm({ ...publishForm, coverImage: e.target.value })}
                  className={`${inputCls} w-full`}
                  dir="ltr"
                />
                {publishForm.coverImage && (
                  <div className="mt-2 h-28 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950 relative">
                    <img
                      src={publishForm.coverImage}
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&fit=crop&q=80';
                      }}
                    />
                    <span className="absolute bottom-1 right-2 px-2 py-0.5 rounded text-[9px] font-bold bg-black/60 text-white backdrop-blur-sm">
                      {isRtl ? 'معاينة الغلاف' : 'Cover Preview'}
                    </span>
                  </div>
                )}
              </div>

              {/* Description / Additional details */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">
                  {isRtl ? 'تفاصيل إضافية عن المشروع (اختياري)' : 'Additional Project Details (Optional)'}
                </label>
                <textarea
                  rows={3}
                  value={publishForm.descriptionAr}
                  onChange={e => setPublishForm({ ...publishForm, descriptionAr: e.target.value })}
                  placeholder={isRtl ? 'اكتب نبذة عن تفاصيل التنفيذ، المواصفات، أو مخرجات المشروع...' : 'Enter details about project execution, specifications...'}
                  className={`${inputCls} w-full resize-y min-h-[70px]`}
                />
              </div>

              <div className={`flex justify-end gap-3 -mx-6 -mb-6 px-6 py-4 border-t ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
                <button
                  type="button"
                  onClick={() => setPublishTarget(null)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${theme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'}`}
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl primary-gradient text-zinc-950 font-bold text-xs hover:opacity-90 transition disabled:opacity-60 cursor-pointer flex items-center gap-2 shadow-md shadow-primary/20"
                >
                  {saving && <span className="w-3.5 h-3.5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />}
                  <span>🚀</span>
                  <span>{isRtl ? 'نشر في التطبيق الآن' : 'Publish to App Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
</div>
  );
}
