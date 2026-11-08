'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useApp } from '../../../context/AppContext';

// Metadata for each setting key
const SETTING_META: Record<string, {
  labelAr: string; labelEn: string;
  group: 'platform' | 'ai' | 'contact';
  icon: string;
  type: 'text' | 'email' | 'password' | 'number' | 'url';
  placeholder?: string;
  sensitive?: boolean;
}> = {
  platform_name:    { labelAr: 'اسم المنصة',               labelEn: 'Platform Name',         group: 'platform', icon: '🏢', type: 'text',     placeholder: 'آفاق العرب الذكية' },
  platform_email:   { labelAr: 'البريد الرسمي',             labelEn: 'Official Email',        group: 'contact',  icon: '✉️', type: 'email',    placeholder: 'contact@example.com' },
  platform_phone:   { labelAr: 'رقم الهاتف',                labelEn: 'Phone Number',          group: 'contact',  icon: '📞', type: 'text',     placeholder: '+967 XXX XXXXXX' },
  platform_address: { labelAr: 'العنوان الفعلي',             labelEn: 'Physical Address',      group: 'contact',  icon: '📍', type: 'text',     placeholder: 'ذمار، اليمن' },
  ai_enabled:       { labelAr: 'تفعيل المساعد الذكي',       labelEn: 'Enable AI Assistant',   group: 'ai',       icon: '⚡', type: 'text',     placeholder: 'true' },
  ai_api_key:       { labelAr: 'مفتاح Gemini API',          labelEn: 'Gemini API Key',        group: 'ai',       icon: '🔑', type: 'password', placeholder: 'AQ.Ab8RN...', sensitive: true },
  ai_model:         { labelAr: 'نموذج الذكاء الاصطناعي',    labelEn: 'AI Model Version',      group: 'ai',       icon: '🤖', type: 'text',     placeholder: 'gemini-3.8-flash' },
  ai_monthly_limit: { labelAr: 'حد الرسائل الشهري',         labelEn: 'Monthly Message Limit', group: 'ai',       icon: '📊', type: 'number',   placeholder: '1000' },
};

const GROUP_META = {
  platform: { labelAr: 'هوية المنصة',    labelEn: 'Platform Identity', icon: '🏢', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', bar: 'bg-blue-500' },
  contact:  { labelAr: 'بيانات التواصل', labelEn: 'Contact Details',   icon: '📞', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', bar: 'bg-emerald-500' },
  ai:       { labelAr: 'الذكاء الاصطناعي', labelEn: 'AI Configuration', icon: '🤖', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/20', bar: 'bg-purple-500' },
};

export default function SettingsPage() {
  const { lang, theme, showAlert, showConfirm } = useApp();
  const isRtl = lang === 'ar';

  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

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
    } catch (err) { showAlert(isRtl ? 'فشل حفظ الإعدادات.' : 'Failed to save settings.', 'error'); }
    finally { setSaving(false); }
  };

  // Group settings by category
  const grouped = { platform: [] as any[], contact: [] as any[], ai: [] as any[] };
  settings.forEach(s => {
    const m = SETTING_META[s.key];
    if (m?.group === 'platform') grouped.platform.push(s);
    else if (m?.group === 'contact') grouped.contact.push(s);
    else if (m?.group === 'ai') grouped.ai.push(s);
    else grouped.platform.push(s); // fallback
  });

  const inputCls = `w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition ${
    theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-600' : 'bg-zinc-50 border-zinc-300 text-zinc-800 placeholder-zinc-400'
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
              <span className="text-[11px] font-bold text-primary tracking-wide uppercase">{isRtl ? 'إعدادات النظام' : 'System Settings'}</span>
            </div>
            <h1 className={`text-2xl font-black mb-1 ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
              {isRtl ? 'الإعدادات العامة للمنصة' : 'Platform Configuration'}
            </h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {isRtl ? 'هوية المنصة · بيانات التواصل · ضبط الذكاء الاصطناعي' : 'Platform identity · Contact details · AI configuration'}
            </p>
          </div>
          {saved && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-pulse">
              ✅ {isRtl ? 'تم الحفظ بنجاح' : 'Settings saved!'}
            </div>
          )}
        </div>
      </div>

      {/* ── Overview cards ── */}
      <div className="grid grid-cols-3 gap-4">
        {(Object.entries(GROUP_META) as [keyof typeof GROUP_META, typeof GROUP_META.platform][]).map(([key, g]) => (
          <div key={key} className={`rounded-2xl border p-4 ${g.bg} ${g.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{g.icon}</span>
              <span className={`text-xs font-extrabold uppercase tracking-wide ${g.color}`}>{isRtl ? g.labelAr : g.labelEn}</span>
            </div>
            <div className={`text-2xl font-black ${g.color}`}>{grouped[key].length}</div>
            <div className={`text-[10px] font-semibold mt-0.5 ${g.color} opacity-70`}>{isRtl ? 'إعداد' : 'settings'}</div>
          </div>
        ))}
      </div>

      {/* ── Settings Form ── */}
      <form onSubmit={handleUpdate} className="space-y-5">

        {(Object.entries(GROUP_META) as [keyof typeof GROUP_META, typeof GROUP_META.platform][]).map(([groupKey, g]) => {
          const groupSettings = grouped[groupKey];
          if (groupSettings.length === 0) return null;
          return (
            <div key={groupKey} className={`${card} overflow-hidden`}>
              {/* Group header */}
              <div className={`flex items-center gap-3 px-6 py-4 border-b ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <div className={`w-1 h-6 rounded-full ${g.bar}`} />
                <span className="text-xl">{g.icon}</span>
                <div>
                  <h2 className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>{isRtl ? g.labelAr : g.labelEn}</h2>
                  <p className={`text-[10px] ${g.color}`}>{groupSettings.length} {isRtl ? 'إعداد' : 'settings'}</p>
                </div>
              </div>

              {/* Settings grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {groupSettings.map((setting: any) => {
                    const meta = SETTING_META[setting.key];
                    const isSensitive = meta?.sensitive;
                    const showKey = showKeys[setting.key];
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
                            dir={['email', 'url', 'password'].includes(meta?.type ?? '') || setting.key.includes('api') || setting.key.includes('model') ? 'ltr' : undefined}
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
                        {setting.description && (
                          <p className={`text-[10px] ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>{setting.description}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* ── Save Button ── */}
        <div className={`${card} px-6 py-4 flex items-center justify-between gap-4 flex-wrap`}>
          <div className={`text-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
            <span className="text-amber-500">⚠️ </span>
            {isRtl ? 'تأكد من صحة المدخلات قبل الحفظ — لا يمكن التراجع تلقائياً.' : 'Verify all values before saving — changes take effect immediately.'}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl primary-gradient text-zinc-950 font-bold text-sm hover:opacity-90 transition disabled:opacity-60 cursor-pointer flex items-center gap-2 shadow-md"
          >
            {saving
              ? <><span className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />{isRtl ? 'جاري الحفظ...' : 'Saving...'}</>
              : <><span>💾</span><span>{isRtl ? 'حفظ جميع الإعدادات' : 'Save All Settings'}</span></>
            }
          </button>
        </div>
      </form>
    </div>
  );
}
