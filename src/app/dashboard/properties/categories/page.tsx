'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../../lib/api';
import { useApp } from '../../../../context/AppContext';

type Tab = 'categories' | 'features' | 'utilities' | 'guarantees';

const TAB_META: Record<Tab, { icon: string; color: string; accent: string; bg: string; border: string }> = {
  categories: { icon: '🧩', color: 'text-blue-600 dark:text-blue-400',   accent: 'bg-blue-500',   bg: 'bg-blue-50 dark:bg-blue-500/10',   border: 'border-blue-200 dark:border-blue-500/20' },
  features:   { icon: '✨', color: 'text-amber-600 dark:text-amber-400',  accent: 'bg-amber-500',  bg: 'bg-amber-50 dark:bg-amber-500/10',  border: 'border-amber-200 dark:border-amber-500/20' },
  utilities:  { icon: '💧', color: 'text-emerald-600 dark:text-emerald-400', accent: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20' },
  guarantees: { icon: '🛡️', color: 'text-purple-600 dark:text-purple-400', accent: 'bg-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/20' },
};

export default function CategoriesFeaturesPage() {
  const { lang, theme, showAlert, showConfirm } = useApp();
  const isRtl = lang === 'ar';

  const [activeTab, setActiveTab] = useState<Tab>('categories');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Selected item for detail side panel
  const [selected, setSelected] = useState<any | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [form, setForm] = useState({ nameAr: '', nameEn: '' });

  const getEndpoint = (tab: Tab) => ({
    categories: '/properties/categories',
    features:   '/properties/features',
    utilities:  '/properties/utilities',
    guarantees: '/properties/guarantees',
  }[tab]);

  async function loadItems(tab: Tab = activeTab) {
    setLoading(true);
    try {
      const res = await api.get(getEndpoint(tab));
      setItems(res || []);
      setSelected(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadItems(activeTab); }, [activeTab]);

  const openCreate = () => {
    setEditingItem(null);
    setForm({ nameAr: '', nameEn: '' });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setForm({ nameAr: item.nameAr || '', nameEn: item.nameEn || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ep = getEndpoint(activeTab);
    try {
      if (editingItem) { await api.patch(`${ep}/${editingItem.id}`, form); }
      else { await api.post(ep, form); }
      setShowModal(false);
      loadItems();
    } catch (err: any) {
      showAlert(err?.message || (isRtl ? 'فشلت العملية.' : 'Operation failed.'), 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!await showConfirm(isRtl ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete this?')) return;
    try {
      await api.delete(`${getEndpoint(activeTab)}/${id}`);
      if (selected?.id === id) setSelected(null);
      loadItems();
    } catch (err: any) {
      showAlert(err?.message || (isRtl ? 'فشل الحذف. قد يكون العنصر مرتبطاً بعقارات.' : 'Delete failed. Item may be in use.'), 'error');
    }
  };

  const tabLabel = (tab: Tab) => {
    const ar: Record<Tab, string> = { categories: 'التصنيفات', features: 'المميزات', utilities: 'المرافق', guarantees: 'الضمانات' };
    const en: Record<Tab, string> = { categories: 'Categories', features: 'Features', utilities: 'Utilities', guarantees: 'Guarantees' };
    return isRtl ? ar[tab] : en[tab];
  };

  const meta = TAB_META[activeTab];
  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition ${
    theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-600' : 'bg-zinc-50 border-zinc-300 text-zinc-800 placeholder-zinc-400'
  }`;
  const card = `rounded-2xl border ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-zinc-200'}`;

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
              <span className="text-sm">🧩</span>
              <span className="text-[11px] font-bold text-primary tracking-wide uppercase">
                {isRtl ? 'الخصائص الوصفية' : 'Descriptive Properties'}
              </span>
            </div>
            <h1 className={`text-2xl font-black mb-1 ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
              {isRtl ? 'التصنيفات والمميزات والمرافق والضمانات' : 'Categories, Features & Guarantees'}
            </h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {isRtl ? 'إدارة المكونات الوصفية التي تُعرض للمستخدم عند استعراض وفلترة العقارات' : 'Manage descriptive tags shown to users when browsing and filtering properties'}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-5 py-2.5 rounded-xl primary-gradient text-zinc-950 font-bold text-sm hover:opacity-90 transition shadow-md flex items-center gap-2"
          >
            <span>+</span>
            <span>{isRtl ? `إضافة ${tabLabel(activeTab)}` : `Add ${tabLabel(activeTab)}`}</span>
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['categories', 'features', 'utilities', 'guarantees'] as Tab[]).map(tab => {
          const m = TAB_META[tab];
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-2xl border p-4 text-center transition-all duration-200 cursor-pointer group ${
                isActive
                  ? `${m.bg} ${m.border} scale-[1.02] shadow-md`
                  : theme === 'dark'
                  ? 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700'
                  : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <div className={`text-2xl mb-2 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                {m.icon}
              </div>
              <div className={`text-xs font-extrabold ${isActive ? m.color : theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {tabLabel(tab)}
              </div>
              {isActive && (
                <div className={`text-lg font-black mt-1 ${m.color}`}>{items.length}</div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Indicator Bar ── */}
      <div className={`flex gap-1 p-1 rounded-xl border ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
        {(['categories', 'features', 'utilities', 'guarantees'] as Tab[]).map(tab => {
          const m = TAB_META[tab];
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                isActive
                  ? `${m.bg} ${m.color} shadow-sm`
                  : theme === 'dark'
                  ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                  : 'text-zinc-500 hover:text-zinc-700 hover:bg-white'
              }`}
            >
              <span>{m.icon}</span>
              <span className="hidden sm:inline">{tabLabel(tab)}</span>
            </button>
          );
        })}
      </div>

      {/* ── Two-pane Content ── */}
      <div className="flex gap-5">

        {/* Items list */}
        <div className={`flex-1 min-w-0 ${card} overflow-hidden`}>
          {/* Panel header */}
          <div className={`flex items-center justify-between px-5 py-3.5 border-b ${
            theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-1 h-5 rounded-full ${meta.accent}`} />
              <span className={`text-sm font-extrabold ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                {meta.icon} {tabLabel(activeTab)}
              </span>
            </div>
            {loading ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color} ${meta.border} border`}>
                {items.length} {isRtl ? 'عنصر' : 'items'}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Grid of item cards */}
              {items.length > 0 ? (
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map(item => {
                    const isActive = selected?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelected(isActive ? null : item)}
                        className={`group relative rounded-xl border p-4 cursor-pointer transition-all duration-200 ${
                          isActive
                            ? `${meta.bg} ${meta.border} shadow-md scale-[1.01]`
                            : theme === 'dark'
                            ? 'bg-zinc-800/30 border-zinc-700/60 hover:border-zinc-600 hover:bg-zinc-800/50'
                            : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 hover:bg-white hover:shadow-sm'
                        }`}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <div className={`absolute top-0 ${isRtl ? 'right-0' : 'left-0'} w-0.5 h-full ${meta.accent} rounded-full`} />
                        )}
                        <div className="flex items-start justify-between gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 ${
                            isActive ? 'bg-white/60 dark:bg-zinc-900/40' : theme === 'dark' ? 'bg-zinc-800' : 'bg-white'
                          } shadow-sm`}>
                            {meta.icon}
                          </div>
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => openEdit(item)}
                              className={`w-6 h-6 rounded-md flex items-center justify-center text-xs transition cursor-pointer ${
                                theme === 'dark' ? 'hover:bg-zinc-700 text-zinc-500 hover:text-amber-400' : 'hover:bg-zinc-200 text-zinc-400 hover:text-amber-600'
                              }`}
                              title={isRtl ? 'تعديل' : 'Edit'}
                            >✏️</button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className={`w-6 h-6 rounded-md flex items-center justify-center text-xs transition cursor-pointer ${
                                theme === 'dark' ? 'hover:bg-red-950/40 text-zinc-500 hover:text-red-400' : 'hover:bg-red-50 text-zinc-400 hover:text-red-500'
                              }`}
                              title={isRtl ? 'حذف' : 'Delete'}
                            >🗑️</button>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className={`text-sm font-bold leading-tight ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                            {isRtl ? (item.nameAr || item.nameEn) : (item.nameEn || item.nameAr)}
                          </div>
                          {item.nameEn && item.nameAr && (
                            <div className={`text-[10px] mt-0.5 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                              {isRtl ? item.nameEn : item.nameAr}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                    {meta.icon}
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-bold mb-1 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>
                      {isRtl ? `لا توجد ${tabLabel(activeTab)} حتى الآن` : `No ${tabLabel(activeTab)} yet`}
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      {isRtl ? 'اضغط على زر الإضافة أعلاه للبدء' : 'Click the Add button above to get started'}
                    </p>
                  </div>
                  <button
                    onClick={openCreate}
                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition cursor-pointer ${meta.bg} ${meta.color} ${meta.border}`}
                  >
                    + {isRtl ? `إضافة ${tabLabel(activeTab)}` : `Add ${tabLabel(activeTab)}`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Detail Side Panel ── */}
        {selected && (
          <div className={`w-72 shrink-0 ${card} flex flex-col overflow-hidden max-h-[calc(100vh-10rem)] sticky top-24`}>
            {/* Panel header */}
            <div className={`px-5 py-4 border-b shrink-0 ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-5 rounded-full ${meta.accent}`} />
                  <span className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                    {isRtl ? 'تفاصيل العنصر' : 'Item Details'}
                  </span>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer transition ${
                    theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500'
                  }`}
                  aria-label={isRtl ? 'إغلاق' : 'Close'}
                >✕</button>
              </div>
              {/* Icon + name display */}
              <div className={`flex items-center gap-3 p-3 rounded-xl ${meta.bg} border ${meta.border}`}>
                <div className="w-10 h-10 rounded-lg bg-white/60 dark:bg-zinc-900/40 flex items-center justify-center text-xl shadow-sm">
                  {meta.icon}
                </div>
                <div>
                  <div className={`font-extrabold text-sm ${meta.color}`}>
                    {isRtl ? (selected.nameAr || selected.nameEn) : (selected.nameEn || selected.nameAr)}
                  </div>
                  <div className={`text-[10px] mt-0.5 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {tabLabel(activeTab)}
                  </div>
                </div>
              </div>
            </div>

            {/* Detail content */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className={`p-3 rounded-xl border space-y-2 ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                <div>
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                    {isRtl ? 'الاسم (عربي)' : 'Arabic Name'}
                  </span>
                  <span className={`font-bold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`} dir="rtl">
                    {selected.nameAr || <span className="italic text-zinc-500">{isRtl ? 'غير محدد' : 'Not set'}</span>}
                  </span>
                </div>
                <div className={`border-t pt-2 ${theme === 'dark' ? 'border-zinc-700/60' : 'border-zinc-200'}`}>
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                    {isRtl ? 'الاسم (إنجليزي)' : 'English Name'}
                  </span>
                  <span className={`font-bold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`} dir="ltr">
                    {selected.nameEn || <span className="italic text-zinc-500">{isRtl ? 'غير محدد' : 'Not set'}</span>}
                  </span>
                </div>
              </div>

              {/* ID info */}
              <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">ID</span>
                <span className={`font-mono text-[11px] break-all ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{selected.id}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className={`p-4 border-t space-y-2 shrink-0 ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900/60' : 'border-zinc-200 bg-zinc-50'}`}>
              <button
                onClick={() => openEdit(selected)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-2 ${
                  theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700' : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                ✏️ {isRtl ? 'تعديل البيانات' : 'Edit Item'}
              </button>
              <button
                onClick={() => handleDelete(selected.id)}
                className="w-full py-2.5 rounded-xl text-xs font-bold border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 transition cursor-pointer flex items-center justify-center gap-2"
              >
                🗑️ {isRtl ? 'حذف العنصر' : 'Delete Item'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${isRtl ? 'text-right' : 'text-left'} ${
            theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            {/* Modal header with colored accent */}
            <div className={`px-6 py-4 border-b flex items-center justify-between ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-1 h-5 rounded-full ${meta.accent}`} />
                <div>
                  <h3 className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                    {editingItem
                      ? (isRtl ? `تعديل ${tabLabel(activeTab)}` : `Edit ${tabLabel(activeTab)}`)
                      : (isRtl ? `إضافة ${tabLabel(activeTab)} جديد` : `Add New ${tabLabel(activeTab)}`)}
                  </h3>
                  <p className={`text-[10px] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {meta.icon} {tabLabel(activeTab)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer transition ${
                  theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500'
                }`}
                aria-label={isRtl ? 'إغلاق' : 'Close'}
              >✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Arabic name */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">
                  {isRtl ? 'الاسم بالعربي *' : 'Arabic Name *'}
                </label>
                <input
                  required
                  value={form.nameAr}
                  onChange={e => setForm({ ...form, nameAr: e.target.value })}
                  placeholder={isRtl ? 'مثال: تجاري / مسكن عائلي...' : 'e.g. تجاري'}
                  className={inputCls}
                  dir="rtl"
                />
              </div>

              {/* English name */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">
                  {isRtl ? 'الاسم بالإنجليزي' : 'English Name'}
                  <span className={`ms-2 text-[10px] font-normal ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    ({isRtl ? 'اختياري' : 'Optional'})
                  </span>
                </label>
                <input
                  value={form.nameEn}
                  onChange={e => setForm({ ...form, nameEn: e.target.value })}
                  placeholder="e.g. Commercial"
                  className={inputCls}
                  dir="ltr"
                />
              </div>

              {/* Preview chip */}
              {(form.nameAr || form.nameEn) && (
                <div className={`flex items-center gap-2 p-3 rounded-xl border ${meta.bg} ${meta.border}`}>
                  <span className="text-base">{meta.icon}</span>
                  <span className={`text-xs font-bold ${meta.color}`}>
                    {isRtl ? (form.nameAr || form.nameEn) : (form.nameEn || form.nameAr)}
                  </span>
                  <span className={`text-[10px] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    — {isRtl ? 'معاينة' : 'Preview'}
                  </span>
                </div>
              )}

              {/* Footer */}
              <div className={`flex justify-end gap-3 pt-2 -mx-6 -mb-6 px-6 py-4 border-t ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    theme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                  }`}
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl primary-gradient text-zinc-950 font-bold text-xs hover:opacity-90 transition disabled:opacity-60 cursor-pointer flex items-center gap-2"
                >
                  {saving && <span className="w-3.5 h-3.5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />}
                  {isRtl ? 'حفظ' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
