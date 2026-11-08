'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '../../../lib/api';
import { useApp } from '../../../context/AppContext';

// Metadata for each setting key
const SETTING_META: Record<string, {
  labelAr: string; labelEn: string;
  group: 'platform' | 'location' | 'social' | 'contact' | 'ai';
  icon: string;
  type: 'text' | 'email' | 'password' | 'number' | 'url';
  placeholder?: string;
  sensitive?: boolean;
}> = {
  platform_name:    { labelAr: 'اسم المنصة / المكتب',         labelEn: 'Platform / Office Name',group: 'platform', icon: '🏢', type: 'text',     placeholder: 'آفاق العرب الذكية' },
  platform_logo:    { labelAr: 'شعار المكتب (Logo)',          labelEn: 'Office Logo',           group: 'platform', icon: '🎨', type: 'url',      placeholder: 'https://... أو رفع صورة' },
  
  platform_address: { labelAr: 'العنوان الفعلي للمكتب',        labelEn: 'Physical Office Address',group: 'location', icon: '📍', type: 'text',     placeholder: 'محافظة ذمار، اليمن' },
  office_latitude:  { labelAr: 'دائرة العرض (Latitude)',       labelEn: 'Latitude',              group: 'location', icon: '🌐', type: 'text',     placeholder: '14.559980' },
  office_longitude: { labelAr: 'خط الطول (Longitude)',        labelEn: 'Longitude',             group: 'location', icon: '🌐', type: 'text',     placeholder: '44.385939' },

  facebook_url:     { labelAr: 'رابط صفحة فيسبوك الرسمية',    labelEn: 'Official Facebook Page',group: 'social',   icon: '📘', type: 'url',      placeholder: 'https://www.facebook.com/...' },
  instagram_url:    { labelAr: 'رابط حساب انستغرام',          labelEn: 'Instagram Profile URL', group: 'social',   icon: '📷', type: 'url',      placeholder: 'https://www.instagram.com/...' },
  twitter_url:      { labelAr: 'رابط منصة X (تويتر)',         labelEn: 'X / Twitter URL',       group: 'social',   icon: '✖️', type: 'url',      placeholder: 'https://x.com/...' },
  linkedin_url:     { labelAr: 'رابط حساب لينكد إن',          labelEn: 'LinkedIn URL',          group: 'social',   icon: '💼', type: 'url',      placeholder: 'https://www.linkedin.com/in/...' },
  snapchat_url:     { labelAr: 'رابط حساب سناب شات',          labelEn: 'Snapchat URL',          group: 'social',   icon: '👻', type: 'url',      placeholder: 'https://www.snapchat.com/add/...' },
  youtube_url:      { labelAr: 'رابط قناة يوتيوب',            labelEn: 'YouTube Channel URL',   group: 'social',   icon: '📺', type: 'url',      placeholder: 'https://www.youtube.com/@...' },
  whatsapp_phone:   { labelAr: 'رقم واتساب الموحد للمكتب',    labelEn: 'Unified Office WhatsApp',group: 'social',  icon: '💬', type: 'text',     placeholder: '777633944' },

  platform_email:   { labelAr: 'البريد الرسمي',               labelEn: 'Official Email',        group: 'contact',  icon: '✉️', type: 'email',    placeholder: 'contact@afaq.com' },
  platform_phone:   { labelAr: 'رقم الهاتف المباشر',          labelEn: 'Direct Phone Number',   group: 'contact',  icon: '📞', type: 'text',     placeholder: '777633944' },

  ai_enabled:       { labelAr: 'تفعيل المساعد الذكي',         labelEn: 'Enable AI Assistant',   group: 'ai',       icon: '⚡', type: 'text',     placeholder: 'true' },
  ai_api_key:       { labelAr: 'مفتاح Gemini API',            labelEn: 'Gemini API Key',        group: 'ai',       icon: '🔑', type: 'password', placeholder: 'AQ.Ab8RN...', sensitive: true },
  ai_model:         { labelAr: 'نموذج الذكاء الاصطناعي',      labelEn: 'AI Model Version',      group: 'ai',       icon: '🤖', type: 'text',     placeholder: 'gemini-3.8-flash' },
  ai_monthly_limit: { labelAr: 'حد الرسائل الشهري للعميل',    labelEn: 'Monthly Message Limit', group: 'ai',       icon: '📊', type: 'number',   placeholder: '1000' },
};

