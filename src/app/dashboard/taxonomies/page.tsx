'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useApp } from '../../../context/AppContext';

type TaxonomyGroup =
  | 'ENGINEERING_CONSULTATION'
  | 'CONTRACTING_FIELD'
  | 'TRANSACTION_TYPE'
  | 'SERVICE_TYPE'
  | 'PROPERTY_TYPE';

interface TaxonomyItem {
  id: string;
  group: TaxonomyGroup;
  code: string;
  nameAr: string;
  nameEn: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const GROUPS: {
  key: TaxonomyGroup;
  labelAr: string;
  labelEn: string;
  icon: string;
  descAr: string;
  descEn: string;
  badgeColor: string;
}[] = [
  {
    key: 'ENGINEERING_CONSULTATION',
    labelAr: 'مجال الاستشارة الهندسية',
    labelEn: 'Consultation Fields',
    icon: '💡',
    descAr: 'القائمة المنسدلة لمجالات الاستشارات الهندسية في نماذج الطلبات',
    descEn: 'Consultation fields dropdown options in mobile request forms',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  {
    key: 'CONTRACTING_FIELD',
    labelAr: 'مجال المقاولات المطلوب',
    labelEn: 'Contracting Fields',
    icon: '🧱',
    descAr: 'القائمة المنسدلة لمجالات وأعمال المقاولات الإنشائية والتنفيذية',
    descEn: 'Contracting scope options in mobile request forms',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  {
    key: 'TRANSACTION_TYPE',
    labelAr: 'نوع المعاملة المطلوبة',
    labelEn: 'Transaction Types',
    icon: '🏢',
    descAr: 'القائمة المنسدلة لأنواع المعاملات العقارية (شراء، بيع، إيجار، استثمار)',
    descEn: 'Real estate transaction types (Buy, Rent, Sell, Invest)',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  {
    key: 'SERVICE_TYPE',
    labelAr: 'نوع الخدمة المطلوبة',
    labelEn: 'Service Types',
    icon: '📐',
    descAr: 'القائمة المنسدلة للتصاميم المعمارية والإنشائية والإشراف',
    descEn: 'Service category options (Architectural, Structural, Landscape)',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
  {
    key: 'PROPERTY_TYPE',
    labelAr: 'نوع العقار',
    labelEn: 'Property Types',
    icon: '🏡',
    descAr: 'أنواع العقارات في نماذج الطلبات وفلاتر البحث (فيلا، شقة، عمارة)',
    descEn: 'Property types in request forms and filter chips',
    badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
  },
];

export default function TaxonomiesPage() {
  const { lang, theme, showAlert, showConfirm } = useApp();
  const isRtl = lang === 'ar';

  const [activeTab, setActiveTab] = useState<TaxonomyGroup>('ENGINEERING_CONSULTATION');
  const [items, setItems] = useState<TaxonomyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<TaxonomyItem | null>(null);
  const [form, setForm] = useState({
    group: 'ENGINEERING_CONSULTATION' as TaxonomyGroup,
    code: '',
    nameAr: '',
    nameEn: '',
    description: '',
    sortOrder: 1,
    isActive: true,
  });

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.get(`/taxonomy/all?group=${activeTab}`);
      setItems(res || []);
    } catch (err: any) {
      console.error(err);
      showAlert(isRtl ? 'فشل تحميل بيانات القوائم.' : 'Failed to load options.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const openCreateModal = () => {
    // calculate next sortOrder
    const maxSort = items.reduce((max, it) => Math.max(max, it.sortOrder), 0);
    setEditingItem(null);
    setForm({
      group: activeTab,
      code: '',
      nameAr: '',
      nameEn: '',
      description: '',
      sortOrder: maxSort + 1,
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = (item: TaxonomyItem) => {
    setEditingItem(item);
    setForm({
      group: item.group,
      code: item.code,
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      description: item.description || '',
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameAr.trim() || !form.nameEn.trim()) {
      showAlert(isRtl ? 'يرجى إدخال الاسم بالعربية والإنجليزية.' : 'Please enter Arabic and English names.', 'warning');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        await api.put(`/taxonomy/${editingItem.id}`, {
          nameAr: form.nameAr,
          nameEn: form.nameEn,
          description: form.description,
          sortOrder: Number(form.sortOrder),
          isActive: form.isActive,
        });
        showAlert(isRtl ? 'تم تحديث العنصر بنجاح.' : 'Item updated successfully.', 'success');
      } else {
        await api.post('/taxonomy', {
          group: form.group,
          code: form.code,
          nameAr: form.nameAr,
          nameEn: form.nameEn,
          description: form.description,
          sortOrder: Number(form.sortOrder),
          isActive: form.isActive,
        });
        showAlert(isRtl ? 'تمت إضافة العنصر بنجاح.' : 'Item created successfully.', 'success');
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      showAlert(err?.message || (isRtl ? 'حدث خطأ أثناء الحفظ.' : 'Save failed.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: TaxonomyItem) => {
    try {
      await api.put(`/taxonomy/${item.id}`, { isActive: !item.isActive });
      setItems(items.map((it) => (it.id === item.id ? { ...it, isActive: !it.isActive } : it)));
    } catch (err: any) {
      showAlert(isRtl ? 'فشل تعديل حالة التفعيل.' : 'Failed to update status.', 'error');
    }
  };

  const handleDelete = async (item: TaxonomyItem) => {
    const confirmed = await showConfirm(
      isRtl ? 'حذف العنصر' : 'Delete Option',
      isRtl
        ? `هل أنت متأكد من حذف "${item.nameAr}" من القائمة؟ لن يظهر في التطبيق مستقبلاً.`
        : `Are you sure you want to delete "${item.nameEn}"?`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/taxonomy/${item.id}`);
      showAlert(isRtl ? 'تم الحذف بنجاح.' : 'Deleted successfully.', 'success');
      setItems(items.filter((it) => it.id !== item.id));
    } catch (err: any) {
      showAlert(isRtl ? 'فشل حذف العنصر.' : 'Failed to delete item.', 'error');
    }
  };

  const handleMoveOrder = async (item: TaxonomyItem, direction: 'UP' | 'DOWN') => {
    const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sorted.findIndex((it) => it.id === item.id);
    if (index === -1) return;

    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const targetItem = sorted[targetIndex];
    // swap sortOrder
    const currentOrder = item.sortOrder;
    const targetOrder = targetItem.sortOrder;

    const newCurrentOrder = currentOrder === targetOrder ? (direction === 'UP' ? targetOrder - 1 : targetOrder + 1) : targetOrder;
    const newTargetOrder = currentOrder;

    try {
      // optimistic update
      const updated = sorted.map((it) => {
        if (it.id === item.id) return { ...it, sortOrder: newCurrentOrder };
        if (it.id === targetItem.id) return { ...it, sortOrder: newTargetOrder };
        return it;
      }).sort((a, b) => a.sortOrder - b.sortOrder);

      setItems(updated);

      await api.put('/taxonomy/reorder', {
        items: [
          { id: item.id, sortOrder: newCurrentOrder },
          { id: targetItem.id, sortOrder: newTargetOrder },
        ],
      });
    } catch (err) {
      loadData();
    }
  };

  const currentGroupInfo = GROUPS.find((g) => g.key === activeTab)!;

  const filteredItems = items.filter((it) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      it.nameAr.toLowerCase().includes(q) ||
      it.nameEn.toLowerCase().includes(q) ||
      it.code.toLowerCase().includes(q) ||
      (it.description && it.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className={`space-y-6 ${isRtl ? 'text-right' : 'text-left'}`}>
      {/* ── Top Header ── */}
      <div
        className={`relative rounded-3xl overflow-hidden border p-6 md:p-8 ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800/80 border-zinc-800'
            : 'bg-gradient-to-br from-white via-teal-50/20 to-zinc-50 border-zinc-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📑</span>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {isRtl ? 'إدارة القوائم والتصنيفات في التطبيق' : 'Dynamic Taxonomy & Lists Management'}
              </h1>
            </div>
            <p className={`text-sm max-w-2xl ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {isRtl
                ? 'تحكم كامل في القوائم المنسدلة وخيارات الاختيار المعروضة في تطبيق الهاتف (إضافة، تعديل، حذف، تفعيل، وإعادة ترتيب الظهور).'
                : 'Manage dynamic dropdown choices and selection lists for the mobile app (Add, Edit, Delete, Toggle, and Custom Sort Order).'}
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary text-zinc-950 font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition"
          >
            <span>➕</span>
            <span>{isRtl ? 'إضافة خيار جديد' : 'Add New Option'}</span>
          </button>
        </div>

        {/* ── Tabs Row ── */}
        <div className="flex items-center gap-2 mt-8 overflow-x-auto pb-2 scrollbar-none border-t border-zinc-200 dark:border-zinc-800/80 pt-6">
          {GROUPS.map((g) => {
            const isActive = activeTab === g.key;
            return (
              <button
                key={g.key}
                onClick={() => {
                  setActiveTab(g.key);
                  setSearch('');
                }}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-primary text-zinc-950 shadow-md shadow-primary/20'
                    : theme === 'dark'
                    ? 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800 border border-zinc-700/60'
                    : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                }`}
              >
                <span>{g.icon}</span>
                <span>{isRtl ? g.labelAr : g.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active Group Summary & Search Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold flex items-center gap-2">
            <span>{currentGroupInfo.icon}</span>
            <span>{isRtl ? currentGroupInfo.labelAr : currentGroupInfo.labelEn}</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full border ${currentGroupInfo.badgeColor}`}>
              {items.length} {isRtl ? 'خيارات' : 'options'}
            </span>
          </h2>
          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
            {isRtl ? currentGroupInfo.descAr : currentGroupInfo.descEn}
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isRtl ? 'بحث في خيارات القائمة...' : 'Search options...'}
            className={`w-full px-4 py-2.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary/30 transition ${
              theme === 'dark'
                ? 'bg-zinc-900 border-zinc-800 text-zinc-200 placeholder-zinc-500'
                : 'bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400'
            }`}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute left-3 top-2.5 text-xs text-zinc-400 hover:text-zinc-200"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Options Table / Card List ── */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <div className="w-9 h-9 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-400">{isRtl ? 'جاري تحميل خيارات القائمة...' : 'Loading options...'}</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          className={`rounded-2xl border p-12 text-center flex flex-col items-center justify-center gap-4 ${
            theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <span className="text-4xl">📭</span>
          <div className="space-y-1">
            <h3 className="font-bold text-base">{isRtl ? 'لا توجد خيارات مضافة بعد' : 'No options found'}</h3>
            <p className="text-xs text-zinc-500 max-w-sm">
              {isRtl
                ? 'يمكنك إضافة خيارات جديدة لهذه القائمة لتظهر فوراً للمستخدمين في التطبيق.'
                : 'You can add new options for this dropdown to appear immediately in mobile.'}
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="mt-2 px-4 py-2 rounded-xl bg-primary text-zinc-950 font-bold text-xs"
          >
            {isRtl ? '➕ إضافة خيار أول' : '➕ Add First Option'}
          </button>
        </div>
      ) : (
        <div
          className={`rounded-2xl border overflow-hidden shadow-sm ${
            theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead
                className={`border-b ${
                  theme === 'dark' ? 'bg-zinc-800/40 border-zinc-800 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-500'
                }`}
              >
                <tr>
                  <th className="py-3 px-4 w-28 text-center">{isRtl ? 'ترتيب الظهور' : 'Sort Order'}</th>
                  <th className="py-3 px-4">{isRtl ? 'الاسم (عربي)' : 'Name (Arabic)'}</th>
                  <th className="py-3 px-4">{isRtl ? 'الاسم (إنجليزي)' : 'Name (English)'}</th>
                  <th className="py-3 px-4">{isRtl ? 'الرمز البرمجي' : 'Code'}</th>
                  <th className="py-3 px-4">{isRtl ? 'الوصف' : 'Description'}</th>
                  <th className="py-3 px-4 text-center">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="py-3 px-4 text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 font-medium">
                {filteredItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`transition hover:bg-zinc-500/5 ${!item.isActive ? 'opacity-50' : ''}`}
                  >
                    {/* Sort Order Column */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-extrabold text-sm w-6 text-center">{item.sortOrder}</span>
                        <div className="flex flex-col gap-0.5">
                          <button
                            title={isRtl ? 'تقديم لأعلى' : 'Move up'}
                            disabled={idx === 0}
                            onClick={() => handleMoveOrder(item, 'UP')}
                            className="w-5 h-5 rounded flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 hover:bg-primary hover:text-zinc-950 disabled:opacity-30 disabled:cursor-not-allowed text-[10px]"
                          >
                            ▲
                          </button>
                          <button
                            title={isRtl ? 'تأخير لأسفل' : 'Move down'}
                            disabled={idx === filteredItems.length - 1}
                            onClick={() => handleMoveOrder(item, 'DOWN')}
                            className="w-5 h-5 rounded flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 hover:bg-primary hover:text-zinc-950 disabled:opacity-30 disabled:cursor-not-allowed text-[10px]"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Arabic Name */}
                    <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                      {item.nameAr}
                    </td>

                    {/* English Name */}
                    <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300">
                      {item.nameEn}
                    </td>

                    {/* Code */}
                    <td className="py-3.5 px-4">
                      <code className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono text-zinc-500">
                        {item.code}
                      </code>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400 max-w-xs truncate">
                      {item.description || '-'}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                          item.isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800/60'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-300 dark:border-zinc-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-emerald-500' : 'bg-zinc-400'}`}
                        />
                        {item.isActive ? (isRtl ? 'نشط بالتطبيق' : 'Active') : (isRtl ? 'معطل' : 'Disabled')}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                        >
                          ✏️ {isRtl ? 'تعديل' : 'Edit'}
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 transition"
                        >
                          🗑️ {isRtl ? 'حذف' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 md:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200 ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-4 border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <span>{editingItem ? '✏️' : '➕'}</span>
                <span>
                  {editingItem
                    ? isRtl
                      ? 'تعديل خيار بالقائمة'
                      : 'Edit Option'
                    : isRtl
                    ? 'إضافة خيار جديد للقائمة'
                    : 'Add New Option'}
                </span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Category Group Selector */}
              <div>
                <label className="block font-bold mb-1.5 text-zinc-500">
                  {isRtl ? 'القائمة التابع لها' : 'Target Dropdown Group'}
                </label>
                <select
                  disabled={!!editingItem}
                  value={form.group}
                  onChange={(e) => setForm({ ...form, group: e.target.value as TaxonomyGroup })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                    theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-300'
                  }`}
                >
                  {GROUPS.map((g) => (
                    <option key={g.key} value={g.key}>
                      {g.icon} {isRtl ? g.labelAr : g.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name Ar */}
              <div>
                <label className="block font-bold mb-1.5">
                  {isRtl ? 'الاسم باللغة العربية *' : 'Name in Arabic *'}
                </label>
                <input
                  type="text"
                  required
                  value={form.nameAr}
                  onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                  placeholder={isRtl ? 'مثال: تقييم السلامة الإنشائية' : 'e.g. تقييم السلامة الإنشائية'}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                    theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-300'
                  }`}
                />
              </div>

              {/* Name En */}
              <div>
                <label className="block font-bold mb-1.5">
                  {isRtl ? 'الاسم باللغة الإنجليزية *' : 'Name in English *'}
                </label>
                <input
                  type="text"
                  required
                  value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  placeholder="e.g. Structural Safety Assessment"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                    theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-300'
                  }`}
                />
              </div>

              {/* Code */}
              <div>
                <label className="block font-bold mb-1.5 text-zinc-500">
                  {isRtl ? 'الرمز البرمجي المرجعي (اختياري)' : 'Code Identifier (Optional)'}
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. STRUCT_SAFETY"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                    theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-300'
                  }`}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold mb-1.5 text-zinc-500">
                  {isRtl ? 'الوصف الإيضاحي (اختياري)' : 'Description (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={isRtl ? 'وصف إضافي لطبيعة هذا الخيار ومجال تطبيقه...' : 'Optional description...'}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                    theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-300'
                  }`}
                />
              </div>

              {/* Sort Order & Active */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-bold mb-1.5">
                    {isRtl ? 'ترتيب الظهور في القائمة' : 'Display Sort Order'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                      theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-300'
                    }`}
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2 font-bold select-none">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                    />
                    <span>{isRtl ? 'تفعيل الخيار في التطبيق' : 'Active in Mobile'}</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold transition"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-primary text-zinc-950 font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition disabled:opacity-50"
                >
                  {saving
                    ? isRtl
                      ? 'جاري الحفظ...'
                      : 'Saving...'
                    : editingItem
                    ? isRtl
                      ? 'حفظ التعديلات'
                      : 'Save Changes'
                    : isRtl
                    ? 'إضافة الخيار'
                    : 'Create Option'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
