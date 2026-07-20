'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useApp } from '../../../context/AppContext';

const STATUS_META: Record<string, { label: string; labelEn: string; cls: string; dot: string }> = {
  NEW:             { label: 'جديد',           labelEn: 'New',            cls: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60',    dot: 'bg-blue-500' },
  UNDER_REVIEW:    { label: 'قيد المراجعة',   labelEn: 'Under Review',   cls: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60', dot: 'bg-amber-500' },
  PROJECT_CREATED: { label: 'تم إنشاء المشروع', labelEn: 'Project Created', cls: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60', dot: 'bg-emerald-500' },
  REJECTED:        { label: 'مرفوض',          labelEn: 'Rejected',       cls: 'bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 border-red-200 dark:border-red-800/60',         dot: 'bg-red-500' },
};

const PROPERTY_TYPES: Record<string, { labelAr: string; labelEn: string; icon: string; cls: string }> = {
  LAND: { labelAr: 'أرض / أرض فضاء', labelEn: 'Land / Plot', icon: '⛰️', cls: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' },
  APARTMENT: { labelAr: 'شقة سكنية', labelEn: 'Apartment', icon: '🏢', cls: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50' },
  VILLA: { labelAr: 'فيلا مستقلة', labelEn: 'Villa', icon: '🏡', cls: 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/50' },
  BUILDING: { labelAr: 'عمارة / مبنى كامل', labelEn: 'Building / Tower', icon: '🏗️', cls: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50' },
  COMMERCIAL: { labelAr: 'مجمع / معرض تجاري', labelEn: 'Commercial', icon: '🏬', cls: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50' },
};

function StatusBadge({ status, lang }: { status: string; lang: string }) {
  const m = STATUS_META[status] ?? { label: status, labelEn: status, cls: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700', dot: 'bg-zinc-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${m.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {lang === 'ar' ? m.label : m.labelEn}
    </span>
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

export default function RequestsPage() {
  const { lang, theme, showAlert, showConfirm } = useApp();
  const isRtl = lang === 'ar';

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  // Side panel
  const [selected, setSelected] = useState<any | null>(null);

  // Approve modal
  const [approveTarget, setApproveTarget] = useState<any | null>(null);
  const [approveForm, setApproveForm] = useState({
    budget: 5000,
    startDate: new Date().toISOString().split('T')[0],
    expectedEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  async function loadRequests() {
    setLoading(true);
    try {
      const res = await api.get('/services/requests/all');
      setRequests(res.requests || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadRequests(); }, []);

  const handleReview = async (id: string, status: string) => {
    try {
      await api.patch(`/services/requests/${id}/review`, { status });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      if (selected?.id === id) setSelected((s: any) => ({ ...s, status }));
    } catch { showAlert(isRtl ? 'فشل تحديث الطلب' : 'Failed to update request', 'error'); }
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveTarget) return;
    setSaving(true);
    try {
      await api.post(`/services/requests/${approveTarget.id}/approve`, {
        budget: Number(approveForm.budget),
        startDate: new Date(approveForm.startDate),
        expectedEndDate: new Date(approveForm.expectedEndDate),
      });
      setApproveTarget(null);
      loadRequests();
    } catch (err: any) {
      showAlert(err?.message || (isRtl ? 'فشل اعتماد الطلب' : 'Failed to approve request'), 'error');
    } finally { setSaving(false); }
  };

  const openApprove = (req: any) => {
    setApproveTarget(req);
    setApproveForm({
      budget: req.expectedBudget || 5000,
      startDate: new Date().toISOString().split('T')[0],
      expectedEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  };

  const filtered = requests.filter(r => {
    const matchStatus = filterStatus === 'ALL' || r.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q || (r.projectName || '').toLowerCase().includes(q) || (r.customer?.name || '').toLowerCase().includes(q) || (r.location || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // Stats
  const counts = {
    total: requests.length,
    NEW: requests.filter(r => r.status === 'NEW').length,
    UNDER_REVIEW: requests.filter(r => r.status === 'UNDER_REVIEW').length,
    PROJECT_CREATED: requests.filter(r => r.status === 'PROJECT_CREATED').length,
    REJECTED: requests.filter(r => r.status === 'REJECTED').length,
  };

  const inputCls = `px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition ${
    theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-600' : 'bg-zinc-50 border-zinc-300 text-zinc-800 placeholder-zinc-400'
  }`;
  const card = `rounded-2xl border ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-zinc-200'}`;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{isRtl ? 'جاري تحميل الطلبات...' : 'Loading requests...'}</p>
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
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[11px] font-bold text-primary tracking-wide uppercase">{isRtl ? 'إدارة الطلبات' : 'Request Management'}</span>
          </div>
          <h1 className={`text-2xl font-black mb-1 ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
            {isRtl ? 'طلبات الخدمات الواردة' : 'Incoming Service Requests'}
          </h1>
          <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
            {isRtl ? 'استعرض طلبات العملاء واعتمدها أو ارفضها وحوّلها لمشاريع تشغيلية' : 'Review client requests, approve or reject, and convert to operational projects'}
          </p>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { key: 'NEW',             label: isRtl ? 'جديد'              : 'New',             icon: '🔵', color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-500/10',    border: 'border-blue-200 dark:border-blue-500/20' },
          { key: 'UNDER_REVIEW',    label: isRtl ? 'قيد المراجعة'      : 'Under Review',    icon: '🟡', color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-500/10',  border: 'border-amber-200 dark:border-amber-500/20' },
          { key: 'PROJECT_CREATED', label: isRtl ? 'تم إنشاء المشروع' : 'Project Created', icon: '🟢', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20' },
          { key: 'REJECTED',        label: isRtl ? 'مرفوض'             : 'Rejected',        icon: '🔴', color: 'text-red-500 dark:text-red-400',      bg: 'bg-red-50 dark:bg-red-500/10',      border: 'border-red-200 dark:border-red-500/20' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setFilterStatus(filterStatus === s.key ? 'ALL' : s.key)}
            className={`rounded-2xl border p-4 text-center transition-all duration-200 cursor-pointer ${
              filterStatus === s.key
                ? `${s.bg} ${s.border} scale-[1.02] shadow-md`
                : theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
            }`}
          >
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-2xl font-black ${filterStatus === s.key ? s.color : theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>
              {counts[s.key as keyof typeof counts]}
            </div>
            <div className={`text-[10px] font-bold mt-0.5 ${filterStatus === s.key ? s.color : theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {s.label}
            </div>
          </button>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div className={`${card} px-5 py-4 flex flex-wrap gap-3 items-center`}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={isRtl ? 'بحث بالاسم أو العميل أو الموقع...' : 'Search by name, client or location...'}
          className={`${inputCls} w-full max-w-xs`}
        />
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'NEW', 'UNDER_REVIEW', 'PROJECT_CREATED', 'REJECTED'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                filterStatus === s
                  ? 'bg-primary text-zinc-950 border-primary'
                  : theme === 'dark' ? 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-primary/50' : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-primary/50'
              }`}>
              {s === 'ALL' ? (isRtl ? 'الكل' : 'All')
                : s === 'NEW' ? (isRtl ? 'جديد' : 'New')
                : s === 'UNDER_REVIEW' ? (isRtl ? 'مراجعة' : 'Review')
                : s === 'PROJECT_CREATED' ? (isRtl ? 'مُعتمد' : 'Approved')
                : (isRtl ? 'مرفوض' : 'Rejected')}
            </button>
          ))}
        </div>
        <span className={`ms-auto text-xs font-semibold ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
          {filtered.length} {isRtl ? 'نتيجة' : 'results'}
        </span>
      </div>

      {/* ── Two-pane layout ── */}
      <div className="flex gap-5">

        {/* Requests Table */}
        <div className={`flex-1 min-w-0 ${card} overflow-hidden`}>
          <div className={`flex items-center justify-between px-5 py-3.5 border-b ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-blue-500" />
              <span className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                📝 {isRtl ? 'قائمة الطلبات' : 'Requests List'}
              </span>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60`}>
              {filtered.length} {isRtl ? 'طلب' : 'requests'}
            </span>
          </div>

          <table className={`w-full border-collapse text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className={`text-[11px] font-bold uppercase tracking-wider border-b ${
                theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 text-zinc-500' : 'bg-zinc-50/80 border-zinc-200 text-zinc-400'
              }`}>
                <th className="px-5 py-3">{isRtl ? 'الطلب' : 'Request'}</th>
                <th className="px-5 py-3 hidden md:table-cell">{isRtl ? 'العميل' : 'Client'}</th>
                <th className="px-5 py-3 hidden lg:table-cell">{isRtl ? 'الخدمة' : 'Service'}</th>
                <th className="px-5 py-3">{isRtl ? 'الميزانية' : 'Budget'}</th>
                <th className="px-5 py-3">{isRtl ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-zinc-800/60' : 'divide-zinc-100'}`}>
              {filtered.map(req => {
                const isActive = selected?.id === req.id;
                return (
                  <tr
                    key={req.id}
                    onClick={() => setSelected(isActive ? null : req)}
                    className={`cursor-pointer transition-colors duration-150 ${
                      isActive
                        ? theme === 'dark' ? 'bg-blue-500/8 border-l-2 border-blue-500' : 'bg-blue-50/60 border-l-2 border-blue-500'
                        : theme === 'dark' ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-50'
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className={`font-semibold text-xs leading-tight ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>{req.projectName}</div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {req.propertyType && PROPERTY_TYPES[req.propertyType] && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                            {PROPERTY_TYPES[req.propertyType].icon} {isRtl ? PROPERTY_TYPES[req.propertyType].labelAr : PROPERTY_TYPES[req.propertyType].labelEn}
                          </span>
                        )}
                        {req.location && (
                          <span className={`text-[10px] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>📍 {req.location}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{req.customer?.name || (isRtl ? 'زائر' : 'Guest')}</div>
                      {req.customer?.email && <div className={`text-[10px] mt-0.5 font-mono ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>{req.customer.email}</div>}
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>
                        {isRtl ? (req.service?.nameAr || req.service?.nameEn) : (req.service?.nameEn || req.service?.nameAr)}
                      </div>
                      {req.service?.department && (
                        <div className="text-[10px] text-primary mt-0.5 font-bold">
                          {req.service.department === 'ENGINEERING' ? (isRtl ? 'هندسية' : 'Engineering') : (isRtl ? 'مقاولات' : 'Contracting')}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-primary font-mono text-xs">
                      {req.expectedBudget ? formatPrice(req.expectedBudget, req.currency, isRtl) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={req.status} lang={lang} />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className={`py-14 text-center text-sm italic ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    {isRtl ? 'لا توجد طلبات تطابق الفلتر الحالي.' : 'No requests match the current filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Detail Side Panel ── */}
        {selected && (
          <div className={`w-80 xl:w-96 shrink-0 ${card} flex flex-col overflow-hidden max-h-[calc(100vh-10rem)] sticky top-24`}>
            {/* Header */}
            <div className={`px-5 py-4 border-b shrink-0 ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-blue-500" />
                  <span className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                    {isRtl ? 'تفاصيل الطلب' : 'Request Details'}
                  </span>
                </div>
                <button onClick={() => setSelected(null)} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer transition ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500'}`} aria-label={isRtl ? 'إغلاق' : 'Close'}>✕</button>
              </div>
              <StatusBadge status={selected.status} lang={lang} />
            </div>

            {/* Scrollable body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Project name */}
              <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isRtl ? 'اسم المشروع' : 'Project Name'}</span>
                <span className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>{selected.projectName}</span>
              </div>

              {/* Key info grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isRtl ? 'الميزانية المتوقعة' : 'Est. Budget'}</span>
                  <span className="text-primary font-extrabold text-sm font-mono">
                    {selected.expectedBudget ? formatPrice(selected.expectedBudget, selected.currency, isRtl) : '—'}
                  </span>
                </div>
                 <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isRtl ? 'الموقع والمعاينة' : 'Location & Site'}</span>
                  <div className="space-y-1">
                    <span className={`font-bold text-xs block ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>📍 {selected.location || '—'}</span>
                    {selected.propertyType && PROPERTY_TYPES[selected.propertyType] && (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border mt-0.5 ${PROPERTY_TYPES[selected.propertyType].cls}`}>
                        {PROPERTY_TYPES[selected.propertyType].icon} {isRtl ? PROPERTY_TYPES[selected.propertyType].labelAr : PROPERTY_TYPES[selected.propertyType].labelEn}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Client */}
              <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isRtl ? 'العميل' : 'Client'}</span>
                <span className={`font-bold text-sm block ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>{selected.customer?.name || (isRtl ? 'زائر' : 'Guest')}</span>
                {selected.customer?.email && <span className={`text-[10px] font-mono ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{selected.customer.email}</span>}
              </div>

              {/* Service */}
              {selected.service && (
                <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isRtl ? 'الخدمة المطلوبة' : 'Requested Service'}</span>
                  <span className={`font-bold text-sm block ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>
                    {isRtl ? (selected.service.nameAr || selected.service.nameEn) : (selected.service.nameEn || selected.service.nameAr)}
                  </span>
                  <span className="text-[10px] text-primary font-bold mt-0.5 block">
                    {selected.service.department === 'ENGINEERING' ? (isRtl ? 'خدمات هندسية' : 'Engineering') : (isRtl ? 'مقاولات عامة' : 'Contracting')}
                  </span>
                </div>
              )}

              {/* Description */}
              {selected.description && (
                <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isRtl ? 'تفاصيل الطلب' : 'Description'}</span>
                  <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{selected.description}</p>
                </div>
              )}

              {/* Date */}
              <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isRtl ? 'تاريخ الطلب' : 'Submitted'}</span>
                <span className={`text-xs font-mono ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'}
                </span>
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className={`p-4 border-t space-y-2 shrink-0 ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900/60' : 'border-zinc-200 bg-zinc-50'}`}>
              {selected.status === 'NEW' && (
                <button onClick={() => handleReview(selected.id, 'UNDER_REVIEW')}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-2 ${
                    theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700' : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                  }`}>
                  👁️ {isRtl ? 'بدء المراجعة' : 'Start Review'}
                </button>
              )}
              {selected.status !== 'PROJECT_CREATED' && selected.status !== 'REJECTED' && (
                <>
                  <button onClick={() => openApprove(selected)}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition cursor-pointer flex items-center justify-center gap-2">
                    ✅ {isRtl ? 'اعتماد وإنشاء مشروع' : 'Approve & Create Project'}
                  </button>
                  <button onClick={() => handleReview(selected.id, 'REJECTED')}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800/60 hover:bg-red-100 dark:hover:bg-red-950/50 transition cursor-pointer flex items-center justify-center gap-2">
                    ❌ {isRtl ? 'رفض الطلب' : 'Reject Request'}
                  </button>
                </>
              )}
              {selected.status === 'PROJECT_CREATED' && (
                <div className="w-full py-2.5 rounded-xl text-xs font-bold text-center bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                  ✅ {isRtl ? 'تم إنشاء المشروع بنجاح' : 'Project created successfully'}
                </div>
              )}
              {selected.status === 'REJECTED' && (
                <div className="w-full py-2.5 rounded-xl text-xs font-bold text-center bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800/40">
                  ❌ {isRtl ? 'تم رفض هذا الطلب' : 'This request was rejected'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Approve & Generate Project Modal ── */}
      {approveTarget && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${isRtl ? 'text-right' : 'text-left'} ${
            theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            {/* Modal header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-emerald-500" />
                <div>
                  <h3 className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                    ✅ {isRtl ? 'اعتماد وتوليد مشروع' : 'Approve & Create Project'}
                  </h3>
                  <p className={`text-[10px] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{approveTarget.projectName}</p>
                </div>
              </div>
              <button onClick={() => setApproveTarget(null)} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer transition ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500'}`} aria-label={isRtl ? 'إغلاق' : 'Close'}>✕</button>
            </div>

            <form onSubmit={handleApproveSubmit} className="p-6 space-y-4">
              {/* Request summary */}
              <div className={`p-3.5 rounded-xl border space-y-1.5 ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                <div className={`text-xs font-bold ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>{approveTarget.projectName}</div>
                <div className={`text-[10px] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{isRtl ? 'العميل:' : 'Client:'} {approveTarget.customer?.name}</div>
                <div className={`text-[10px] text-primary font-bold`}>{isRtl ? 'الميزانية المتوقعة:' : 'Expected Budget:'} {approveTarget.expectedBudget ? formatPrice(approveTarget.expectedBudget, approveTarget.currency, isRtl) : '—'}</div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">
                  {isRtl 
                    ? `الميزانية المعتمدة (${getCurrencySymbol(approveTarget.currency, isRtl)}) *` 
                    : `Approved Budget (${getCurrencySymbol(approveTarget.currency, isRtl)}) *`}
                </label>
                <input type="number" required value={approveForm.budget} onChange={e => setApproveForm({ ...approveForm, budget: Number(e.target.value) })}
                  className={`w-full ${
                    theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-zinc-50 border-zinc-300 text-zinc-800'
                  } px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition`} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'تاريخ البدء *' : 'Start Date *'}</label>
                  <input type="date" required value={approveForm.startDate} onChange={e => setApproveForm({ ...approveForm, startDate: e.target.value })}
                    className={`w-full ${theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-zinc-50 border-zinc-300 text-zinc-800'} px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition`} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'تاريخ التسليم *' : 'End Date *'}</label>
                  <input type="date" required value={approveForm.expectedEndDate} onChange={e => setApproveForm({ ...approveForm, expectedEndDate: e.target.value })}
                    className={`w-full ${theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-zinc-50 border-zinc-300 text-zinc-800'} px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition`} />
                </div>
              </div>

              <div className={`flex justify-end gap-3 -mx-6 -mb-6 px-6 py-4 border-t ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
                <button type="button" onClick={() => setApproveTarget(null)} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${theme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'}`}>
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl primary-gradient text-zinc-950 font-bold text-xs hover:opacity-90 transition disabled:opacity-60 cursor-pointer flex items-center gap-2">
                  {saving && <span className="w-3.5 h-3.5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />}
                  {isRtl ? '⚡ اعتماد وتوليد المشروع' : '⚡ Approve & Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