const GROUP_META = {
  platform: { labelAr: 'هوية المنصة والشعار',   labelEn: 'Platform & Branding',  icon: '🏢', color: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-50 dark:bg-blue-500/10',       border: 'border-blue-200 dark:border-blue-500/20',       bar: 'bg-blue-500' },
  location: { labelAr: 'موقع المكتب والخريطة',  labelEn: 'Office Location & Maps',icon: '📍', color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10',     border: 'border-amber-200 dark:border-amber-500/20',     bar: 'bg-amber-500' },
  social:   { labelAr: 'منصات التواصل الاجتماعي',labelEn: 'Social Media Channels',icon: '🌐', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10',   border: 'border-indigo-200 dark:border-indigo-500/20',   bar: 'bg-indigo-500' },
  contact:  { labelAr: 'بيانات التواصل الأساسية',labelEn: 'Contact Details',     icon: '📞', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', bar: 'bg-emerald-500' },
  ai:       { labelAr: 'إعدادات الذكاء الاصطناعي',labelEn: 'AI Configuration',   icon: '🤖', color: 'text-purple-600 dark:text-purple-400',   bg: 'bg-purple-50 dark:bg-purple-500/10',   border: 'border-purple-200 dark:border-purple-500/20',   bar: 'bg-purple-500' },
};

const CITY_PRESETS = [
  { nameAr: 'ذمار (مقر المكتب الرئيسي)', nameEn: 'Dhamar (Main Office)', lat: 14.55998012643909, lng: 44.3859385889446 },
  { nameAr: 'صنعاء (السبعين)', nameEn: 'Sanaa (Al-Sabeen)', lat: 15.3547, lng: 44.2066 },
  { nameAr: 'عدن (خور مكسر)', nameEn: 'Aden (Khor Maksar)', lat: 12.8256, lng: 45.0347 },
  { nameAr: 'تعز (الحوبان)', nameEn: 'Taiz (Al-Hawban)', lat: 13.5789, lng: 44.0219 },
  { nameAr: 'إب (الدائري)', nameEn: 'Ibb (Ring Road)', lat: 13.9789, lng: 44.1824 },
  { nameAr: 'الحديدة (الميناء)', nameEn: 'Hodeidah (Port)', lat: 14.7978, lng: 42.9545 },
];

export default function SettingsPage() {
  const { lang, theme, showAlert, refreshSettings } = useApp();
  const isRtl = lang === 'ar';

  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  // Map Modal State
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempLat, setTempLat] = useState<number>(14.55998012643909);
  const [tempLng, setTempLng] = useState<number>(44.3859385889446);
  const [tempAddress, setTempAddress] = useState<string>('');
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      setSettings(res || []);
      const mapped: Record<string, string> = {};
      (res || []).forEach((s: any) => { mapped[s.key] = s.value; });
      setForm(mapped);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadSettings(); }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = Object.keys(form).map(key => ({ key, value: form[key] }));
      await api.post('/settings', { settings: payload });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      loadSettings();
      refreshSettings();
      showAlert(isRtl ? 'تم حفظ وتعميم الإعدادات بنجاح!' : 'Settings saved and applied successfully!', 'success');
    } catch (err) {
      showAlert(isRtl ? 'فشل حفظ الإعدادات.' : 'Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Open Map Modal ───────────────────────────────────────────────────
  const openLocationPicker = () => {
    const lat = parseFloat(form['office_latitude']) || 14.55998012643909;
    const lng = parseFloat(form['office_longitude']) || 44.3859385889446;
    setTempLat(lat);
    setTempLng(lng);
    setTempAddress(form['platform_address'] || 'محافظة ذمار، اليمن');
    setShowMapModal(true);
  };

  // ── Initialize Leaflet Map in Modal ──────────────────────────────────
  useEffect(() => {
    if (!showMapModal) return;

    let isSubscribed = true;

    const loadLeaflet = async () => {
      // Inject CSS if missing
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Inject JS if missing
      if (!(window as any).L) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          document.body.appendChild(script);
        });
      }

      if (!isSubscribed) return;

      const L = (window as any).L;
      if (!L || !mapContainerRef.current) return;

      // Clean up previous map instance
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(mapContainerRef.current).setView([tempLat, tempLng], 14);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([tempLat, tempLng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setTempLat(Number(pos.lat.toFixed(6)));
        setTempLng(Number(pos.lng.toFixed(6)));
      });

      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        setTempLat(Number(e.latlng.lat.toFixed(6)));
        setTempLng(Number(e.latlng.lng.toFixed(6)));
      });

      setTimeout(() => { map.invalidateSize(); }, 200);
    };

    loadLeaflet();

    return () => {
      isSubscribed = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [showMapModal]);

  const jumpToPreset = (lat: number, lng: number, nameAr: string, nameEn: string) => {
    setTempLat(lat);
    setTempLng(lng);
    setTempAddress(isRtl ? nameAr : nameEn);
    if (mapRef.current && markerRef.current) {
      mapRef.current.setView([lat, lng], 14);
      markerRef.current.setLatLng([lat, lng]);
    }
  };

  const confirmLocationSelection = () => {
    setForm(prev => ({
      ...prev,
      office_latitude: tempLat.toString(),
      office_longitude: tempLng.toString(),
      platform_address: tempAddress || prev.platform_address || '',
    }));
    setShowMapModal(false);
    showAlert(isRtl ? 'تم تحديد الإحداثيات! لا تنسَ الضغط على زر الحفظ.' : 'Location set! Remember to click Save All Settings.', 'success');
  };

  // ── Handle Logo File Upload (Base64) ─────────────────────────────────
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showAlert(isRtl ? 'حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 2 ميجابايت' : 'Image is too large (max 2MB)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm(prev => ({ ...prev, platform_logo: reader.result as string }));
        showAlert(isRtl ? 'تم تحميل الشعار بنجاح! اضغط حفظ لاعتماده.' : 'Logo loaded! Click Save to apply.', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Group settings by category
  const grouped: Record<keyof typeof GROUP_META, any[]> = {
    platform: [],
    location: [],
    social: [],
    contact: [],
    ai: [],
  };

  settings.forEach(s => {
    const m = SETTING_META[s.key];
    if (m?.group && grouped[m.group]) {
      grouped[m.group].push(s);
    } else {
      grouped.platform.push(s);
    }
  });

  const inputCls = `w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition shadow-sm ${
    theme === 'dark' ? 'bg-zinc-900 border-zinc-700/80 text-zinc-100 placeholder-zinc-600' : 'bg-zinc-50 border-zinc-300 text-zinc-800 placeholder-zinc-400'
  }`;
  const card = `rounded-2xl border ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-zinc-200'}`;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{isRtl ? 'جاري تحميل الإعدادات...' : 'Loading settings...'}</p>
        </div>
      </div>
    );
  }

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
              <span className="text-sm">⚙️</span>
              <span className="text-[11px] font-bold text-primary tracking-wide uppercase">{isRtl ? 'إعدادات المنصة الموحدة' : 'Unified Platform Settings'}</span>
            </div>
            <h1 className={`text-2xl font-black mb-1 ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
              {isRtl ? 'الإعدادات العامة لمكتب آفاق العرب' : 'Platform & Office Configuration'}
            </h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {isRtl ? 'الشعار الرسمي · موقع المكتب بالخريطة · شبكات التواصل الاجتماعي · الذكاء الاصطناعي' : 'Office logo · Map coordinates · Social networks · AI'}
            </p>
          </div>
          {saved && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-pulse">
              ✅ {isRtl ? 'تم الحفظ وتعميم التغييرات بنجاح' : 'Settings saved & applied!'}
            </div>
          )}
        </div>
      </div>

      {/* ── Overview cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(Object.entries(GROUP_META) as [keyof typeof GROUP_META, typeof GROUP_META.platform][]).map(([key, g]) => (
          <div key={key} className={`rounded-xl border p-3 ${g.bg} ${g.border}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{g.icon}</span>
              <span className={`text-[11px] font-extrabold uppercase tracking-tight truncate ${g.color}`}>{isRtl ? g.labelAr : g.labelEn}</span>
            </div>
            <div className={`text-xl font-black ${g.color}`}>{grouped[key].length}</div>
            <div className={`text-[9px] font-semibold ${g.color} opacity-70`}>{isRtl ? 'إعداد' : 'items'}</div>
          </div>
        ))}
      </div>

      {/* ── Settings Form ── */}
      <form onSubmit={handleUpdate} className="space-y-6">

        {(Object.entries(GROUP_META) as [keyof typeof GROUP_META, typeof GROUP_META.platform][]).map(([groupKey, g]) => {
          const groupSettings = grouped[groupKey];
          if (groupSettings.length === 0) return null;

          return (
            <div key={groupKey} className={`${card} overflow-hidden shadow-sm`}>
              {/* Group header */}
              <div className={`flex items-center justify-between px-6 py-4 border-b ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-6 rounded-full ${g.bar}`} />
                  <span className="text-xl">{g.icon}</span>
                  <div>
                    <h2 className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>{isRtl ? g.labelAr : g.labelEn}</h2>
                    <p className={`text-[10px] ${g.color}`}>{groupSettings.length} {isRtl ? 'إعدادات متاحة' : 'settings available'}</p>
                  </div>
                </div>

                {/* Quick Map Action in Location Group */}
                {groupKey === 'location' && (
                  <button
                    type="button"
                    onClick={openLocationPicker}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs transition shadow-sm cursor-pointer"
                  >
                    <span>🗺️</span>
                    <span>{isRtl ? 'تحديد واختيار الموقع من الخريطة' : 'Pick Location on Map'}</span>
                  </button>
                )}
              </div>

              {/* Settings content */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {groupSettings.map((setting: any) => {
                    const meta = SETTING_META[setting.key];
                    const isSensitive = meta?.sensitive;
                    const showKey = showKeys[setting.key];

                    // Special Render: Platform Logo
                    if (setting.key === 'platform_logo') {
                      const logoVal = form['platform_logo'];
                      return (
                        <div key={setting.key} className="md:col-span-2 space-y-3 p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🎨</span>
                              <label className="text-xs font-black uppercase text-primary">
                                {isRtl ? 'شعار المكتب والمنصة الرسمي' : 'Official Office & Platform Logo'}
                              </label>
                            </div>
                            <span className="text-[10px] text-zinc-500">
                              {isRtl ? 'يظهر في لوحة التحكم وتطبيق الهاتف' : 'Appears in Dashboard & Mobile App'}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 flex-wrap">
                            {/* Logo Preview */}
                            <div className={`w-20 h-20 rounded-xl border flex items-center justify-center overflow-hidden shrink-0 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-700' : 'bg-white border-zinc-200'}`}>
                              {logoVal ? (
                                <img src={logoVal} alt="Logo" className="w-full h-full object-contain p-1" />
                              ) : (
                                <div className="text-center p-2">
                                  <span className="text-2xl">🏛️</span>
                                  <div className="text-[9px] text-zinc-400 mt-0.5">{isRtl ? 'لا يوجد شعار' : 'No Logo'}</div>
                                </div>
                              )}
                            </div>

                            {/* Logo Input & Upload Actions */}
                            <div className="flex-1 min-w-[240px] space-y-2">
                              <div className="flex items-center gap-2">
                                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-zinc-950 text-xs font-bold cursor-pointer hover:opacity-90 transition">
                                  <span>📁</span>
                                  <span>{isRtl ? 'اختيار ورفع ملف شعار من الجهاز' : 'Upload Image File'}</span>
                                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                </label>
                                {logoVal && (
                                  <button
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, platform_logo: '' }))}
                                    className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-500 border border-red-200 dark:border-red-800/50 text-xs font-bold hover:bg-red-100 transition cursor-pointer"
                                  >
                                    {isRtl ? 'حذف الشعار' : 'Remove Logo'}
                                  </button>
                                )}
                              </div>
                              <input
                                type="url"
                                value={logoVal || ''}
                                onChange={e => setForm({ ...form, platform_logo: e.target.value })}
                                placeholder="https://... أو يمكنك لصق رابط صورة مباشر هنا"
                                className={inputCls}
                                dir="ltr"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={setting.key} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{meta?.icon ?? '⚙️'}</span>
                          <label htmlFor={`setting-${setting.key}`} className={`text-[11px] font-extrabold uppercase tracking-wide ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            {isRtl ? (meta?.labelAr ?? setting.key) : (meta?.labelEn ?? setting.key)}
                          </label>
                          {isSensitive && (
                            <span className="ms-auto px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-50 dark:bg-red-950/30 text-red-500 border border-red-200 dark:border-red-800/50">
                              {isRtl ? 'حساس' : 'Sensitive'}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            id={`setting-${setting.key}`}
                            type={isSensitive && !showKey ? 'password' : (meta?.type === 'password' ? 'text' : meta?.type ?? 'text')}
                            value={form[setting.key] || ''}
                            onChange={e => setForm({ ...form, [setting.key]: e.target.value })}
                            placeholder={meta?.placeholder}
                            className={`${inputCls} ${isSensitive ? (isRtl ? 'pe-10' : 'pr-10') : ''}`}
                            dir={['email', 'url', 'password'].includes(meta?.type ?? '') || setting.key.includes('api') || setting.key.includes('model') || setting.key.includes('phone') || setting.key.includes('latitude') || setting.key.includes('longitude') ? 'ltr' : undefined}
                            aria-label={isRtl ? meta?.labelAr : meta?.labelEn}
                          />
                          {isSensitive && (
                            <button
                              type="button"
                              onClick={() => setShowKeys(prev => ({ ...prev, [setting.key]: !prev[setting.key] }))}
                              className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-3' : 'right-3'} text-xs cursor-pointer ${theme === 'dark' ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'}`}
                              aria-label={showKey ? (isRtl ? 'إخفاء' : 'Hide') : (isRtl ? 'إظهار' : 'Show')}>
                              {showKey ? '🙈' : '👁️'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* ── Save Button ── */}
        <div className={`${card} px-6 py-4 flex items-center justify-between gap-4 flex-wrap sticky bottom-4 z-20 shadow-lg backdrop-blur-md`}>
          <div className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
            <span className="text-amber-500 font-bold">💡 </span>
            {isRtl ? 'يتم تعميم التغييرات على لوحة التحكم وتطبيق الهاتف فوراً بمجرد الحفظ.' : 'Changes propagate to Dashboard and Mobile App instantly upon saving.'}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-7 py-2.5 rounded-xl primary-gradient text-zinc-950 font-black text-sm hover:opacity-95 transition disabled:opacity-60 cursor-pointer flex items-center gap-2 shadow-md"
          >
            {saving
              ? <><span className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />{isRtl ? 'جاري الحفظ...' : 'Saving...'}</>
              : <><span>💾</span><span>{isRtl ? 'حفظ وتعميم جميع الإعدادات' : 'Save & Apply All Settings'}</span></>
            }
          </button>
        </div>
      </form>

      {/* ── Map Modal ── */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-white border-zinc-300 text-zinc-900'}`}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">📍</span>
                <div>
                  <h3 className="font-extrabold text-base">{isRtl ? 'تحديد موقع المكتب على الخريطة' : 'Pick Office Location on Map'}</h3>
                  <p className="text-[11px] text-zinc-500">{isRtl ? 'انقر على أي نقطة بالخريطة أو اسحب المؤشر لتحديد موقع المكتب بدقة' : 'Click anywhere on map or drag pin to position office'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* City Preset Chips */}
            <div className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-bold text-zinc-500 shrink-0">{isRtl ? 'انتقال سريع:' : 'Quick Jump:'}</span>
              {CITY_PRESETS.map(c => (
                <button
                  key={c.lat}
                  type="button"
                  onClick={() => jumpToPreset(c.lat, c.lng, c.nameAr, c.nameEn)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-200/80 dark:bg-zinc-800 hover:bg-primary/20 hover:text-primary transition shrink-0 cursor-pointer"
                >
                  {isRtl ? c.nameAr : c.nameEn}
                </button>
              ))}
            </div>

            {/* Map Canvas */}
            <div className="relative flex-1 min-h-[360px] bg-zinc-200 dark:bg-zinc-950">
              <div ref={mapContainerRef} className="w-full h-[380px] z-10" />
            </div>

            {/* Coordinates & Address Preview */}
            <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 space-y-3 bg-zinc-50 dark:bg-zinc-950/60">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 block mb-1">{isRtl ? 'دائرة العرض (Latitude)' : 'Latitude'}</label>
                  <input
                    type="number"
                    step="any"
                    value={tempLat}
                    onChange={e => setTempLat(parseFloat(e.target.value) || 0)}
                    className={`${inputCls} text-xs py-1.5 font-mono`}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 block mb-1">{isRtl ? 'خط الطول (Longitude)' : 'Longitude'}</label>
                  <input
                    type="number"
                    step="any"
                    value={tempLng}
                    onChange={e => setTempLng(parseFloat(e.target.value) || 0)}
                    className={`${inputCls} text-xs py-1.5 font-mono`}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 block mb-1">{isRtl ? 'العنوان / الوصف' : 'Address Description'}</label>
                  <input
                    type="text"
                    value={tempAddress}
                    onChange={e => setTempAddress(e.target.value)}
                    placeholder={isRtl ? 'محافظة ذمار، اليمن' : 'Dhamar, Yemen'}
                    className={`${inputCls} text-xs py-1.5`}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMapModal(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={confirmLocationSelection}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-black transition shadow-md cursor-pointer flex items-center gap-2"
                >
                  <span>📍</span>
                  <span>{isRtl ? 'تأكيد واعتماد الموقع' : 'Confirm & Apply Location'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
