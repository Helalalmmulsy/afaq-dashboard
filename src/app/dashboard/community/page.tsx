'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useApp } from '../../../context/AppContext';

type Section = 'articles' | 'tips' | 'testimonials' | 'comments';

const SECTION_META: Record<Section, { icon: string; labelAr: string; labelEn: string; color: string; bg: string; border: string; bar: string }> = {
  articles:     { icon: '📰', labelAr: 'المقالات والأخبار',         labelEn: 'Articles & News',     color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-500/10',    border: 'border-blue-200 dark:border-blue-500/20',    bar: 'bg-blue-500' },
  tips:         { icon: '💡', labelAr: 'النصائح الهندسية',           labelEn: 'Engineering Tips',    color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-500/10',  border: 'border-amber-200 dark:border-amber-500/20',  bar: 'bg-amber-500' },
  testimonials: { icon: '⭐', labelAr: 'شهادات العملاء',             labelEn: 'Testimonials',        color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/20', bar: 'bg-purple-500' },
  comments:     { icon: '💬', labelAr: 'مراجعة التعليقات',           labelEn: 'Comment Moderation',  color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', bar: 'bg-emerald-500' },
};

const COMMENT_STATUS: Record<string, { label: string; labelEn: string; cls: string; dot: string }> = {
  APPROVED: { label: 'معتمد',  labelEn: 'Approved', cls: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60', dot: 'bg-emerald-500' },
  PENDING:  { label: 'قيد المراجعة', labelEn: 'Pending',  cls: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',   dot: 'bg-amber-500' },
  REJECTED: { label: 'مرفوض', labelEn: 'Rejected', cls: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/60',                     dot: 'bg-red-500' },
  HIDDEN:   { label: 'مخفي',  labelEn: 'Hidden',   cls: 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',                   dot: 'bg-zinc-400' },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} className={`text-sm ${s <= rating ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-600'}`}>★</span>
      ))}
    </div>
  );
}

export default function CommunityPage() {
  const { lang, theme, showAlert, showConfirm } = useApp();
  const isRtl = lang === 'ar';

  const [activeSection, setActiveSection] = useState<Section>('articles');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const [selected, setSelected] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const [form, setForm] = useState({
    titleAr: '', titleEn: '', contentAr: '', contentEn: '',
    authorName: isRtl ? 'آفاق العرب' : 'Smart Arab Horizons',
    image: '', status: 'PUBLISHED',
    customerNameAr: '', customerNameEn: '',
    jobTitleAr: '', jobTitleEn: '',
    commentAr: '', commentEn: '', rating: 5,
  });

  async function loadData(section: Section = activeSection) {
    setLoading(true);
    setSelected(null);
    try {
      const endpoints: Record<Section, string> = {
        articles: '/content/articles', tips: '/content/tips',
        testimonials: '/content/testimonials', comments: '/content/comments/all',
      };
      const res = await api.get(endpoints[section]);
      setItems(res || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(activeSection); }, [activeSection]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm({ titleAr: '', titleEn: '', contentAr: '', contentEn: '', authorName: isRtl ? 'آفاق العرب' : 'Smart Arab Horizons', image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=800', status: 'PUBLISHED', customerNameAr: '', customerNameEn: '', jobTitleAr: '', jobTitleEn: '', commentAr: '', commentEn: '', rating: 5 });
    setShowModal(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    if (activeSection === 'testimonials') {
      setForm({ titleAr: '', titleEn: '', contentAr: '', contentEn: '', authorName: '', image: item.image || '', status: item.status || 'PUBLISHED', customerNameAr: item.customerNameAr || '', customerNameEn: item.customerNameEn || '', jobTitleAr: item.jobTitleAr || '', jobTitleEn: item.jobTitleEn || '', commentAr: item.commentAr || '', commentEn: item.commentEn || '', rating: item.rating || 5 });
    } else {
      setForm({ titleAr: item.titleAr || '', titleEn: item.titleEn || '', contentAr: item.contentAr || item.descriptionAr || '', contentEn: item.contentEn || item.descriptionEn || '', authorName: item.authorName || (isRtl ? 'آفاق العرب' : 'Smart Arab Horizons'), image: item.image || '', status: item.status || 'PUBLISHED', customerNameAr: '', customerNameEn: '', jobTitleAr: '', jobTitleEn: '', commentAr: '', commentEn: '', rating: 5 });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (activeSection === 'articles') {
        if (editingItem) await api.patch(`/content/articles/${editingItem.id}`, form);
        else await api.post('/content/articles', form);
      } else if (activeSection === 'tips') {
        await api.post('/content/tips', { titleAr: form.titleAr, titleEn: form.titleEn, descriptionAr: form.contentAr, descriptionEn: form.contentEn, image: form.image, status: form.status });
      } else if (activeSection === 'testimonials') {
        const payload = { customerNameAr: form.customerNameAr, customerNameEn: form.customerNameEn, jobTitleAr: form.jobTitleAr, jobTitleEn: form.jobTitleEn, commentAr: form.commentAr, commentEn: form.commentEn, rating: Number(form.rating), image: form.image, status: form.status };
        if (editingItem) await api.patch(`/content/testimonials/${editingItem.id}/moderate`, { status: form.status });
        else await api.post('/content/testimonials', payload);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      showAlert(err?.message || (isRtl ? 'فشلت العملية.' : 'Operation failed.'), 'error');
    } finally { setSaving(false); }
  };

  const handleModerateComment = async (id: string, status: 'APPROVED' | 'REJECTED' | 'HIDDEN') => {
    try {
      await api.patch(`/content/comments/${id}/moderate`, { status });
      if (selected?.id === id) {
        setSelected((prev: any) => ({ ...prev, status }));
      }
      if (selected?.comments) {
        setSelected((prev: any) => ({
          ...prev,
          comments: prev.comments.map((c: any) => c.id === id ? { ...c, status } : c),
        }));
      }
      loadData();
    } catch (err) { showAlert(isRtl ? 'فشل تغيير حالة التعليق.' : 'Failed to moderate comment.', 'error'); }
  };

  const handleDeleteCommentOnPost = async (commentId: string) => {
    if (!await showConfirm(isRtl ? 'حذف التعليق' : 'Delete Comment', isRtl ? 'هل أنت متأكد من حذف هذا التعليق نهائياً؟' : 'Are you sure you want to permanently delete this comment?')) return;
    try {
      await api.delete(`/content/comments/${commentId}`);
      if (selected?.comments) {
        setSelected((prev: any) => ({
          ...prev,
          comments: prev.comments.filter((c: any) => c.id !== commentId),
        }));
      }
      showAlert(isRtl ? 'تم حذف التعليق بنجاح' : 'Comment deleted successfully', 'success');
      loadData();
    } catch (err) { showAlert(isRtl ? 'فشل حذف التعليق.' : 'Failed to delete comment.', 'error'); }
  };

  const handleToggleStatus = async (item: any) => {
    setSaving(true);
    try {
      let nextStatus = '';
      if (activeSection === 'comments') {
        nextStatus = item.status === 'APPROVED' ? 'REJECTED' : 'APPROVED';
        await api.patch(`/content/comments/${item.id}/moderate`, { status: nextStatus });
      } else {
        nextStatus = item.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
        const endpoints: Record<Section, string> = {
          articles: `/content/articles/${item.id}`,
          tips: `/content/tips/${item.id}`,
          testimonials: `/content/testimonials/${item.id}/moderate`,
          comments: '',
        };
        await api.patch(endpoints[activeSection], { status: nextStatus });
      }
      showAlert(isRtl ? 'تم تحديث حالة العنصر بنجاح.' : 'Status updated successfully.', 'success');
      setSelected(null);
      loadData();
    } catch (err: any) {
      showAlert(err?.message || (isRtl ? 'فشل التحديث.' : 'Failed to update status.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!await showConfirm(isRtl ? 'هل أنت متأكد من حذف هذا العنصر نهائياً؟' : 'Are you sure you want to delete this item permanently?')) return;
    setSaving(true);
    try {
      const endpoints: Record<Section, string> = {
        articles: `/content/articles/${itemId}`,
        tips: `/content/tips/${itemId}`,
        testimonials: `/content/testimonials/${itemId}`,
        comments: `/content/comments/${itemId}`,
      };
      await api.delete(endpoints[activeSection]);
      showAlert(isRtl ? 'تم حذف العنصر بنجاح.' : 'Item deleted successfully.', 'success');
      setSelected(null);
      loadData();
    } catch (err: any) {
      showAlert(err?.message || (isRtl ? 'فشل الحذف.' : 'Failed to delete item.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const sm = SECTION_META[activeSection];

  const filtered = items.filter(item => {
    const q = search.toLowerCase();
    if (!q) return true;
    if (activeSection === 'comments') return (item.content || '').toLowerCase().includes(q) || (item.customer?.name || '').toLowerCase().includes(q);
    if (activeSection === 'testimonials') return (item.customerNameAr || '').toLowerCase().includes(q) || (item.commentAr || '').toLowerCase().includes(q);
    return (item.titleAr || '').toLowerCase().includes(q) || (item.titleEn || '').toLowerCase().includes(q);
  });

  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition ${
    theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-600' : 'bg-zinc-50 border-zinc-300 text-zinc-800 placeholder-zinc-400'
  }`;
  const card = `rounded-2xl border ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-zinc-200'}`;

  return (
    <div className={`space-y-6 ${isRtl ? 'text-right' : 'text-left'}`}>

      {/* ── Header ── */}
      <div className={`relative rounded-2xl overflow-hidden border p-6 ${
        theme === 'dark' ? 'bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800/60 border-zinc-800/80' : 'bg-gradient-to-br from-white via-zinc-50 to-purple-50/20 border-zinc-200'
      }`}>
        <div className="absolute top-0 right-0 w-56 h-28 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-2">
              <span className="text-sm">🌐</span>
              <span className="text-[11px] font-bold text-primary tracking-wide uppercase">{isRtl ? 'إدارة المجتمع' : 'Community Management'}</span>
            </div>
            <h1 className={`text-2xl font-black mb-1 ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
              {isRtl ? 'بوابة المحتوى والتفاعلات' : 'Content & Community Console'}
            </h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {isRtl ? 'مقالات · نصائح هندسية · شهادات العملاء · مراجعة التعليقات' : 'Articles · Tips · Testimonials · Comment Moderation'}
            </p>
          </div>
          {activeSection !== 'comments' && (
            <button onClick={handleOpenCreate} className="px-5 py-2.5 rounded-xl primary-gradient text-zinc-950 font-bold text-sm hover:opacity-90 transition shadow-md flex items-center gap-2">
              <span>+</span>
              <span>{isRtl ? 'إضافة منشور' : 'Create Post'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Section Tabs ── */}
      <div className={`${card} p-1.5 flex gap-1 overflow-x-auto`}>
        {(['articles', 'tips', 'testimonials', 'comments'] as Section[]).map(sec => {
          const m = SECTION_META[sec];
          const isActive = activeSection === sec;
          return (
            <button key={sec} onClick={() => setActiveSection(sec)}
              className={`flex-1 min-w-max flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                isActive ? `${m.bg} ${m.border} border ${m.color} shadow-sm` : theme === 'dark' ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'
              }`}>
              <span>{m.icon}</span>
              <span>{isRtl ? m.labelAr : m.labelEn}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${isActive ? m.color + ' bg-white/30 dark:bg-black/20' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'}`}>
                {items.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search + count ── */}
      <div className={`${card} px-5 py-3.5 flex items-center gap-3 flex-wrap`}>
        <div className={`w-1 h-5 rounded-full ${sm.bar}`} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={isRtl ? 'بحث...' : 'Search...'} className={`${inputCls} max-w-xs`} />
        {loading && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
        <span className={`ms-auto text-xs font-semibold ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{filtered.length} {isRtl ? 'عنصر' : 'items'}</span>
      </div>

      {/* ── Two-pane: Table + Side Panel ── */}
      {loading ? (
        <div className="min-h-[30vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-9 h-9 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{isRtl ? 'جاري التحميل...' : 'Loading...'}</p>
          </div>
        </div>
      ) : (
        <div className="flex gap-5">

          {/* Table */}
          <div className={`flex-1 min-w-0 ${card} overflow-hidden`}>
            <div className={`flex items-center justify-between px-5 py-3.5 border-b ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-1 h-5 rounded-full ${sm.bar}`} />
                <span className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                  {sm.icon} {isRtl ? sm.labelAr : sm.labelEn}
                </span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${sm.bg} ${sm.color} ${sm.border}`}>
                {filtered.length} {isRtl ? 'عنصر' : 'items'}
              </span>
            </div>

            {/* Comments Table */}
            {activeSection === 'comments' ? (
              <table className={`w-full border-collapse text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
                <thead>
                  <tr className={`text-[11px] font-bold uppercase tracking-wider border-b ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 text-zinc-500' : 'bg-zinc-50/80 border-zinc-200 text-zinc-400'}`}>
                    <th className="px-5 py-3">{isRtl ? 'المستخدم / التعليق' : 'User / Comment'}</th>
                    <th className="px-5 py-3 hidden md:table-cell">{isRtl ? 'المنشور المرتبط' : 'Linked To'}</th>
                    <th className="px-5 py-3">{isRtl ? 'الحالة' : 'Status'}</th>
                    <th className="px-5 py-3 text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-zinc-800/60' : 'divide-zinc-100'}`}>
                  {filtered.map(comment => {
                    const csm = COMMENT_STATUS[comment.status] ?? COMMENT_STATUS['PENDING'];
                    const isActive = selected?.id === comment.id;
                    return (
                      <tr key={comment.id} onClick={() => setSelected(isActive ? null : comment)}
                        className={`cursor-pointer transition-colors duration-150 ${isActive ? theme === 'dark' ? 'bg-emerald-950/20 border-l-2 border-emerald-500' : 'bg-emerald-50/40 border-l-2 border-emerald-500' : theme === 'dark' ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-50'}`}>
                        <td className="px-5 py-3.5">
                          <div className={`font-bold text-xs ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>{comment.customer?.name || '—'}</div>
                          <div className={`text-[10px] mt-0.5 line-clamp-2 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{comment.content}</div>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <div className={`text-xs font-bold line-clamp-1 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                            {comment.article?.titleAr || comment.news?.titleAr || comment.portfolioProject?.titleAr || (comment.articleId ? (isRtl ? 'مقالة هندسية' : 'Article') : (isRtl ? 'خبر عام' : 'News'))}
                          </div>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-500'}`}>
                            {comment.articleId ? (isRtl ? 'مقالة' : 'Article') : comment.newsId ? (isRtl ? 'خبر' : 'News') : (isRtl ? 'معرض أعمال' : 'Portfolio')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${csm.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${csm.dot}`} />
                            {isRtl ? csm.label : csm.labelEn}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex gap-1.5 justify-center flex-wrap" onClick={e => e.stopPropagation()}>
                            {comment.status !== 'APPROVED' && (
                              <button onClick={() => handleModerateComment(comment.id, 'APPROVED')} className="px-2 py-1 text-[10px] font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition cursor-pointer">
                                ✅ {isRtl ? 'تنشيط' : 'Approve'}
                              </button>
                            )}
                            {comment.status !== 'REJECTED' && (
                              <button onClick={() => handleModerateComment(comment.id, 'REJECTED')} className="px-2 py-1 text-[10px] font-bold rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50 hover:bg-orange-100 dark:hover:bg-orange-950/60 transition cursor-pointer">
                                🛑 {isRtl ? 'إيقاف' : 'Reject'}
                              </button>
                            )}
                            <button onClick={() => handleDeleteItem(comment.id)} className="px-2 py-1 text-[10px] font-bold rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-950/60 transition cursor-pointer">
                              🗑️ {isRtl ? 'حذف' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={4} className={`py-14 text-center text-sm italic ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      {isRtl ? 'لا توجد تعليقات للمراجعة.' : 'No comments to moderate.'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            ) : (
              /* Articles / Tips / Testimonials table */
              <table className={`w-full border-collapse text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
                <thead>
                  <tr className={`text-[11px] font-bold uppercase tracking-wider border-b ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 text-zinc-500' : 'bg-zinc-50/80 border-zinc-200 text-zinc-400'}`}>
                    <th className="px-5 py-3">{isRtl ? 'المنشور / المحتوى' : 'Post / Content'}</th>
                    <th className="px-5 py-3 hidden md:table-cell">{isRtl ? 'الملخص' : 'Summary'}</th>
                    {activeSection !== 'testimonials' && (
                      <th className="px-5 py-3 text-center">{isRtl ? 'الإعجابات والتعليقات' : 'Engagement'}</th>
                    )}
                    <th className="px-5 py-3">{isRtl ? 'الحالة' : 'Status'}</th>
                    <th className="px-5 py-3 hidden lg:table-cell">{isRtl ? 'التاريخ' : 'Date'}</th>
                    <th className="px-5 py-3 text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-zinc-800/60' : 'divide-zinc-100'}`}>
                  {filtered.map(item => {
                    const isActive = selected?.id === item.id;
                    const title = activeSection === 'testimonials'
                      ? (isRtl ? item.customerNameAr : item.customerNameEn)
                      : (isRtl ? item.titleAr : item.titleEn);
                    const subtitle = activeSection === 'testimonials'
                      ? (isRtl ? item.jobTitleAr : item.jobTitleEn)
                      : (isRtl ? item.authorName : item.authorName);
                    const statusMeta = { PUBLISHED: { label: 'نشط', labelEn: 'Published', cls: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60', dot: 'bg-emerald-500' }, DRAFT: { label: 'مسودة', labelEn: 'Draft', cls: 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700', dot: 'bg-zinc-400' } };
                    const sm2 = statusMeta[item.status as 'PUBLISHED' | 'DRAFT'] ?? statusMeta['DRAFT'];
                    return (
                      <tr key={item.id} onClick={() => setSelected(isActive ? null : item)}
                        className={`cursor-pointer transition-colors duration-150 ${isActive ? theme === 'dark' ? `bg-primary/8 border-l-2 border-primary` : 'bg-amber-50/60 border-l-2 border-primary' : theme === 'dark' ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-50'}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {item.image ? (
                              <img src={item.image} alt="" className="w-10 h-10 object-cover rounded-lg shrink-0 border border-zinc-200 dark:border-zinc-700" />
                            ) : (
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                                {SECTION_META[activeSection].icon}
                              </div>
                            )}
                            <div>
                              <div className={`font-bold text-xs leading-tight ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>{title || '—'}</div>
                              {subtitle && <div className={`text-[10px] mt-0.5 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{subtitle}</div>}
                              {activeSection === 'testimonials' && <StarRating rating={item.rating || 0} />}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell max-w-xs">
                          <p className={`text-[10px] line-clamp-2 leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            {activeSection === 'testimonials'
                              ? (isRtl ? item.commentAr : item.commentEn)
                              : (isRtl ? item.contentAr || item.descriptionAr : item.contentEn || item.descriptionEn)}
                          </p>
                        </td>
                        {activeSection !== 'testimonials' && (
                          <td className="px-5 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${theme === 'dark' ? 'bg-red-950/20 text-red-400 border-red-800/40' : 'bg-red-50 text-red-600 border-red-200'}`} title={isRtl ? 'الإعجابات' : 'Likes'}>
                                ❤️ {item.likes?.length ?? item.totalLikes ?? 0}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${theme === 'dark' ? 'bg-blue-950/20 text-blue-400 border-blue-800/40' : 'bg-blue-50 text-blue-600 border-blue-200'}`} title={isRtl ? 'التعليقات' : 'Comments'}>
                                💬 {item.comments?.length ?? 0}
                              </span>
                            </div>
                          </td>
                        )}
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${sm2.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sm2.dot}`} />
                            {isRtl ? sm2.label : sm2.labelEn}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <span className={`text-[10px] font-mono ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1.5 justify-center flex-wrap">
                            <button onClick={() => handleOpenEdit(item)} className="px-2 py-1 text-[10px] font-bold rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-250 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer">
                              ✏️ {isRtl ? 'تعديل' : 'Edit'}
                            </button>
                            <button onClick={() => handleToggleStatus(item)} className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition cursor-pointer ${
                              item.status === 'PUBLISHED'
                                ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-250 dark:border-amber-900/30 hover:bg-amber-100'
                                : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900/30 hover:bg-emerald-100'
                            }`}>
                              {item.status === 'PUBLISHED' ? (isRtl ? '🛑 إيقاف' : 'Suspend') : (isRtl ? '✅ تنشيط' : 'Activate')}
                            </button>
                            <button onClick={() => handleDeleteItem(item.id)} className="px-2 py-1 text-[10px] font-bold rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-950/60 transition cursor-pointer">
                              🗑️ {isRtl ? 'حذف' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className={`py-14 text-center text-sm italic ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      {isRtl ? 'لا توجد منشورات في هذا القسم.' : 'No posts in this section.'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Detail Side Panel ── */}
          {selected && (
            <div className={`w-72 xl:w-80 shrink-0 ${card} flex flex-col overflow-hidden max-h-[calc(100vh-10rem)] sticky top-24`}>
              <div className={`px-5 py-4 border-b shrink-0 ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-1 h-5 rounded-full ${sm.bar}`} />
                    <span className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>{isRtl ? 'التفاصيل' : 'Details'}</span>
                  </div>
                  <button onClick={() => setSelected(null)} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer transition ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500'}`} aria-label={isRtl ? 'إغلاق' : 'Close'}>✕</button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1">
                {/* Cover image */}
                {selected.image && (
                  <div className="w-full h-36 overflow-hidden">
                    <img src={selected.image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="p-5 space-y-3">
                  {/* Comments section */}
                  {activeSection === 'comments' ? (
                    <>
                      <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                        <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isRtl ? 'صاحب التعليق' : 'Commenter'}</span>
                        <span className={`font-bold text-sm ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>{selected.customer?.name || '—'}</span>
                        {selected.customer?.email && <div className={`text-[10px] font-mono mt-0.5 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{selected.customer.email}</div>}
                      </div>
                      <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                        <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isRtl ? 'نص التعليق' : 'Comment'}</span>
                        <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{selected.content}</p>
                      </div>
                      <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                        <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isRtl ? 'الحالة الحالية' : 'Status'}</span>
                        {(() => { const csm = COMMENT_STATUS[selected.status] ?? COMMENT_STATUS['PENDING']; return (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${csm.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${csm.dot}`} /> {isRtl ? csm.label : csm.labelEn}
                          </span>
                        ); })()}
                      </div>
                    </>
                  ) : activeSection === 'testimonials' ? (
                    <>
                      <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-purple-950/20 border-purple-800/40' : 'bg-purple-50 border-purple-200'}`}>
                        <div className={`font-extrabold text-sm mb-0.5 ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>{isRtl ? selected.customerNameAr : selected.customerNameEn}</div>
                        <div className={`text-[10px] mb-2 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{isRtl ? selected.jobTitleAr : selected.jobTitleEn}</div>
                        <StarRating rating={selected.rating || 0} />
                      </div>
                      <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                        <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isRtl ? 'الشهادة' : 'Testimonial'}</span>
                        <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{isRtl ? selected.commentAr : selected.commentEn}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                        <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isRtl ? 'العنوان' : 'Title'}</span>
                        <div className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>{isRtl ? selected.titleAr : selected.titleEn}</div>
                        {selected.titleEn && selected.titleAr && (
                          <div className={`text-[10px] mt-0.5 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{isRtl ? selected.titleEn : selected.titleAr}</div>
                        )}
                      </div>
                      <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                        <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isRtl ? 'المحتوى' : 'Content'}</span>
                        <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{isRtl ? (selected.contentAr || selected.descriptionAr) : (selected.contentEn || selected.descriptionEn)}</p>
                      </div>
                      {selected.authorName && (
                        <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                          <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isRtl ? 'الكاتب' : 'Author'}</span>
                          <span className={`text-xs font-bold ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>{selected.authorName}</span>
                        </div>
                      )}

                      {/* Engagement stats (Likes & Comments) */}
                      <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                        <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-2">{isRtl ? 'التفاعل والإحصائيات' : 'Engagement Metrics'}</span>
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div className={`p-2 rounded-lg border ${theme === 'dark' ? 'bg-red-950/20 border-red-800/40 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
                            <span className="text-base font-black">❤️ {selected.likes?.length ?? selected.totalLikes ?? 0}</span>
                            <span className="block text-[10px] font-bold mt-0.5">{isRtl ? 'إعجاب' : 'Likes'}</span>
                          </div>
                          <div className={`p-2 rounded-lg border ${theme === 'dark' ? 'bg-blue-950/20 border-blue-800/40 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                            <span className="text-base font-black">💬 {selected.comments?.length ?? 0}</span>
                            <span className="block text-[10px] font-bold mt-0.5">{isRtl ? 'تعليق' : 'Comments'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Comments on this Post */}
                      <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'} space-y-2.5`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase">{isRtl ? 'التعليقات على هذا المنشور' : 'Comments on this Post'}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                            {selected.comments?.length ?? 0}
                          </span>
                        </div>

                        {selected.comments && selected.comments.length > 0 ? (
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {selected.comments.map((c: any) => {
                              const csm = COMMENT_STATUS[c.status] ?? COMMENT_STATUS['PENDING'];
                              return (
                                <div key={c.id} className={`p-2.5 rounded-lg border text-xs space-y-1.5 ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-2xs'}`}>
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-extrabold text-[11px] truncate">{c.customer?.name || (isRtl ? 'مستخدم' : 'User')}</span>
                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold border shrink-0 ${csm.cls}`}>
                                      <span className={`w-1 h-1 rounded-full ${csm.dot}`} />
                                      {isRtl ? csm.label : csm.labelEn}
                                    </span>
                                  </div>
                                  <p className={`text-[11px] leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-650'}`}>{c.content}</p>
                                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/30 text-[9px]">
                                    <span className="text-zinc-500 font-mono">{new Date(c.createdAt).toLocaleDateString()}</span>
                                    <div className="flex items-center gap-1.5">
                                      {c.status !== 'APPROVED' && (
                                        <button 
                                          type="button" 
                                          onClick={() => handleModerateComment(c.id, 'APPROVED')} 
                                          className="text-emerald-500 hover:underline font-bold cursor-pointer"
                                        >
                                          {isRtl ? 'اعتماد' : 'Approve'}
                                        </button>
                                      )}
                                      {c.status !== 'REJECTED' && (
                                        <button 
                                          type="button" 
                                          onClick={() => handleModerateComment(c.id, 'REJECTED')} 
                                          className="text-orange-500 hover:underline font-bold cursor-pointer"
                                        >
                                          {isRtl ? 'إيقاف' : 'Reject'}
                                        </button>
                                      )}
                                      <button 
                                        type="button" 
                                        onClick={() => handleDeleteCommentOnPost(c.id)} 
                                        className="text-red-500 hover:underline font-bold cursor-pointer"
                                      >
                                        {isRtl ? 'حذف' : 'Delete'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-[11px] text-zinc-500 italic py-2 text-center">
                            {isRtl ? 'لا توجد تعليقات على هذا المنشور حتى الآن.' : 'No comments on this post yet.'}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                    <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isRtl ? 'تاريخ النشر' : 'Published'}</span>
                    <span className={`text-xs font-mono ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{new Date(selected.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className={`p-4 border-t shrink-0 space-y-2 ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900/60' : 'border-zinc-200 bg-zinc-50'}`}>
                {activeSection !== 'comments' && (
                  <button onClick={() => handleOpenEdit(selected)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700' : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100'}`}>
                    ✏️ {isRtl ? 'تعديل المنشور' : 'Edit Post'}
                  </button>
                )}

                {/* Suspend / Activate Toggle */}
                {activeSection === 'comments' ? (
                  <>
                    {selected.status !== 'APPROVED' && (
                      <button onClick={() => { handleModerateComment(selected.id, 'APPROVED'); setSelected(null); }}
                        className="w-full py-2.5 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 transition cursor-pointer flex items-center justify-center gap-2">
                        ✅ {isRtl ? 'تنشيط واعتماد' : 'Approve Comment'}
                      </button>
                    )}
                    {selected.status !== 'REJECTED' && (
                      <button onClick={() => { handleModerateComment(selected.id, 'REJECTED'); setSelected(null); }}
                        className="w-full py-2.5 rounded-xl text-xs font-bold border border-orange-200 dark:border-orange-850/50 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950/40 transition cursor-pointer flex items-center justify-center gap-2">
                        🛑 {isRtl ? 'إيقاف وتعطيل' : 'Suspend Comment'}
                      </button>
                    )}
                  </>
                ) : (
                  <button onClick={() => handleToggleStatus(selected)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-2 ${
                      selected.status === 'PUBLISHED'
                        ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30 hover:bg-amber-100'
                        : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30 hover:bg-emerald-100'
                    }`}>
                    {selected.status === 'PUBLISHED'
                      ? <>🛑 {isRtl ? 'إيقاف وتعطيل المنشور' : 'Suspend / Draft'}</>
                      : <>✅ {isRtl ? 'تنشيط ونشر المنشور' : 'Activate / Publish'}</>
                    }
                  </button>
                )}

                {/* Delete Button */}
                <button onClick={() => handleDeleteItem(selected.id)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 transition cursor-pointer flex items-center justify-center gap-2">
                  🗑️ {isRtl ? 'حذف العنصر نهائياً' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col ${isRtl ? 'text-right' : 'text-left'} ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-1 h-5 rounded-full ${SECTION_META[activeSection].bar}`} />
                <div>
                  <h3 className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                    {editingItem ? (isRtl ? 'تعديل المنشور' : 'Edit Post') : (isRtl ? 'إضافة منشور جديد' : 'Create New Post')}
                  </h3>
                  <p className={`text-[10px] ${SECTION_META[activeSection].color}`}>{isRtl ? sm.labelAr : sm.labelEn}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer transition ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500'}`} aria-label={isRtl ? 'إغلاق' : 'Close'}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Testimonial Form */}
              {activeSection === 'testimonials' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'اسم العميل (عربي) *' : 'Customer Name (AR) *'}</label><input required value={form.customerNameAr} onChange={e => setForm({ ...form, customerNameAr: e.target.value })} className={inputCls} dir="rtl" /></div>
                    <div><label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'اسم العميل (إنجليزي)' : 'Customer Name (EN)'}</label><input value={form.customerNameEn} onChange={e => setForm({ ...form, customerNameEn: e.target.value })} className={inputCls} dir="ltr" placeholder="Optional" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'المسمى الوظيفي (عربي)' : 'Job Title (AR)'}</label><input value={form.jobTitleAr} onChange={e => setForm({ ...form, jobTitleAr: e.target.value })} className={inputCls} dir="rtl" /></div>
                    <div><label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'المسمى الوظيفي (إنجليزي)' : 'Job Title (EN)'}</label><input value={form.jobTitleEn} onChange={e => setForm({ ...form, jobTitleEn: e.target.value })} className={inputCls} dir="ltr" placeholder="Optional" /></div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'التقييم (1-5) *' : 'Rating (1-5) *'}</label>
                      <input type="number" min="1" max="5" required value={form.rating} onChange={e => setForm({ ...form, rating: Number(e.target.value) })} className={inputCls} />
                      <div className="mt-1"><StarRating rating={form.rating} /></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'الشهادة (عربي) *' : 'Testimonial (AR) *'}</label><textarea required rows={4} value={form.commentAr} onChange={e => setForm({ ...form, commentAr: e.target.value })} className={inputCls} dir="rtl" /></div>
                    <div><label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'الشهادة (إنجليزي)' : 'Testimonial (EN)'}</label><textarea rows={4} value={form.commentEn} onChange={e => setForm({ ...form, commentEn: e.target.value })} className={inputCls} dir="ltr" placeholder="Optional" /></div>
                  </div>
                </>
              ) : (
                /* Article / Tip Form */
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'العنوان (عربي) *' : 'Title (AR) *'}</label><input required value={form.titleAr} onChange={e => setForm({ ...form, titleAr: e.target.value })} className={inputCls} dir="rtl" /></div>
                    <div><label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'العنوان (إنجليزي)' : 'Title (EN)'}</label><input value={form.titleEn} onChange={e => setForm({ ...form, titleEn: e.target.value })} className={inputCls} dir="ltr" placeholder="Optional" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'المحتوى (عربي) *' : 'Content (AR) *'}</label><textarea required rows={5} value={form.contentAr} onChange={e => setForm({ ...form, contentAr: e.target.value })} className={inputCls} dir="rtl" /></div>
                    <div><label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'المحتوى (إنجليزي)' : 'Content (EN)'}</label><textarea rows={5} value={form.contentEn} onChange={e => setForm({ ...form, contentEn: e.target.value })} className={inputCls} dir="ltr" placeholder="Optional" /></div>
                  </div>
                </>
              )}

              {/* Image + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'رابط صورة الغلاف' : 'Cover Image URL'}</label><input type="url" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} className={inputCls} dir="ltr" placeholder="https://..." /></div>
                <div><label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'حالة النشر' : 'Status'}</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls}>
                    <option value="PUBLISHED">{isRtl ? 'منشور' : 'Published'}</option>
                    <option value="DRAFT">{isRtl ? 'مسودة' : 'Draft'}</option>
                  </select>
                </div>
              </div>

              {/* Image preview */}
              {form.image && (
                <div className="rounded-xl overflow-hidden h-24 border border-zinc-200 dark:border-zinc-700">
                  <img src={form.image} alt="preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                </div>
              )}

              <div className={`flex justify-end gap-3 -mx-6 -mb-6 px-6 py-4 border-t ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
                <button type="button" onClick={() => setShowModal(false)} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${theme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'}`}>
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl primary-gradient text-zinc-950 font-bold text-xs hover:opacity-90 transition disabled:opacity-60 cursor-pointer flex items-center gap-2">
                  {saving && <span className="w-3.5 h-3.5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />}
                  {isRtl ? 'حفظ المنشور' : 'Save Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
