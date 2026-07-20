'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useApp } from '../../../context/AppContext';

/* ─── helpers ─── */
function StatusBadge({ status, lang }: { status: string; lang: string }) {
  const map: Record<string, { label: string; labelEn: string; cls: string }> = {
    PUBLISHED: { label: 'منشور', labelEn: 'Published', cls: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60' },
    DRAFT:     { label: 'مسودة', labelEn: 'Draft',     cls: 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/60' },
    SUSPENDED: { label: 'معطل',  labelEn: 'Suspended',  cls: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60' },
    ARCHIVED:  { label: 'مؤرشف',labelEn: 'Archived',  cls: 'bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 border-red-200 dark:border-red-800/60' },
  };
  const s = map[status] ?? { label: status, labelEn: status, cls: 'bg-zinc-100 text-zinc-500 border-zinc-200' };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${s.cls}`}>
      {lang === 'ar' ? s.label : s.labelEn}
    </span>
  );
}

function InfoCell({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div>
      <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">{label}</span>
      <span className={`font-semibold text-sm ${accent ?? ''}`}>{value}</span>
    </div>
  );
}

/* ─── page component ─── */
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

export default function PropertiesPage() {
  const { lang, theme, showAlert, showConfirm } = useApp();
  const isRtl = lang === 'ar';

  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [types, setTypes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [utilities, setUtilities] = useState<any[]>([]);
  const [guarantees, setGuarantees] = useState<any[]>([]);

  // Detail drawer
  const [selected, setSelected] = useState<any | null>(null);

  // Create / Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '',
    price: 150000, area: 250, city: 'ذمار',
    latitude: 14.5422, longitude: 44.4000,
    contactPhone: '777111222', typeId: '', typeSpecId: '', categoryId: '',
    status: 'DRAFT', featureIds: [] as string[], utilityIds: [] as string[],
    guaranteeIds: [] as string[], imageUrl: '',
    currency: 'USD',
  });

  async function loadData() {
    try {
      const [propsRes, typesRes, catsRes, featsRes, utilsRes, guarsRes] = await Promise.allSettled([
        api.get('/properties?status=ALL'),
        api.get('/properties/types'),
        api.get('/properties/categories'),
        api.get('/properties/features'),
        api.get('/properties/utilities'),
        api.get('/properties/guarantees'),
      ]);
      if (propsRes.status === 'fulfilled') setProperties(propsRes.value?.properties || []);
      if (typesRes.status === 'fulfilled') { const tl = typesRes.value || []; setTypes(tl); if (tl.length && !form.typeId) setForm(f => ({ ...f, typeId: tl[0].id })); }
      if (catsRes.status === 'fulfilled') { const cl = catsRes.value || []; setCategories(cl); if (cl.length && !form.categoryId) setForm(f => ({ ...f, categoryId: cl[0].id })); }
      if (featsRes.status === 'fulfilled') setFeatures(featsRes.value || []);
      if (utilsRes.status === 'fulfilled') setUtilities(utilsRes.value || []);
      if (guarsRes.status === 'fulfilled') setGuarantees(guarsRes.value || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/properties/${id}/status`, { status });
      // update both list and selected drawer
      setProperties(prev => prev.map(p => p.id === id ? { ...p, status } : p));
      if (selected?.id === id) setSelected((s: any) => ({ ...s, status }));
    } catch { showAlert(isRtl ? 'فشل تعديل الحالة.' : 'Failed to update status.', 'error'); }
  };

  const openCreate = () => {
    setEditingProperty(null);
    setForm({ titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '', price: 150000, area: 250, city: isRtl ? 'ذمار' : 'Dhamar', latitude: 14.5422, longitude: 44.4, contactPhone: '777111222', typeId: types[0]?.id || '', typeSpecId: '', categoryId: categories[0]?.id || '', status: 'PUBLISHED', featureIds: [], utilityIds: [], guaranteeIds: [], imageUrl: '', currency: 'USD' });
    setShowModal(true);
  };

  const openEdit = (prop: any) => {
    setEditingProperty(prop);
    setForm({ titleAr: prop.titleAr || '', titleEn: prop.titleEn || '', descriptionAr: prop.descriptionAr || '', descriptionEn: prop.descriptionEn || '', price: Number(prop.price), area: prop.area || 0, city: prop.city || '', latitude: prop.latitude || 14.5422, longitude: prop.longitude || 44.4, contactPhone: prop.contactPhone || '', typeId: prop.typeId || '', typeSpecId: prop.typeSpecId || '', categoryId: prop.categoryId || '', status: prop.status || 'DRAFT', featureIds: prop.features?.map((f: any) => f.featureId) || [], utilityIds: prop.utilities?.map((u: any) => u.utilityId) || [], guaranteeIds: prop.guarantees?.map((g: any) => g.guaranteeId) || [], imageUrl: prop.media?.[0]?.url || '', currency: prop.currency || 'USD' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, price: Number(form.price), area: Number(form.area), latitude: Number(form.latitude), longitude: Number(form.longitude), media: form.imageUrl ? [{ url: form.imageUrl, isPrimary: true }] : undefined };
    try {
      if (editingProperty) { await api.patch(`/properties/${editingProperty.id}`, payload); }
      else { await api.post('/properties', payload); }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      showAlert(err?.message || (isRtl ? 'فشلت العملية.' : 'Operation failed.'), 'error');
    } finally { setSaving(false); }
  };

  const toggle = (key: 'featureIds' | 'utilityIds' | 'guaranteeIds', id: string) =>
    setForm(prev => ({ ...prev, [key]: prev[key].includes(id) ? prev[key].filter(x => x !== id) : [...prev[key], id] }));

  /* filter */
  const filtered = properties.filter(p => {
    const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q || (p.titleAr || '').toLowerCase().includes(q) || (p.titleEn || '').toLowerCase().includes(q) || (p.city || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition ${
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
        theme === 'dark' ? 'bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800/60 border-zinc-800/80' : 'bg-gradient-to-br from-white via-zinc-50 to-amber-50/30 border-zinc-200'
      }`}>
        <div className="absolute top-0 right-0 w-56 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-2">
              <span className="text-sm">🏢</span>
              <span className="text-[11px] font-bold text-primary tracking-wide uppercase">{isRtl ? 'إدارة العقارات' : 'Property Management'}</span>
            </div>
            <h1 className={`text-2xl font-black mb-1 ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
              {isRtl ? 'قائمة العقارات المدرجة' : 'Listed Properties'}
            </h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {isRtl ? `${properties.length} عقار مسجل في المنصة` : `${properties.length} properties registered`}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-5 py-2.5 rounded-xl primary-gradient text-zinc-950 font-bold text-sm hover:opacity-90 transition shadow-md flex items-center gap-2"
          >
            <span>+</span>
            <span>{isRtl ? 'إضافة عقار' : 'Add Property'}</span>
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className={`${card} px-5 py-4 flex flex-wrap gap-3 items-center`}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={isRtl ? 'بحث بالاسم أو المدينة...' : 'Search by name or city...'}
          className={`${inputCls} max-w-xs`}
        />
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'PUBLISHED', 'DRAFT', 'SUSPENDED', 'ARCHIVED'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                filterStatus === s
                  ? 'bg-primary text-zinc-950 border-primary'
                  : theme === 'dark'
                  ? 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-primary/50'
                  : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-primary/50'
              }`}
            >
              {s === 'ALL' ? (isRtl ? 'الكل' : 'All')
                : s === 'PUBLISHED' ? (isRtl ? 'منشور' : 'Published')
                : s === 'DRAFT' ? (isRtl ? 'مسودة' : 'Draft')
                : s === 'SUSPENDED' ? (isRtl ? 'معطل' : 'Suspended')
                : (isRtl ? 'مؤرشف' : 'Archived')}
            </button>
          ))}
        </div>
        <span className={`ms-auto text-xs font-semibold ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
          {filtered.length} {isRtl ? 'نتيجة' : 'results'}
        </span>
      </div>

      {/* ── Two-pane layout ── */}
      <div className={`flex gap-5 ${selected ? '' : ''}`}>
        
        {/* Properties Table */}
        <div className={`${card} overflow-hidden flex-1 min-w-0`}>
          <table className={`w-full border-collapse text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className={`text-[11px] font-bold uppercase tracking-wider border-b ${
                theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800 text-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-400'
              }`}>
                <th className="px-5 py-3">{isRtl ? 'العقار' : 'Property'}</th>
                <th className="px-5 py-3 hidden md:table-cell">{isRtl ? 'النوع' : 'Type'}</th>
                <th className="px-5 py-3">{isRtl ? 'السعر' : 'Price'}</th>
                <th className="px-5 py-3 hidden lg:table-cell">{isRtl ? 'المساحة' : 'Area'}</th>
                <th className="px-5 py-3">{isRtl ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-zinc-800/60' : 'divide-zinc-100'}`}>
              {filtered.map(prop => (
                <tr
                  key={prop.id}
                  onClick={() => setSelected(prop)}
                  className={`cursor-pointer transition-colors duration-150 ${
                    selected?.id === prop.id
                      ? theme === 'dark' ? 'bg-primary/8 border-l-2 border-primary' : 'bg-amber-50/60 border-l-2 border-primary'
                      : theme === 'dark' ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-50'
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {prop.media?.[0]?.url ? (
                        <img src={prop.media[0].url} alt="" className="w-10 h-10 object-cover rounded-lg border shrink-0 border-zinc-200 dark:border-zinc-700" />
                      ) : (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'}`}>🏢</div>
                      )}
                      <div>
                        <div className={`font-semibold text-xs leading-tight ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>
                          {lang === 'ar' ? (prop.titleAr || prop.titleEn) : (prop.titleEn || prop.titleAr)}
                        </div>
                        <div className={`text-[10px] mt-0.5 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{prop.city}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>
                      {lang === 'ar' ? (prop.type?.nameAr || prop.type?.nameEn) : (prop.type?.nameEn || prop.type?.nameAr)}
                    </div>
                    {prop.category && (
                      <div className="text-[10px] text-primary mt-0.5">
                        {lang === 'ar' ? (prop.category?.nameAr || prop.category?.nameEn) : (prop.category?.nameEn || prop.category?.nameAr)}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-primary font-mono text-xs">
                    {formatPrice(prop.price, prop.currency, isRtl)}
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <span className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{prop.area} م²</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={prop.status} lang={lang} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className={`py-12 text-center text-sm italic ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  {isRtl ? 'لا توجد عقارات.' : 'No properties found.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Detail Drawer (side panel) ── */}
        {selected && (
          <div className={`w-80 xl:w-96 shrink-0 ${card} flex flex-col overflow-hidden max-h-[calc(100vh-10rem)] sticky top-24`}>
            {/* Drawer header */}
            <div className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
              theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-primary" />
                <span className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                  {isRtl ? 'تفاصيل العقار' : 'Property Details'}
                </span>
              </div>
              <button
                onClick={() => setSelected(null)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition cursor-pointer ${
                  theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500'
                }`}
              >✕</button>
            </div>

            {/* Drawer scrollable body */}
            <div className="overflow-y-auto flex-1">
              {/* Cover image */}
              {selected.media?.[0]?.url && (
                <div className="w-full h-44 overflow-hidden">
                  <img src={selected.media[0].url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              {!selected.media?.[0]?.url && (
                <div className={`w-full h-32 flex items-center justify-center text-5xl ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'}`}>🏢</div>
              )}

              <div className="p-5 space-y-5">
                {/* Title & status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className={`font-extrabold text-base leading-tight ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                      {lang === 'ar' ? (selected.titleAr || selected.titleEn) : (selected.titleEn || selected.titleAr)}
                    </h2>
                    {selected.titleEn && selected.titleAr && lang === 'ar' && (
                      <p className={`text-[11px] mt-0.5 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{selected.titleEn}</p>
                    )}
                  </div>
                  <StatusBadge status={selected.status} lang={lang} />
                </div>

                {/* Key stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                    <InfoCell label={isRtl ? 'السعر' : 'Price'} value={formatPrice(selected.price, selected.currency, isRtl)} accent="text-primary" />
                  </div>
                  <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                    <InfoCell label={isRtl ? 'المساحة' : 'Area'} value={`${selected.area} م²`} accent={theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'} />
                  </div>
                  <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                    <InfoCell label={isRtl ? 'المدينة' : 'City'} value={selected.city} accent={theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'} />
                  </div>
                  <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                    <InfoCell label={isRtl ? 'التواصل' : 'Phone'} value={selected.contactPhone || '—'} accent={theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'} />
                  </div>
                </div>

                {/* Type & category */}
                <div className={`p-3 rounded-xl border space-y-2 ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                  <InfoCell
                    label={isRtl ? 'نوع العقار' : 'Type'}
                    value={lang === 'ar' ? (selected.type?.nameAr || selected.type?.nameEn) : (selected.type?.nameEn || selected.type?.nameAr)}
                    accent={theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}
                  />
                  {selected.category && (
                    <InfoCell
                      label={isRtl ? 'التصنيف' : 'Category'}
                      value={lang === 'ar' ? (selected.category?.nameAr || selected.category?.nameEn) : (selected.category?.nameEn || selected.category?.nameAr)}
                      accent="text-primary"
                    />
                  )}
                  {selected.typeSpec && (
                    <InfoCell
                      label={isRtl ? 'المواصفات' : 'Spec'}
                      value={lang === 'ar' ? (selected.typeSpec?.nameAr || selected.typeSpec?.nameEn) : (selected.typeSpec?.nameEn || selected.typeSpec?.nameAr)}
                      accent={theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}
                    />
                  )}
                </div>

                {/* Description */}
                {(selected.descriptionAr || selected.descriptionEn) && (
                  <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                    <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'الوصف' : 'Description'}</span>
                    <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>
                      {lang === 'ar' ? (selected.descriptionAr || selected.descriptionEn) : (selected.descriptionEn || selected.descriptionAr)}
                    </p>
                  </div>
                )}

                {/* Features / Utilities / Guarantees */}
                {selected.features?.length > 0 && (
                  <div>
                    <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-2">✨ {isRtl ? 'المميزات' : 'Features'}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.features.map((f: any) => (
                        <span key={f.featureId} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-600'}`}>
                          {lang === 'ar' ? (f.feature?.nameAr || f.feature?.nameEn) : (f.feature?.nameEn || f.feature?.nameAr)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selected.utilities?.length > 0 && (
                  <div>
                    <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-2">💧 {isRtl ? 'المرافق' : 'Utilities'}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.utilities.map((u: any) => (
                        <span key={u.utilityId} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${theme === 'dark' ? 'bg-blue-950/30 border-blue-800/60 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                          {lang === 'ar' ? (u.utility?.nameAr || u.utility?.nameEn) : (u.utility?.nameEn || u.utility?.nameAr)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selected.guarantees?.length > 0 && (
                  <div>
                    <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-2">🛡️ {isRtl ? 'الضمانات' : 'Guarantees'}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.guarantees.map((g: any) => (
                        <span key={g.guaranteeId} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${theme === 'dark' ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                          {lang === 'ar' ? (g.guarantee?.nameAr || g.guarantee?.nameEn) : (g.guarantee?.nameEn || g.guarantee?.nameAr)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Map link */}
                {selected.latitude && selected.longitude && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selected.latitude},${selected.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-xs text-primary font-bold hover:underline"
                  >
                    📍 {isRtl ? 'عرض الموقع على الخريطة' : 'View on Google Maps'}
                    <span className="text-[10px]">↗</span>
                  </a>
                )}
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className={`p-4 border-t shrink-0 space-y-2 ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900/60' : 'border-zinc-200 bg-zinc-50'}`}>
              {/* Edit */}
              <button
                onClick={() => openEdit(selected)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-2 ${
                  theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700' : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                ✏️ {isRtl ? 'تعديل بيانات العقار' : 'Edit Property'}
              </button>

              {/* Status actions */}
              <div className="grid grid-cols-2 gap-2">
                {selected.status !== 'PUBLISHED' && (
                  <button onClick={() => handleStatusChange(selected.id, 'PUBLISHED')}
                    className="py-2 rounded-xl text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition cursor-pointer flex items-center justify-center gap-1">
                    ✅ {isRtl ? 'نشر' : 'Publish'}
                  </button>
                )}
                {selected.status === 'PUBLISHED' && (
                  <button onClick={() => handleStatusChange(selected.id, 'SUSPENDED')}
                    className="py-2 rounded-xl text-[11px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition cursor-pointer flex items-center justify-center gap-1">
                    ⏸ {isRtl ? 'تعطيل' : 'Suspend'}
                  </button>
                )}
                {selected.status !== 'DRAFT' && (
                  <button onClick={() => handleStatusChange(selected.id, 'DRAFT')}
                    className={`py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer flex items-center justify-center gap-1 ${
                      theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700' : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:bg-zinc-200'
                    }`}>
                    📝 {isRtl ? 'مسودة' : 'Draft'}
                  </button>
                )}
                <button onClick={() => handleStatusChange(selected.id, 'ARCHIVED')}
                  className="py-2 rounded-xl text-[11px] font-bold bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800/60 hover:bg-red-100 dark:hover:bg-red-950/50 transition cursor-pointer flex items-center justify-center gap-1">
                  🗄️ {isRtl ? 'أرشفة' : 'Archive'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ──────────────── Create / Edit Modal ──────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${isRtl ? 'text-right' : 'text-left'} ${
            theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            {/* Modal header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-primary" />
                <h3 className={`text-base font-extrabold ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                  {editingProperty ? (isRtl ? 'تعديل بيانات العقار' : 'Edit Property') : (isRtl ? 'إدراج عقار جديد' : 'Add New Property')}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer transition ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500'}`}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">

              {/* Titles */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'العنوان بالعربي *' : 'Arabic Title *'}</label>
                  <input required value={form.titleAr} onChange={e => setForm({ ...form, titleAr: e.target.value })} className={inputCls} dir="rtl" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'العنوان بالإنجليزي' : 'English Title'}</label>
                  <input value={form.titleEn} onChange={e => setForm({ ...form, titleEn: e.target.value })} className={inputCls} dir="ltr" placeholder="Optional" />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'الوصف بالعربي *' : 'Arabic Description *'}</label>
                  <textarea required rows={3} value={form.descriptionAr} onChange={e => setForm({ ...form, descriptionAr: e.target.value })} className={inputCls} dir="rtl" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'الوصف بالإنجليزي' : 'English Description'}</label>
                  <textarea rows={3} value={form.descriptionEn} onChange={e => setForm({ ...form, descriptionEn: e.target.value })} className={inputCls} dir="ltr" placeholder="Optional" />
                </div>
              </div>

              {/* Price & Area */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'السعر *' : 'Price *'}</label>
                  <div className="flex gap-2">
                    <input type="number" required value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className={inputCls.replace('w-full', 'flex-1')} />
                    <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className={inputCls.replace('w-full', 'w-32')} aria-label={isRtl ? 'العملة' : 'Currency'}>
                      <option value="USD">{isRtl ? 'دولار ($)' : 'USD ($)'}</option>
                      <option value="YER">{isRtl ? 'يمني (ر.ي)' : 'YER (ر.ي)'}</option>
                      <option value="SAR">{isRtl ? 'سعودي (ر.س)' : 'SAR (ر.س)'}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'المساحة (م²) *' : 'Area (sqm) *'}</label>
                  <input type="number" required value={form.area} onChange={e => setForm({ ...form, area: Number(e.target.value) })} className={inputCls} />
                </div>
              </div>

              {/* Geo */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'المدينة *' : 'City *'}</label>
                  <input required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">Latitude</label>
                  <input type="number" step="any" required value={form.latitude} onChange={e => setForm({ ...form, latitude: Number(e.target.value) })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">Longitude</label>
                  <input type="number" step="any" required value={form.longitude} onChange={e => setForm({ ...form, longitude: Number(e.target.value) })} className={inputCls} />
                </div>
              </div>

              {/* Type, Spec, Category, Phone */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'نوع العقار' : 'Type'}</label>
                  <select value={form.typeId} onChange={e => { const t = types.find(x => x.id === e.target.value); setForm({ ...form, typeId: e.target.value, typeSpecId: t?.specs?.[0]?.id || '' }); }} className={inputCls}>
                    {types.map(t => <option key={t.id} value={t.id}>{lang === 'ar' ? t.nameAr : t.nameEn}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'المواصفة' : 'Spec'}</label>
                  <select value={form.typeSpecId} onChange={e => setForm({ ...form, typeSpecId: e.target.value })} disabled={!(types.find(t => t.id === form.typeId)?.specs?.length)} className={`${inputCls} disabled:opacity-40`}>
                    <option value="">{isRtl ? '-- اختر --' : '-- Select --'}</option>
                    {(types.find(t => t.id === form.typeId)?.specs || []).map((s: any) => <option key={s.id} value={s.id}>{lang === 'ar' ? s.nameAr : s.nameEn}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'التصنيف' : 'Category'}</label>
                  <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className={inputCls}>
                    {categories.map(c => <option key={c.id} value={c.id}>{lang === 'ar' ? c.nameAr : c.nameEn}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'هاتف التواصل' : 'Phone'}</label>
                  <input required value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} className={inputCls} />
                </div>
              </div>

              {/* Image & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'رابط صورة الغلاف' : 'Cover Image URL'}</label>
                  <input type="url" placeholder="https://..." value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'الحالة' : 'Status'}</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls}>
                    <option value="DRAFT">{isRtl ? 'مسودة' : 'Draft'}</option>
                    <option value="PUBLISHED">{isRtl ? 'منشور' : 'Published'}</option>
                    <option value="SUSPENDED">{isRtl ? 'معطل' : 'Suspended'}</option>
                  </select>
                </div>
              </div>

              {/* Checkboxes */}
              <div className={`grid grid-cols-3 gap-4 p-4 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/30 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                {[
                  { key: 'featureIds' as const, icon: '✨', label: isRtl ? 'المميزات' : 'Features', items: features },
                  { key: 'utilityIds' as const, icon: '💧', label: isRtl ? 'المرافق' : 'Utilities', items: utilities },
                  { key: 'guaranteeIds' as const, icon: '🛡️', label: isRtl ? 'الضمانات' : 'Guarantees', items: guarantees },
                ].map(({ key, icon, label, items }) => (
                  <div key={key}>
                    <h4 className={`text-[11px] font-extrabold uppercase mb-2 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{icon} {label}</h4>
                    <div className="space-y-1.5 max-h-28 overflow-y-auto">
                      {items.map(item => (
                        <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={form[key].includes(item.id)} onChange={() => toggle(key, item.id)} className="rounded accent-primary" />
                          <span className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>{lang === 'ar' ? (item.nameAr || item.nameEn) : (item.nameEn || item.nameAr)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer buttons */}
              <div className={`flex justify-end gap-3 pt-2 -mx-6 -mb-6 px-6 py-4 border-t ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
                <button type="button" onClick={() => setShowModal(false)} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${theme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'}`}>
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl primary-gradient text-zinc-950 font-bold text-xs hover:opacity-90 transition disabled:opacity-60 cursor-pointer flex items-center gap-2">
                  {saving && <span className="w-3.5 h-3.5 border-2 border-zinc-950/40 border-t-zinc-950 rounded-full animate-spin" />}
                  {isRtl ? 'حفظ العقار' : 'Save Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
