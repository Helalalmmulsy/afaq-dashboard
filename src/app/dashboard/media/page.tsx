'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../../lib/api';
import { useApp } from '../../../context/AppContext';

interface MediaFile {
  id: string;
  fileName: string;
  originalName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: string;
  altText?: string | null;
  createdAt: string;
  uploader?: { id: string; name: string; email: string } | null;
}

interface MediaStats {
  totalFiles: number;
  totalBytes: number;
  imagesCount: number;
  documentsCount: number;
  categoryCounts: Record<string, number>;
}

const CATEGORIES = [
  { key: 'ALL', labelAr: 'الكل', labelEn: 'All', icon: '🌐' },
  { key: 'PROPERTIES', labelAr: 'العقارات', labelEn: 'Properties', icon: '🏢' },
  { key: 'PROJECTS', labelAr: 'المشاريع الهندسية', labelEn: 'Portfolio Projects', icon: '🏛️' },
  { key: 'OPERATIONAL_PROJECTS', labelAr: 'المشاريع التشغيلية', labelEn: 'Work Projects', icon: '⚙️' },
  { key: 'REQUESTS', labelAr: 'طلبات العملاء', labelEn: 'Customer Requests', icon: '📝' },
  { key: 'ARTICLES', labelAr: 'المقالات والأخبار', labelEn: 'News & Articles', icon: '📰' },
  { key: 'SERVICES', labelAr: 'دليل الخدمات', labelEn: 'Services', icon: '🏗️' },
  { key: 'PROFILES', labelAr: 'المهندسون والفرق', labelEn: 'Engineers & Profiles', icon: '👥' },
  { key: 'BRANDING', labelAr: 'هوية المكتب', labelEn: 'Brand Identity', icon: '✨' },
  { key: 'GENERAL', labelAr: 'ملفات عامة', labelEn: 'General Media', icon: '📁' },
];

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function MediaLibraryPage() {
  const { lang, theme, showAlert, showConfirm } = useApp();
  const isDark = theme === 'dark';
  const isRtl = lang === 'ar';

  const [mediaList, setMediaList] = useState<MediaFile[]>([]);
  const [stats, setStats] = useState<MediaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [fileTypeFilter, setFileTypeFilter] = useState<'all' | 'image' | 'document'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('GENERAL');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [previewItem, setPreviewItem] = useState<MediaFile | null>(null);
  const [editingItem, setEditingItem] = useState<MediaFile | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [editAltText, setEditAltText] = useState('');
  const [showR2Guide, setShowR2Guide] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchMedia();
    fetchStats();
  }, [selectedCategory, fileTypeFilter, searchQuery]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (fileTypeFilter !== 'all') params.append('fileType', fileTypeFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('take', '60');

      const res = await api.get(`/media?${params.toString()}`);
      setMediaList(res.items || []);
    } catch (err: any) {
      console.error(err);
      showAlert(isRtl ? 'تعذّر تحميل الوسائط' : 'Failed to load media', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/media/stats');
      setStats(res);
    } catch (_) {}
  };

  // Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      for (const file of selectedFiles) {
        formData.append('files', file);
      }
      formData.append('category', uploadCategory);

      const res = await api.upload('/media/upload', formData);

      showAlert(
        isRtl
          ? `تم رفع ${res.count || selectedFiles.length} ملف بنجاح!`
          : `Successfully uploaded ${res.count || selectedFiles.length} files!`,
        'success',
      );

      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchMedia();
      fetchStats();
    } catch (err: any) {
      showAlert(err.message || (isRtl ? 'فشل الرفع' : 'Upload failed'), 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Copy Link Handler
  const handleCopyLink = (file: MediaFile) => {
    navigator.clipboard.writeText(file.fileUrl);
    setCopiedId(file.id);
    showAlert(isRtl ? 'تم نسخ الرابط المباشر إلى الحافظة' : 'Direct URL copied to clipboard', 'success');
    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  // Delete Handler
  const handleDelete = async (file: MediaFile) => {
    const confirmed = await showConfirm(
      isRtl
        ? `هل أنت متأكد من حذف الملف "${file.originalName}" نهائياً من التخزين؟`
        : `Are you sure you want to permanently delete "${file.originalName}"?`,
      isRtl ? 'تأكيد الحذف' : 'Confirm Delete',
    );
    if (!confirmed) return;

    try {
      await api.delete(`/media/${file.id}`);
      showAlert(isRtl ? 'تم حذف الملف بنجاح' : 'File deleted successfully', 'success');
      if (previewItem?.id === file.id) setPreviewItem(null);
      fetchMedia();
      fetchStats();
    } catch (err: any) {
      showAlert(err.message || (isRtl ? 'تعذّر حذف الملف' : 'Failed to delete file'), 'error');
    }
  };

  // Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      await api.patch(`/media/${editingItem.id}`, {
        category: editCategory,
        altText: editAltText,
      });
      showAlert(isRtl ? 'تم تحديث بيانات الملف' : 'File details updated', 'success');
      setEditingItem(null);
      fetchMedia();
    } catch (err: any) {
      showAlert(err.message || (isRtl ? 'فشل التحديث' : 'Update failed'), 'error');
    }
  };

  const isImageFile = (type: string, name: string) => {
    if (type?.startsWith('image/')) return true;
    const ext = name.toLowerCase();
    return ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.webp') || ext.endsWith('.svg') || ext.endsWith('.gif');
  };

  return (
    <div className={`p-4 md:p-6 space-y-6 ${isRtl ? 'rtl' : 'ltr'}`}>
      {/* ── Page Header & Top Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2.5">
            <span className="text-2xl">🖼️</span>
            <span>{isRtl ? 'معرض الوسائط وإدارة الملفات' : 'Media Gallery & Storage'}</span>
          </h1>
          <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {isRtl
              ? 'تخزين وإدارة صور العقارات، المخططات الهندسية، وثائق المشاريع، وأصول الهوية المعتمدة.'
              : 'Upload, organize, and copy direct URLs for properties, engineering blueprints, contracts, and brand assets.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowR2Guide(true)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 transition"
          >
            <span>☁️</span>
            <span>{isRtl ? 'تكامل Cloudflare R2' : 'Cloudflare R2 Setup'}</span>
          </button>
        </div>
      </div>

      {/* ── Statistics Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{isRtl ? 'إجمالي الملفات' : 'Total Files'}</span>
            <span className="text-base">📁</span>
          </div>
          <div className="text-xl font-bold mt-2 text-primary">{stats?.totalFiles ?? '...'}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">{isRtl ? 'ملف مسجل بالمنظومة' : 'Files indexed'}</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{isRtl ? 'السعة التخزينية' : 'Storage Used'}</span>
            <span className="text-base">💾</span>
          </div>
          <div className="text-xl font-bold mt-2 text-emerald-500">
            {stats ? formatBytes(stats.totalBytes) : '...'}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">{isRtl ? 'مساحة فعلية مستهلكة' : 'Actual storage size'}</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{isRtl ? 'الصور الفوتوغرافية' : 'Images'}</span>
            <span className="text-base">📸</span>
          </div>
          <div className="text-xl font-bold mt-2 text-sky-500">{stats?.imagesCount ?? '...'}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">JPG, PNG, WEBP, SVG</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{isRtl ? 'المستندات والمخططات' : 'Docs & CAD'}</span>
            <span className="text-base">📐</span>
          </div>
          <div className="text-xl font-bold mt-2 text-purple-500">{stats?.documentsCount ?? '...'}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">PDF, DWG, DXF, DOCX</div>
        </div>
      </div>

      {/* ── Smart Upload Area (منطقة الرفع الذكي) ── */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          isDragging
            ? 'border-primary bg-primary/10 shadow-lg scale-[1.005]'
            : isDark
            ? 'bg-[#18181b] border-zinc-800/80'
            : 'bg-white border-zinc-200'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center text-2xl shrink-0">
              ⬆️
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold">
                {isRtl ? 'رفع ملفات وصور جديدة للمنصة' : 'Upload New Media Files'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {isRtl
                  ? 'اسحب وأفلت الملفات هنا، أو انقر للاستعراض. يدعم الصور، مستندات PDF، ومخططات CAD.'
                  : 'Drag and drop files here or browse. Supports images, PDFs, and CAD drawings.'}
              </p>
            </div>
          </div>

          {/* Upload Configuration & Action */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-400">{isRtl ? 'التصنيف:' : 'Category:'}</span>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className={`text-xs px-2.5 py-2 rounded-lg border font-medium ${
                  isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-zinc-50 border-zinc-300 text-zinc-800'
                }`}
              >
                {CATEGORIES.filter((c) => c.key !== 'ALL').map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.icon} {isRtl ? c.labelAr : c.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,.pdf,.dwg,.dxf,.doc,.docx,.xls,.xlsx,.zip"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              {isRtl ? '📂 استعراض الملفات' : '📂 Browse Files'}
            </button>

            {selectedFiles.length > 0 && (
              <button
                type="button"
                disabled={isUploading}
                onClick={handleUploadSubmit}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-primary text-zinc-950 hover:opacity-90 disabled:opacity-50 transition flex items-center gap-2 shadow-sm"
              >
                {isUploading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    <span>{isRtl ? 'جاري الرفع...' : 'Uploading...'}</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>
                      {isRtl
                        ? `بدء رفع (${selectedFiles.length})`
                        : `Start Upload (${selectedFiles.length})`}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Selected files preview chip list */}
        {selectedFiles.length > 0 && (
          <div className="mt-3.5 pt-3.5 border-t border-zinc-200 dark:border-zinc-800">
            <div className="text-[11px] font-semibold text-zinc-400 mb-2">
              {isRtl ? 'الملفات المحددة بانتظار التأكيد:' : 'Selected files to upload:'}
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((f, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700"
                >
                  <span className="text-zinc-500">{isImageFile(f.type, f.name) ? '🖼️' : '📄'}</span>
                  <span className="font-mono text-[11px] max-w-[160px] truncate">{f.name}</span>
                  <span className="text-[10px] text-zinc-400">({formatBytes(f.size)})</span>
                  <button
                    onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))}
                    className="text-red-500 hover:text-red-700 text-xs px-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Category Filters & Search ── */}
      <div className="space-y-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-primary text-zinc-950 shadow-sm'
                    : isDark
                    ? 'bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-zinc-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{isRtl ? cat.labelAr : cat.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Filter bar: Type & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs self-start">
            <button
              onClick={() => setFileTypeFilter('all')}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                fileTypeFilter === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              {isRtl ? 'جميع الأنواع' : 'All Types'}
            </button>
            <button
              onClick={() => setFileTypeFilter('image')}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                fileTypeFilter === 'image'
                  ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              {isRtl ? '🖼️ صور فقط' : '🖼️ Images Only'}
            </button>
            <button
              onClick={() => setFileTypeFilter('document')}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                fileTypeFilter === 'document'
                  ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              {isRtl ? '📄 مستندات و CAD' : '📄 Docs & CAD'}
            </button>
          </div>

          <div className="w-full sm:w-72 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? 'بحث باسم الملف أو الوصف...' : 'Search file name or alt text...'}
              className={`w-full text-xs px-3.5 py-2 pl-8 rounded-lg border outline-none transition ${
                isDark
                  ? 'bg-zinc-900 border-zinc-800 focus:border-primary text-zinc-100'
                  : 'bg-white border-zinc-300 focus:border-primary text-zinc-800'
              }`}
            />
            <span className="absolute left-2.5 top-2.5 text-zinc-400 text-xs">🔍</span>
          </div>
        </div>
      </div>

      {/* ── Media Grid View ── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-xs">{isRtl ? 'جاري تحميل الوسائط...' : 'Loading media...'}</div>
        </div>
      ) : mediaList.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'}`}>
          <div className="text-4xl mb-3">📂</div>
          <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            {isRtl ? 'لا توجد وسائط مطابقة' : 'No Media Found'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {isRtl ? 'جرّب رفع ملفات جديدة أو تغيير خيارات الفلترة والتصنيف.' : 'Upload new files or change your filter selection.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
          {mediaList.map((file) => {
            const isImg = isImageFile(file.fileType, file.originalName);
            const isPdf = file.fileType?.includes('pdf') || file.originalName.toLowerCase().endsWith('.pdf');
            const isCad = file.originalName.toLowerCase().endsWith('.dwg') || file.originalName.toLowerCase().endsWith('.dxf');

            return (
              <div
                key={file.id}
                className={`group relative rounded-xl border overflow-hidden flex flex-col transition hover:shadow-md ${
                  isDark ? 'bg-[#18181b] border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 hover:border-zinc-300'
                }`}
              >
                {/* Thumbnail Preview Area */}
                <div
                  className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-900/90 flex items-center justify-center overflow-hidden cursor-pointer"
                  onClick={() => setPreviewItem(file)}
                >
                  {isImg ? (
                    <img
                      src={file.fileUrl}
                      alt={file.altText || file.originalName}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-3 text-center">
                      <span className="text-3xl mb-1">
                        {isPdf ? '📕' : isCad ? '📐' : '📄'}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        {isPdf ? 'PDF DOC' : isCad ? 'CAD DWG' : 'FILE'}
                      </span>
                    </div>
                  )}

                  {/* Category Pill Tag */}
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-black/60 text-white backdrop-blur-sm">
                    {CATEGORIES.find((c) => c.key === file.category)?.labelAr || file.category}
                  </div>
                </div>

                {/* File Details */}
                <div className="p-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      className="text-xs font-semibold truncate text-zinc-800 dark:text-zinc-200"
                      title={file.originalName}
                    >
                      {file.originalName}
                    </h3>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1">
                      <span>{formatBytes(file.fileSize)}</span>
                      <span>{new Date(file.createdAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</span>
                    </div>
                  </div>

                  {/* Action Buttons Bar */}
                  <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(file)}
                      className={`flex-1 py-1 px-1.5 rounded text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                        copiedId === file.id
                          ? 'bg-emerald-500/20 text-emerald-500'
                          : 'bg-primary/15 text-primary hover:bg-primary/25'
                      }`}
                      title={isRtl ? 'نسخ الرابط المباشر' : 'Copy Direct URL'}
                    >
                      <span>{copiedId === file.id ? '✓' : '🔗'}</span>
                      <span>{copiedId === file.id ? (isRtl ? 'تم النسخ' : 'Copied') : (isRtl ? 'نسخ' : 'Copy')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(file);
                        setEditCategory(file.category);
                        setEditAltText(file.altText || '');
                      }}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[11px]"
                      title={isRtl ? 'تعديل' : 'Edit'}
                    >
                      ✏️
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(file)}
                      className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-500/10 text-[11px]"
                      title={isRtl ? 'حذف' : 'Delete'}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Lightbox / Full Preview ── */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
              isDark ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200'
            }`}
          >
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-bold truncate max-w-md">{previewItem.originalName}</h2>
              <button
                onClick={() => setPreviewItem(null)}
                className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-auto flex items-center justify-center bg-zinc-950/20">
              {isImageFile(previewItem.fileType, previewItem.originalName) ? (
                <img
                  src={previewItem.fileUrl}
                  alt={previewItem.altText || previewItem.originalName}
                  className="max-h-[55vh] object-contain rounded-lg shadow"
                />
              ) : (
                <div className="p-8 text-center space-y-3">
                  <div className="text-5xl">📄</div>
                  <div className="text-sm font-bold">{previewItem.originalName}</div>
                  <div className="text-xs text-zinc-400">
                    {previewItem.fileType} · {formatBytes(previewItem.fileSize)}
                  </div>
                  <a
                    href={previewItem.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block px-4 py-2 text-xs font-bold rounded-lg bg-primary text-zinc-950 hover:opacity-90 transition"
                  >
                    {isRtl ? 'تحميل / فتح المستند في نافذة جديدة' : 'Open / Download Document'}
                  </a>
                </div>
              )}
            </div>

            {/* Direct URL copy bar in modal */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2 bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="text-[11px] font-semibold text-zinc-500">
                {isRtl ? 'الرابط المباشر للملف (يمكن استخدامه في أي شاشة أو تطبيق):' : 'Direct File URL:'}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={previewItem.fileUrl}
                  className={`flex-1 text-xs px-3 py-2 rounded-lg border font-mono select-all ${
                    isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-800'
                  }`}
                />
                <button
                  onClick={() => handleCopyLink(previewItem)}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-primary text-zinc-950 hover:opacity-90 transition shrink-0"
                >
                  {copiedId === previewItem.id ? (isRtl ? 'تم النسخ!' : 'Copied!') : (isRtl ? 'نسخ الرابط' : 'Copy URL')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Edit Metadata ── */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form
            onSubmit={handleEditSubmit}
            className={`w-full max-w-md rounded-2xl border shadow-xl p-5 space-y-4 ${
              isDark ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-bold">{isRtl ? 'تعديل بيانات الملف' : 'Edit File Metadata'}</h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1">
                {isRtl ? 'التصنيف' : 'Category'}
              </label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className={`w-full text-xs px-3 py-2 rounded-lg border ${
                  isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-800'
                }`}
              >
                {CATEGORIES.filter((c) => c.key !== 'ALL').map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.icon} {isRtl ? c.labelAr : c.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1">
                {isRtl ? 'الوصف البديل (Alt Text / Title)' : 'Alt Description'}
              </label>
              <input
                type="text"
                value={editAltText}
                onChange={(e) => setEditAltText(e.target.value)}
                className={`w-full text-xs px-3 py-2 rounded-lg border ${
                  isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-800'
                }`}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-primary text-zinc-950 hover:opacity-90"
              >
                {isRtl ? 'حفظ التعديلات' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Modal: Cloudflare R2 Guide ── */}
      {showR2Guide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto ${
              isDark ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-zinc-200 dark:border-zinc-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>☁️</span>
                <span>{isRtl ? 'دليل تفعيل Cloudflare R2 مع منصة آفاق العرب' : 'Cloudflare R2 Setup Guide'}</span>
              </h3>
              <button
                onClick={() => setShowR2Guide(false)}
                className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-3.5 leading-relaxed text-zinc-600 dark:text-zinc-300">
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300">
                <span className="font-bold">{isRtl ? '💡 معلومة هامة:' : '💡 Important Note:'} </span>
                {isRtl
                  ? 'النظام يعمل الآن بنجاح على التخزين السحابي المباشر، وتفعيل Cloudflare R2 خطوة اختيارية تمنحك 10 جيجابايت مجاناً شهرياً وصفر رسوم باندويث.'
                  : 'The system is already operational using direct storage. Enabling Cloudflare R2 is an optional upgrade that grants 10 GB free monthly storage with zero egress bandwidth fees.'}
              </div>

              <div className="font-bold text-zinc-800 dark:text-zinc-100">
                {isRtl ? 'خطوات التفعيل البسيطة (تأخذ دقيقة واحدة فقط):' : 'Easy Setup Steps (Takes 1 minute):'}
              </div>

              <ol className="list-decimal list-inside space-y-2 text-xs">
                <li>
                  {isRtl ? 'سجل الدخول لحسابك في ' : 'Sign in to your account at '}
                  <a
                    href="https://dash.cloudflare.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline font-bold"
                  >
                    dash.cloudflare.com
                  </a>
                </li>
                <li>
                  {isRtl
                    ? 'من القائمة الجانبية اختر "R2 Object Storage"، ثم اضغط "Create bucket" وسمّه مثلاً: '
                    : 'From the sidebar choose "R2 Object Storage", click "Create bucket" and name it e.g. '}
                  <code className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono">afaq-media</code>
                </li>
                <li>
                  {isRtl
                    ? 'من تبويب "Settings" الخاص بالـ Bucket، فعّل خيار "Public Development URL" للحصول على رابط مباشر.'
                    : 'In Bucket "Settings", enable "Public Development URL" to obtain a direct public domain.'}
                </li>
                <li>
                  {isRtl
                    ? 'من صفحة R2 الرئيسية اضغط "Manage R2 API Tokens" ثم "Create API Token" بصلاحية Object Read & Write.'
                    : 'From R2 home page, click "Manage R2 API Tokens" then "Create API Token" with Object Read & Write permissions.'}
                </li>
                <li>
                  {isRtl
                    ? 'انسخ المفاتيح الأربعة وأضفها إلى ملف '
                    : 'Copy the four keys into your backend '}
                  <code className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono">backend/.env</code>:
                </li>
              </ol>

              <div className="p-3 rounded-lg bg-zinc-900 text-zinc-200 font-mono text-[11px] overflow-x-auto select-all">
                R2_ACCOUNT_ID="your_account_id"<br />
                R2_ACCESS_KEY_ID="your_access_key"<br />
                R2_SECRET_ACCESS_KEY="your_secret_key"<br />
                R2_BUCKET_NAME="afaq-media"<br />
                R2_PUBLIC_URL="https://pub-xyz.r2.dev"
              </div>

              <div className="text-[11px] text-zinc-400">
                {isRtl
                  ? 'بمجرد إضافة هذه المتغيرات، سيتحول النظام فوراً وتلقائياً للرفع والتخزين على سحابة Cloudflare R2 دون أي تعديل إضافي!'
                  : 'Once these variables are set, the system seamlessly transitions to Cloudflare R2 with zero extra configuration!'}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowR2Guide(false)}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-primary text-zinc-950 hover:opacity-90"
              >
                {isRtl ? 'فهمت ذلك، إغلاق' : 'Got it, Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
