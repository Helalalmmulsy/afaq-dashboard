'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useApp } from '../../../context/AppContext';

type Dept = 'ALL' | 'ENGINEERING' | 'CONTRACTING';
type SubCat = 'ALL' | 'ARCH' | 'STRUCT' | 'CONSULT' | 'CONCRETE' | 'FINISH';

const SUBCAT_META: Record<string, { dept: 'ENGINEERING' | 'CONTRACTING'; label: string; labelEn: string; icon: string; badge: string }> = {
  ARCH:     { dept: 'ENGINEERING', label: 'معماري وتصميم',   labelEn: 'Architectural',  icon: '📐', badge: 'bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800/60' },
  STRUCT:   { dept: 'ENGINEERING', label: 'إنشائي وإشراف',   labelEn: 'Structural',     icon: '🏛️', badge: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60' },
  CONSULT:  { dept: 'ENGINEERING', label: 'استشارات هندسية', labelEn: 'Consulting',     icon: '💡', badge: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60' },
  CONCRETE: { dept: 'CONTRACTING', label: 'خرسانة وعظم',     labelEn: 'Concrete & Core',icon: '🧱', badge: 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/60' },
  FINISH:   { dept: 'CONTRACTING', label: 'تشطيبات وترميم',  labelEn: 'Finishes & Reno',icon: '🎨', badge: 'bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800/60' },
};

const DEPT_META = {
  ENGINEERING: {
    label: 'هندسي', labelEn: 'Engineering',
    icon: '⚙️',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    border: 'border-blue-200 dark:border-blue-500/20',
    bar: 'bg-blue-500',
    badge: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60',
  },
  CONTRACTING: {
    label: 'مقاولات', labelEn: 'Contracting',
    icon: '🏗️',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-500/10',
    border: 'border-purple-200 dark:border-purple-500/20',
    bar: 'bg-purple-500',
    badge: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/60',
  },
};

const STATUS_META: Record<string, { label: string; labelEn: string; cls: string; dot: string }> = {
  PUBLISHED: { label: 'نشط',   labelEn: 'Active',    cls: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60', dot: 'bg-emerald-500' },
  DRAFT:     { label: 'مسودة', labelEn: 'Draft',     cls: 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/60',               dot: 'bg-zinc-400' },
  SUSPENDED: { label: 'معطل',  labelEn: 'Suspended', cls: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',          dot: 'bg-amber-500' },
};

function StatusBadge({ status, lang }: { status: string; lang: string }) {
  const m = STATUS_META[status] ?? { label: status, labelEn: status, cls: 'bg-zinc-100 text-zinc-500 border-zinc-200', dot: 'bg-zinc-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${m.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {lang === 'ar' ? m.label : m.labelEn}
    </span>
  );
}

function DeptBadge({ dept, lang }: { dept: string; lang: string }) {
  const m = DEPT_META[dept as 'ENGINEERING' | 'CONTRACTING'];
  if (!m) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${m.badge}`}>
      {m.icon} {lang === 'ar' ? m.label : m.labelEn}
    </span>
  );
}

function SubCatBadge({ subCategory, lang }: { subCategory?: string | null; lang: string }) {
  if (!subCategory) return null;
  const m = SUBCAT_META[subCategory.toUpperCase()];
  if (!m) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${m.badge}`}>
      {m.icon} {lang === 'ar' ? m.label : m.labelEn}
    </span>
  );
}

export default function ServicesPage() {
  const { lang, theme, showAlert, showConfirm } = useApp();
  const isRtl = lang === 'ar';

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [filterDept, setFilterDept] = useState<Dept>('ALL');
  const [filterSubCat, setFilterSubCat] = useState<SubCat>('ALL');
  const [search, setSearch] = useState('');

  const [selected, setSelected] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [form, setForm] = useState({
    nameAr: '', nameEn: '', department: 'ENGINEERING', subCategory: 'ARCH',
    basePrice: '',
    shortDescriptionAr: '', shortDescriptionEn: '',
    detailedDescriptionAr: '', detailedDescriptionEn: '',
    coverImage: '', status: 'PUBLISHED',
  });

  async function loadServices() {
    setLoading(true);
    try {
      const url = filterDept === 'ALL' ? '/services' : `/services?department=${filterDept}`;
      const res = await api.get(url);
      setServices(res || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    setFilterSubCat('ALL');
    loadServices();
  }, [filterDept]);

  const openCreate = () => {
    setEditingService(null);
    const defaultDept = filterDept === 'CONTRACTING' ? 'CONTRACTING' : 'ENGINEERING';
    const defaultSub =
      defaultDept === 'CONTRACTING'
        ? (filterSubCat === 'FINISH' ? 'FINISH' : 'CONCRETE')
        : (['ARCH', 'STRUCT', 'CONSULT'].includes(filterSubCat) ? filterSubCat : 'ARCH');
    setForm({
      nameAr: '', nameEn: '', department: defaultDept, subCategory: defaultSub,
      basePrice: '',
      shortDescriptionAr: '', shortDescriptionEn: '', detailedDescriptionAr: '', detailedDescriptionEn: '',
      coverImage: defaultDept === 'CONTRACTING'
        ? 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=800'
        : 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800',
      status: 'PUBLISHED',
    });
    setShowModal(true);
  };

  const openEdit = (svc: any) => {
    setEditingService(svc);
    const dept = svc.department || 'ENGINEERING';
    setForm({
      nameAr: svc.nameAr || '', nameEn: svc.nameEn || '', department: dept,
      subCategory: svc.subCategory || (dept === 'CONTRACTING' ? 'CONCRETE' : 'ARCH'),
      basePrice: svc.basePrice != null ? String(svc.basePrice) : '',
      shortDescriptionAr: svc.shortDescriptionAr || '', shortDescriptionEn: svc.shortDescriptionEn || '',
      detailedDescriptionAr: svc.detailedDescriptionAr || '', detailedDescriptionEn: svc.detailedDescriptionEn || '',
      coverImage: svc.coverImage || '', status: svc.status || 'PUBLISHED',
    });
    setShowModal(true);
  };

  const handleSyncTaxonomies = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/services/sync-taxonomies');
      showAlert(
        isRtl
          ? `تمت المزامنة بنجاح: ${res?.created ?? 0} خدمة مضافة، ${res?.updated ?? 0} محدّثة.`
          : `Synced successfully: ${res?.created ?? 0} created, ${res?.updated ?? 0} updated.`,
        'success'
      );
      loadServices();
    } catch (err: any) {
      showAlert(err?.message || (isRtl ? 'فشلت مزامنة الخدمات.' : 'Sync failed.'), 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        basePrice: form.basePrice.trim() === '' ? null : Number(form.basePrice),
      };
      if (editingService) { await api.patch(`/services/items/${editingService.id}`, payload); }
      else { await api.post('/services/items', payload); }
      setShowModal(false);
      loadServices();
    } catch (err: any) {
      showAlert(err?.message || (isRtl ? 'فشلت العملية.' : 'Operation failed.'), 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!await showConfirm(isRtl ? 'هل أنت متأكد من حذف هذه الخدمة؟' : 'Delete this service?')) return;
    try {
      await api.delete(`/services/items/${id}`);
      if (selected?.id === id) setSelected(null);
      loadServices();
    } catch (err: any) {
      showAlert(err?.message || (isRtl ? 'فشل الحذف. قد تكون الخدمة مرتبطة بمشاريع.' : 'Delete failed.'), 'error');
    }
  };

  const engCount = services.filter(s => s.department === 'ENGINEERING').length;
  const conCount = services.filter(s => s.department === 'CONTRACTING').length;
  const activeCount = services.filter(s => s.status === 'PUBLISHED').length;

  const filtered = services.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || (s.nameAr || '').toLowerCase().includes(q) || (s.nameEn || '').toLowerCase().includes(q) || (s.shortDescriptionAr || '').toLowerCase().includes(q);
    const matchSub = filterSubCat === 'ALL' || (s.subCategory || '').toUpperCase() === filterSubCat;
    return matchSearch && matchSub;
  });

  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition ${
    theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-600' : 'bg-zinc-50 border-zinc-300 text-zinc-800 placeholder-zinc-400'
  }`;
  const card = `rounded-2xl border ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-zinc-200'}`;

  if (loading && services.length === 0) {
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
        <div className="absolute top-0 right-0 w-56 h-28 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-20 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-2">
              <span className="text-sm">⚙️</span>
              <span className="text-[11px] font-bold text-primary tracking-wide uppercase">{isRtl ? 'إدارة الخدمات' : 'Service Management'}</span>
            </div>
            <h1 className={`text-2xl font-black mb-1 ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
              {isRtl ? 'الخدمات الهندسية والمقاولات' : 'Engineering & Contracting Services'}
            </h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {isRtl ? `${services.length} خدمة مدرجة — ${activeCount} نشطة` : `${services.length} services — ${activeCount} active`}
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleSyncTaxonomies}
              disabled={syncing}
              className={`px-4 py-2.5 rounded-xl border font-bold text-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-60 ${
                theme === 'dark'
                  ? 'bg-zinc-800/80 border-zinc-700 text-zinc-200 hover:border-primary/60'
                  : 'bg-white border-zinc-300 text-zinc-700 hover:border-primary'
              }`}
              title={isRtl ? 'مزامنة الخدمات الناقصة من قائمة التصنيفات' : 'Sync services from taxonomies'}
            >
              <span className={syncing ? 'animate-spin inline-block' : ''}>🔄</span>
              <span>{syncing ? (isRtl ? 'جاري المزامنة...' : 'Syncing...') : (isRtl ? 'مزامنة من القوائم' : 'Sync Taxonomies')}</span>
            </button>
            <button onClick={openCreate} className="px-5 py-2.5 rounded-xl primary-gradient text-zinc-950 font-bold text-sm hover:opacity-90 transition shadow-md flex items-center gap-2">
              <span>+</span>
              <span>{isRtl ? 'إضافة خدمة' : 'Add Service'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { key: 'ALL' as Dept,         label: isRtl ? 'جميع الخدمات' : 'All Services',  icon: '🗂️', count: services.length, color: theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700', bg: theme === 'dark' ? 'bg-zinc-800/60' : 'bg-zinc-100/80', border: theme === 'dark' ? 'border-zinc-700' : 'border-zinc-200' },
          { key: 'ENGINEERING' as Dept, label: isRtl ? 'خدمات هندسية'  : 'Engineering',  icon: '⚙️', count: engCount,         color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-500/10',   border: 'border-blue-200 dark:border-blue-500/20' },
          { key: 'CONTRACTING' as Dept, label: isRtl ? 'خدمات مقاولات' : 'Contracting',  icon: '🏗️', count: conCount,         color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/20' },
          { key: 'ALL' as Dept,         label: isRtl ? 'خدمات نشطة'    : 'Active',        icon: '✅', count: activeCount,      color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', noFilter: true },
        ].map((s, i) => (
          <button
            key={i}
            onClick={() => !('noFilter' in s && s.noFilter) && setFilterDept(s.key)}
            className={`rounded-2xl border p-4 text-center transition-all duration-200 ${'noFilter' in s && s.noFilter ? 'cursor-default' : 'cursor-pointer'} ${
              filterDept === s.key && !('noFilter' in s && s.noFilter)
                ? `${s.bg} ${s.border} scale-[1.02] shadow-md`
                : theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
            }`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-2xl font-black ${filterDept === s.key && !('noFilter' in s && s.noFilter) ? s.color : theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>{s.count}</div>
            <div className={`text-[10px] font-bold mt-0.5 ${filterDept === s.key && !('noFilter' in s && s.noFilter) ? s.color : theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* ── Filter + Search Bar ── */}
      <div className={`${card} px-5 py-4 space-y-3`}>
        <div className="flex flex-wrap gap-3 items-center">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={isRtl ? 'بحث بالاسم أو الوصف...' : 'Search by name or description...'} className={`${inputCls} max-w-xs`} />
          <div className="flex gap-2">
            {(['ALL', 'ENGINEERING', 'CONTRACTING'] as Dept[]).map(d => (
              <button key={d} onClick={() => setFilterDept(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                  filterDept === d ? 'bg-primary text-zinc-950 border-primary' : theme === 'dark' ? 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-primary/50' : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-primary/50'
                }`}>
                {d === 'ALL' ? (isRtl ? 'الكل' : 'All') : d === 'ENGINEERING' ? (isRtl ? 'هندسي' : 'Engineering') : (isRtl ? 'مقاولات' : 'Contracting')}
              </button>
            ))}
          </div>
          {loading && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
          <span className={`ms-auto text-xs font-semibold ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{filtered.length} {isRtl ? 'نتيجة' : 'results'}</span>
        </div>

        {/* Sub-category filter pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/80">
          <span className={`text-[11px] font-bold ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
            {isRtl ? 'التصنيف الفرعي:' : 'Sub-Category:'}
          </span>
          {(
            filterDept === 'ENGINEERING'
              ? (['ALL', 'ARCH', 'STRUCT', 'CONSULT'] as SubCat[])
              : filterDept === 'CONTRACTING'
              ? (['ALL', 'CONCRETE', 'FINISH'] as SubCat[])
              : (['ALL', 'ARCH', 'STRUCT', 'CONSULT', 'CONCRETE', 'FINISH'] as SubCat[])
          ).map(sc => {
            const meta = sc === 'ALL' ? null : SUBCAT_META[sc];
            return (
              <button
                key={sc}
                type="button"
                onClick={() => setFilterSubCat(sc)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                  filterSubCat === sc
                    ? 'bg-primary/20 text-primary border-primary'
                    : theme === 'dark'
                    ? 'bg-zinc-800/70 text-zinc-400 border-zinc-700/70 hover:border-primary/40'
                    : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-primary/40'
                }`}
              >
                {sc === 'ALL' ? (isRtl ? 'الكل' : 'All') : `${meta?.icon} ${isRtl ? meta?.label : meta?.labelEn}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Two-pane Layout ── */}
      <div className="flex gap-5">

        {/* Services Table */}
        <div className={`flex-1 min-w-0 ${card} overflow-hidden`}>
          <div className={`flex items-center justify-between px-5 py-3.5 border-b ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-primary" />
              <span className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                ⚙️ {isRtl ? 'قائمة الخدمات' : 'Services List'}
              </span>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20`}>
              {filtered.length} {isRtl ? 'خدمة' : 'services'}
            </span>
          </div>

          <table className={`w-full border-collapse text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className={`text-[11px] font-bold uppercase tracking-wider border-b ${
                theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 text-zinc-500' : 'bg-zinc-50/80 border-zinc-200 text-zinc-400'
              }`}>
                <th className="px-5 py-3">{isRtl ? 'الخدمة' : 'Service'}</th>
                <th className="px-5 py-3 hidden md:table-cell">{isRtl ? 'القسم' : 'Dept'}</th>
                <th className="px-5 py-3 hidden lg:table-cell">{isRtl ? 'النبذة' : 'Description'}</th>
                <th className="px-5 py-3">{isRtl ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-zinc-800/60' : 'divide-zinc-100'}`}>
              {filtered.map(svc => {
                const isActive = selected?.id === svc.id;
                const dm = DEPT_META[svc.department as 'ENGINEERING' | 'CONTRACTING'];
                return (
                  <tr
                    key={svc.id}
                    onClick={() => setSelected(isActive ? null : svc)}
                    className={`cursor-pointer transition-colors duration-150 ${
                      isActive
                        ? theme === 'dark' ? 'bg-primary/8 border-l-2 border-primary' : 'bg-amber-50/60 border-l-2 border-primary'
                        : theme === 'dark' ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-50'
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {svc.coverImage ? (
                          <img src={svc.coverImage} alt="" className="w-11 h-11 object-cover rounded-xl border shrink-0 border-zinc-200 dark:border-zinc-700" />
                        ) : (
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                            {dm?.icon ?? '⚙️'}
                          </div>
                        )}
                        <div>
                          <div className={`font-bold text-xs leading-tight ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>
                            {isRtl ? (svc.nameAr || svc.nameEn) : (svc.nameEn || svc.nameAr)}
                          </div>
                          {svc.nameEn && svc.nameAr && (
                            <div className={`text-[10px] mt-0.5 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                              {isRtl ? svc.nameEn : svc.nameAr}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <div className="flex flex-col items-start gap-1">
                        <DeptBadge dept={svc.department} lang={lang} />
                        <SubCatBadge subCategory={svc.subCategory} lang={lang} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell max-w-xs">
                      <p className={`text-[11px] line-clamp-2 leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {isRtl ? (svc.shortDescriptionAr || svc.shortDescriptionEn) : (svc.shortDescriptionEn || svc.shortDescriptionAr)}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={svc.status} lang={lang} />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className={`py-14 text-center text-sm italic ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    {isRtl ? 'لا توجد خدمات.' : 'No services found.'}
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-5 rounded-full ${DEPT_META[selected.department as 'ENGINEERING'|'CONTRACTING']?.bar ?? 'bg-primary'}`} />
                  <span className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                    {isRtl ? 'تفاصيل الخدمة' : 'Service Details'}
                  </span>
                </div>
                <button onClick={() => setSelected(null)} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer transition ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500'}`} aria-label={isRtl ? 'إغلاق' : 'Close'}>✕</button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1">
              {/* Cover image */}
              {selected.coverImage ? (
                <div className="w-full h-44 overflow-hidden shrink-0">
                  <img src={selected.coverImage} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className={`w-full h-28 flex items-center justify-center text-5xl ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                  {DEPT_META[selected.department as 'ENGINEERING'|'CONTRACTING']?.icon ?? '⚙️'}
                </div>
              )}

              <div className="p-5 space-y-4">
                {/* Name + status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className={`font-extrabold text-base leading-tight ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                      {isRtl ? (selected.nameAr || selected.nameEn) : (selected.nameEn || selected.nameAr)}
                    </h2>
                    {selected.nameEn && selected.nameAr && (
                      <p className={`text-[11px] mt-0.5 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {isRtl ? selected.nameEn : selected.nameAr}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={selected.status} lang={lang} />
                </div>

                {/* Dept & Sub-Category chips */}
                <div className="flex flex-wrap items-center gap-2">
                  <DeptBadge dept={selected.department} lang={lang} />
                  <SubCatBadge subCategory={selected.subCategory} lang={lang} />
                  {selected.basePrice != null && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60">
                      💵 {isRtl ? `يبدأ من $${selected.basePrice}` : `From $${selected.basePrice}`}
                    </span>
                  )}
                </div>

                {/* Short description */}
                {(selected.shortDescriptionAr || selected.shortDescriptionEn) && (
                  <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                    <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'نبذة مختصرة' : 'Short Description'}</span>
                    <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>
                      {isRtl ? (selected.shortDescriptionAr || selected.shortDescriptionEn) : (selected.shortDescriptionEn || selected.shortDescriptionAr)}
                    </p>
                  </div>
                )}

                {/* Detailed description */}
                {(selected.detailedDescriptionAr || selected.detailedDescriptionEn) && (
                  <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                    <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'الوصف التفصيلي' : 'Full Description'}</span>
                    <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>
                      {isRtl ? (selected.detailedDescriptionAr || selected.detailedDescriptionEn) : (selected.detailedDescriptionEn || selected.detailedDescriptionAr)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className={`p-4 border-t space-y-2 shrink-0 ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900/60' : 'border-zinc-200 bg-zinc-50'}`}>
              <button onClick={() => openEdit(selected)} className={`w-full py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700' : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100'}`}>
                ✏️ {isRtl ? 'تعديل بيانات الخدمة' : 'Edit Service'}
              </button>
              <button onClick={() => handleDelete(selected.id)} className="w-full py-2.5 rounded-xl text-xs font-bold border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 transition cursor-pointer flex items-center justify-center gap-2">
                🗑️ {isRtl ? 'حذف الخدمة' : 'Delete Service'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col ${isRtl ? 'text-right' : 'text-left'} ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            {/* Modal header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-1 h-5 rounded-full transition-colors ${form.department === 'ENGINEERING' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                <div>
                  <h3 className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                    {editingService ? (isRtl ? 'تعديل بيانات الخدمة' : 'Edit Service') : (isRtl ? 'إضافة خدمة جديدة' : 'Add New Service')}
                  </h3>
                  <p className={`text-[10px] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{isRtl ? '* الحقول المطلوبة' : '* Required fields'}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer transition ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500'}`} aria-label={isRtl ? 'إغلاق' : 'Close'}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Department + Sub-Category + Status + Price + Cover */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'القسم *' : 'Department *'}</label>
                  <select
                    value={form.department}
                    onChange={e => {
                      const nextDept = e.target.value;
                      setForm({
                        ...form,
                        department: nextDept,
                        subCategory: nextDept === 'CONTRACTING' ? 'CONCRETE' : 'ARCH',
                      });
                    }}
                    className={inputCls}
                  >
                    <option value="ENGINEERING">{isRtl ? 'هندسي واستشاري' : 'Engineering & Consulting'}</option>
                    <option value="CONTRACTING">{isRtl ? 'مقاولات وتشطيبات' : 'Contracting & Building'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'التصنيف الفرعي *' : 'Sub-Category *'}</label>
                  <select
                    value={form.subCategory}
                    onChange={e => setForm({ ...form, subCategory: e.target.value })}
                    className={inputCls}
                  >
                    {form.department === 'ENGINEERING' ? (
                      <>
                        <option value="ARCH">{isRtl ? '📐 معماري وتصميم' : 'Architectural & Design'}</option>
                        <option value="STRUCT">{isRtl ? '🏛️ إنشائي وإشراف' : 'Structural & Supervision'}</option>
                        <option value="CONSULT">{isRtl ? '💡 استشارات هندسية' : 'Engineering Consulting'}</option>
                      </>
                    ) : (
                      <>
                        <option value="CONCRETE">{isRtl ? '🧱 خرسانة وعظم وبناء' : 'Concrete & Core Build'}</option>
                        <option value="FINISH">{isRtl ? '🎨 تشطيبات وترميم' : 'Finishes & Renovation'}</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'الحالة' : 'Status'}</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls}>
                    <option value="PUBLISHED">{isRtl ? 'نشط' : 'Active'}</option>
                    <option value="DRAFT">{isRtl ? 'مسودة' : 'Draft'}</option>
                    <option value="SUSPENDED">{isRtl ? 'معطل' : 'Suspended'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'السعر يبدأ من ($) - اختياري' : 'Starting Price (USD)'}</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.basePrice}
                    onChange={e => setForm({ ...form, basePrice: e.target.value })}
                    className={inputCls}
                    placeholder={isRtl ? 'فارغ = حسب التقييم' : 'Blank = By evaluation'}
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'رابط صورة الغلاف *' : 'Cover Image URL *'}</label>
                <input type="url" required value={form.coverImage} onChange={e => setForm({ ...form, coverImage: e.target.value })} className={inputCls} placeholder="https://..." dir="ltr" />
              </div>

              {/* Cover image preview */}
              {form.coverImage && (
                <div className="rounded-xl overflow-hidden h-28 border border-zinc-200 dark:border-zinc-700">
                  <img src={form.coverImage} alt="preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                </div>
              )}

              {/* Names */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'الاسم (عربي) *' : 'Arabic Name *'}</label>
                  <input required value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} className={inputCls} dir="rtl" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'الاسم (إنجليزي)' : 'English Name'}</label>
                  <input value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} className={inputCls} dir="ltr" placeholder="Optional" />
                </div>
              </div>

              {/* Short descriptions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'النبذة المختصرة (عربي) *' : 'Short Desc. (AR) *'}</label>
                  <textarea required rows={3} value={form.shortDescriptionAr} onChange={e => setForm({ ...form, shortDescriptionAr: e.target.value })} className={inputCls} dir="rtl" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'النبذة المختصرة (إنجليزي)' : 'Short Desc. (EN)'}</label>
                  <textarea rows={3} value={form.shortDescriptionEn} onChange={e => setForm({ ...form, shortDescriptionEn: e.target.value })} className={inputCls} dir="ltr" placeholder="Optional" />
                </div>
              </div>

              {/* Detailed descriptions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'الوصف التفصيلي (عربي) *' : 'Detailed Desc. (AR) *'}</label>
                  <textarea required rows={5} value={form.detailedDescriptionAr} onChange={e => setForm({ ...form, detailedDescriptionAr: e.target.value })} className={inputCls} dir="rtl" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'الوصف التفصيلي (إنجليزي)' : 'Detailed Desc. (EN)'}</label>
                  <textarea rows={5} value={form.detailedDescriptionEn} onChange={e => setForm({ ...form, detailedDescriptionEn: e.target.value })} className={inputCls} dir="ltr" placeholder="Optional" />
                </div>
              </div>

              {/* Footer */}
              <div className={`flex justify-end gap-3 -mx-6 -mb-6 px-6 py-4 border-t ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
                <button type="button" onClick={() => setShowModal(false)} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${theme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'}`}>
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl primary-gradient text-zinc-950 font-bold text-xs hover:opacity-90 transition disabled:opacity-60 cursor-pointer flex items-center gap-2">
                  {saving && <span className="w-3.5 h-3.5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />}
                  {isRtl ? 'حفظ الخدمة' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
