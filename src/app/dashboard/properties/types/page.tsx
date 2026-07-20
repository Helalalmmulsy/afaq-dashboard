'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../../lib/api';
import { useApp } from '../../../../context/AppContext';

export default function PropertyTypesPage() {
  const { lang, theme, showAlert, showConfirm } = useApp();
  const isRtl = lang === 'ar';

  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<any | null>(null);
  const [specForm, setSpecForm] = useState({ nameAr: '', nameEn: '' });
  const [editingSpec, setEditingSpec] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nameAr: '', nameEn: '' });

  async function loadTypes() {
    try {
      const res = await api.get('/properties/types');
      const list = res || [];
      setTypes(list);
      if (selectedType) {
        const updated = list.find((t: any) => t.id === selectedType.id);
        setSelectedType(updated || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTypes(); }, []);

  const openCreate = () => {
    setEditingType(null);
    setForm({ nameAr: '', nameEn: '' });
    setShowModal(true);
  };

  const openEdit = (type: any) => {
    setEditingType(type);
    setForm({ nameAr: type.nameAr || '', nameEn: type.nameEn || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingType) { await api.patch(`/properties/types/${editingType.id}`, form); }
      else { await api.post('/properties/types', form); }
      setShowModal(false);
      loadTypes();
    } catch (err: any) {
      showAlert(err?.message || (isRtl ? 'العملية فشلت.' : 'Operation failed.'), 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!await showConfirm(isRtl ? 'هل أنت متأكد من حذف هذا النوع؟' : 'Are you sure you want to delete this type?')) return;
    try {
      await api.delete(`/properties/types/${id}`);
      if (selectedType?.id === id) setSelectedType(null);
      loadTypes();
    } catch (err: any) {
      showAlert(err?.message || (isRtl ? 'فشل الحذف. قد يكون مرتبطاً بعقارات.' : 'Delete failed. Type may be in use.'), 'error');
    }
  };

  const handleAddSpec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;
    setSaving(true);
    try {
      if (editingSpec) {
        await api.patch(`/properties/types/specs/${editingSpec.id}`, specForm);
        setEditingSpec(null);
      } else {
        await api.post(`/properties/types/${selectedType.id}/specs`, specForm);
      }
      setSpecForm({ nameAr: '', nameEn: '' });
      loadTypes();
    } catch (err: any) {
      showAlert(err?.message || (isRtl ? 'فشل حفظ المواصفة.' : 'Failed to save spec.'), 'error');
    } finally { setSaving(false); }
  };

  const handleEditSpec = (spec: any) => {
    setEditingSpec(spec);
    setSpecForm({ nameAr: spec.nameAr, nameEn: spec.nameEn });
  };

  const handleDeleteSpec = async (specId: string) => {
    if (!await showConfirm(isRtl ? 'هل تريد حذف هذه المواصفة؟' : 'Delete this specification?')) return;
    try {
      await api.delete(`/properties/types/specs/${specId}`);
      loadTypes();
    } catch (err: any) {
      showAlert(err?.message || (isRtl ? 'فشل الحذف.' : 'Delete failed.'), 'error');
    }
  };

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
        <div className="absolute top-0 right-0 w-56 h-28 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-2">
              <span className="text-sm">🏷️</span>
              <span className="text-[11px] font-bold text-primary tracking-wide uppercase">
                {isRtl ? 'أنواع العقارات' : 'Property Types'}
              </span>
            </div>
            <h1 className={`text-2xl font-black mb-1 ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
              {isRtl ? 'إدارة أنواع ومواصفات العقارات' : 'Property Types & Specifications'}
            </h1>
            <p className={`text-sm max-w-xl ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {isRtl
                ? `${types.length} نوع رئيسي — اضغط على أي نوع لإدارة مواصفاته التفصيلية`
                : `${types.length} types — click any type to manage its specifications`}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-5 py-2.5 rounded-xl primary-gradient text-zinc-950 font-bold text-sm hover:opacity-90 transition shadow-md flex items-center gap-2"
          >
            <span>+</span>
            <span>{isRtl ? 'إضافة نوع جديد' : 'Add Type'}</span>
          </button>
        </div>
      </div>

      {/* ── Two-pane grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Types Table (left / col-span-2) ── */}
        <div className={`lg:col-span-2 ${card} overflow-hidden`}>
          {/* Table head */}
          <div className={`flex items-center justify-between px-5 py-3.5 border-b ${
            theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-primary" />
              <span className={`text-sm font-extrabold ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                {isRtl ? 'الأنواع الرئيسية' : 'Main Types'}
              </span>
            </div>
            <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {types.length} {isRtl ? 'نوع' : 'types'}
            </span>
          </div>

          <table className={`w-full border-collapse text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className={`text-[11px] font-bold uppercase tracking-wider border-b ${
                theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 text-zinc-500' : 'bg-zinc-50/80 border-zinc-200 text-zinc-400'
              }`}>
                <th className="px-5 py-3">{isRtl ? 'الاسم' : 'Name'}</th>
                <th className="px-5 py-3">{isRtl ? 'المواصفات' : 'Specifications'}</th>
                <th className="px-5 py-3 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-zinc-800/60' : 'divide-zinc-100'}`}>
              {types.map(type => {
                const isActive = selectedType?.id === type.id;
                return (
                  <tr
                    key={type.id}
                    onClick={() => { setSelectedType(type); setEditingSpec(null); setSpecForm({ nameAr: '', nameEn: '' }); }}
                    className={`cursor-pointer transition-colors duration-150 ${
                      isActive
                        ? theme === 'dark' ? 'bg-primary/8 border-l-2 border-primary' : 'bg-amber-50/70 border-l-2 border-primary'
                        : theme === 'dark' ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-50'
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 ${
                          isActive ? 'bg-primary/20' : theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'
                        }`}>🏷️</div>
                        <div>
                          <div className={`font-bold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                            {isRtl ? (type.nameAr || type.nameEn) : (type.nameEn || type.nameAr)}
                          </div>
                          {type.nameEn && type.nameAr && (
                            <div className={`text-[10px] mt-0.5 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                              {isRtl ? type.nameEn : type.nameAr}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {type.specs?.slice(0, 4).map((spec: any) => (
                          <span key={spec.id} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                            theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                          }`}>
                            {isRtl ? (spec.nameAr || spec.nameEn) : (spec.nameEn || spec.nameAr)}
                          </span>
                        ))}
                        {type.specs?.length > 4 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">
                            +{type.specs.length - 4}
                          </span>
                        )}
                        {(!type.specs || type.specs.length === 0) && (
                          <span className={`text-[11px] italic ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                            {isRtl ? 'لا توجد مواصفات' : 'No specs yet'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(type)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                            theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                          }`}
                          title={isRtl ? 'تعديل الاسم' : 'Rename'}
                        >
                          ✏️ {isRtl ? 'تعديل' : 'Edit'}
                        </button>
                        <button
                          onClick={() => handleDelete(type.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-red-50 dark:bg-red-950/20 text-red-500 border-red-200 dark:border-red-800/40 hover:bg-red-100 dark:hover:bg-red-950/40 transition cursor-pointer"
                          title={isRtl ? 'حذف' : 'Delete'}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {types.length === 0 && (
                <tr>
                  <td colSpan={3} className={`py-12 text-center text-sm italic ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    {isRtl ? 'لا توجد أنواع عقارات حتى الآن.' : 'No property types listed yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Specs Panel (right / col-span-1) ── */}
        <div>
          {selectedType ? (
            <div className={`${card} overflow-hidden flex flex-col sticky top-24 max-h-[calc(100vh-10rem)]`}>
              {/* Panel header */}
              <div className={`px-5 py-4 border-b shrink-0 ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 rounded-full bg-emerald-500" />
                    <span className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                      {isRtl ? 'مواصفات النوع' : 'Type Specifications'}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedType(null)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs cursor-pointer transition ${
                      theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500'
                    }`}
                  >✕</button>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${theme === 'dark' ? 'bg-zinc-800/60' : 'bg-zinc-100'}`}>
                  <span className="text-base">🏷️</span>
                  <span className={`font-bold text-sm ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>
                    {isRtl ? (selectedType.nameAr || selectedType.nameEn) : (selectedType.nameEn || selectedType.nameAr)}
                  </span>
                  <span className={`ms-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    theme === 'dark' ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-200 text-zinc-500'
                  }`}>
                    {selectedType.specs?.length || 0} {isRtl ? 'مواصفة' : 'specs'}
                  </span>
                </div>
              </div>

              {/* Add/Edit spec form */}
              <div className={`px-5 py-4 border-b shrink-0 ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50/60 border-zinc-200'}`}>
                <h4 className={`text-[11px] font-extrabold uppercase tracking-wider mb-3 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {editingSpec ? (isRtl ? '✏️ تعديل المواصفة' : '✏️ Edit Spec') : (isRtl ? '+ إضافة مواصفة' : '+ Add Specification')}
                </h4>
                <form onSubmit={handleAddSpec} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className={`block text-[10px] font-bold uppercase mb-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {isRtl ? 'الاسم (عربي) *' : 'Arabic *'}
                      </label>
                      <input
                        required
                        value={specForm.nameAr}
                        onChange={e => setSpecForm({ ...specForm, nameAr: e.target.value })}
                        placeholder={isRtl ? 'مثال: 3 طوابق' : 'e.g. شقة 3 غرف'}
                        className={`${inputCls} text-xs py-1.5`}
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-bold uppercase mb-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {isRtl ? 'الاسم (إنجليزي)' : 'English'}
                      </label>
                      <input
                        value={specForm.nameEn}
                        onChange={e => setSpecForm({ ...specForm, nameEn: e.target.value })}
                        placeholder="e.g. 3 Floors"
                        className={`${inputCls} text-xs py-1.5`}
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    {editingSpec && (
                      <button type="button" onClick={() => { setEditingSpec(null); setSpecForm({ nameAr: '', nameEn: '' }); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                          theme === 'dark' ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'
                        }`}>
                        {isRtl ? 'إلغاء' : 'Cancel'}
                      </button>
                    )}
                    <button type="submit" disabled={saving}
                      className="px-4 py-1.5 rounded-lg text-xs primary-gradient text-zinc-950 font-bold hover:opacity-90 transition disabled:opacity-60 cursor-pointer flex items-center gap-1.5">
                      {saving && <span className="w-3 h-3 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />}
                      {editingSpec ? (isRtl ? 'حفظ التعديل' : 'Update') : (isRtl ? 'إضافة' : 'Add')}
                    </button>
                  </div>
                </form>
              </div>

              {/* Specs list */}
              <div className="overflow-y-auto flex-1 p-5">
                <h4 className={`text-[11px] font-extrabold uppercase tracking-wider mb-3 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {isRtl ? 'المواصفات المضافة' : 'Added Specifications'}
                </h4>
                <div className={`divide-y ${theme === 'dark' ? 'divide-zinc-800/60' : 'divide-zinc-100'}`}>
                  {selectedType.specs?.map((spec: any) => (
                    <div key={spec.id} className={`py-3 flex items-center justify-between gap-2 ${
                      editingSpec?.id === spec.id ? 'opacity-60' : ''
                    }`}>
                      <div className="min-w-0">
                        <div className={`text-xs font-bold ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>
                          {isRtl ? (spec.nameAr || spec.nameEn) : (spec.nameEn || spec.nameAr)}
                        </div>
                        {spec.nameEn && spec.nameAr && (
                          <div className={`text-[10px] mt-0.5 font-mono ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                            {isRtl ? spec.nameEn : spec.nameAr}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => handleEditSpec(spec)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition cursor-pointer ${
                            theme === 'dark' ? 'hover:bg-zinc-700 text-zinc-400 hover:text-amber-400' : 'hover:bg-zinc-100 text-zinc-400 hover:text-amber-600'
                          }`}
                          title={isRtl ? 'تعديل' : 'Edit'}
                        >✏️</button>
                        <button
                          onClick={() => handleDeleteSpec(spec.id)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition cursor-pointer ${
                            theme === 'dark' ? 'hover:bg-red-950/30 text-zinc-400 hover:text-red-400' : 'hover:bg-red-50 text-zinc-400 hover:text-red-500'
                          }`}
                          title={isRtl ? 'حذف' : 'Delete'}
                        >🗑️</button>
                      </div>
                    </div>
                  ))}
                  {(!selectedType.specs || selectedType.specs.length === 0) && (
                    <div className={`py-8 text-center text-xs italic ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      {isRtl ? 'لا توجد مواصفات بعد. أضف أول مواصفة من الأعلى.' : 'No specs yet. Add the first one above.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Empty state guide */
            <div className={`${card} p-8 flex flex-col items-center justify-center text-center gap-4 min-h-48`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${
                theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'
              }`}>🏷️</div>
              <div>
                <p className={`text-sm font-bold mb-1 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  {isRtl ? 'اختر نوعاً لإدارة مواصفاته' : 'Select a type to manage specs'}
                </p>
                <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  {isRtl ? 'اضغط على أي نوع في الجدول لتظهر هنا أداة إضافة وتعديل وحذف مواصفاته' : 'Click any row in the table to view and manage its specifications here'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Create/Edit Type Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${isRtl ? 'text-right' : 'text-left'} ${
            theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-primary" />
                <h3 className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                  {editingType ? (isRtl ? 'تعديل اسم النوع' : 'Rename Type') : (isRtl ? 'إضافة نوع جديد' : 'Add New Type')}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer transition ${
                theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500'
              }`}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'الاسم بالعربي *' : 'Arabic Name *'}</label>
                  <input required value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} className={inputCls} dir="rtl" placeholder="مثال: شقة سكنية" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'الاسم بالإنجليزي' : 'English Name'}</label>
                  <input value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} className={inputCls} dir="ltr" placeholder="e.g. Apartment" />
                </div>
              </div>
              <div className={`flex justify-end gap-3 pt-2 -mx-6 -mb-6 px-6 py-4 border-t ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
                <button type="button" onClick={() => setShowModal(false)} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${theme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'}`}>
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl primary-gradient text-zinc-950 font-bold text-xs hover:opacity-90 transition disabled:opacity-60 cursor-pointer flex items-center gap-2">
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
