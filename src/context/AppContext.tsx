'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';
type Lang = 'ar' | 'en';
export type ThemeColor = 'gold' | 'emerald' | 'blue' | 'purple' | 'orange';

interface AppContextType {
  theme: Theme;
  lang: Lang;
  themeColor: ThemeColor;
  toggleTheme: () => void;
  toggleLang: () => void;
  setThemeColor: (color: ThemeColor) => void;
  t: (key: string) => string;
  showAlert: (message: string, type?: 'success' | 'error' | 'warning' | 'info', title?: string) => Promise<void>;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// A simple dictionary for essential administrative translations
const translations: Record<Lang, Record<string, string>> = {
  ar: {
    dashboard: 'الرئيسية',
    properties: 'إدارة العقارات',
    propertiesList: 'العقارات المدرجة',
    propertyTypes: 'أنواع العقارات',
    categoriesFeatures: 'التصنيفات والمميزات',
    requests: 'طلبات الخدمات',
    projects: 'المشاريع التشغيلية',
    services: 'تصنيف الخدمات',
    community: 'بوابة المجتمع',
    users: 'المستخدمين والفرق',
    settings: 'إعدادات النظام',
    logs: 'سجلات الرقابة',
    reports: 'التقارير والتحليلات',
    welcome: 'مرحباً بك في لوحة تحكم آفاق العرب',
    welcomeSub: 'يمكنك إدارة العقارات المدرجة، مراجعة طلبات التخطيط والمقاولات، وتوزيع المهام على المهندسين والمقاولين ومتابعة نسب الإنجاز التشغيلية.',
    totalProperties: 'العقارات المدرجة',
    pendingRequests: 'طلبات قيد المراجعة',
    activeProjects: 'المشاريع الجارية',
    aiUsage: 'استهلاك المساعد الذكي',
    quickAccess: 'الوصول السريع',
    addProperty: 'إدراج عقار جديد',
    reviewRequests: 'مراجعة طلبات العملاء',
    aiSettings: 'إعدادات المساعد الذكي',
    recentEvents: 'الأحداث والعمليات الأخيرة بالمنصة',
    loading: 'جاري التحميل...',
    themeLight: 'الوضع المضيء',
    themeDark: 'الوضع الداكن',
    langEn: 'English',
    langAr: 'العربية',
    logout: 'تسجيل الخروج',
    admin: 'مدير النظام',
    themeColor: 'لون السمة',
    activePropertyCount: 'عقار مضاف بالمنصة',
    pendingRequestCount: 'طلب ينتظر المراجعة والتأكيد',
    activeProjectCount: 'مشروع هندسي ومقاولات قيد التنفيذ',
    aiTokensLabel: 'توكين مستهلك عبر Gemini API',
    recentSystemLogs: 'سجلات العمليات والأحداث الأخيرة',
    logAction: 'العملية',
    logUser: 'المستخدم',
    logDate: 'التاريخ',
    logDetails: 'تفاصيل سجل الرقابة والـ IP',
    close: 'إغلاق',
    recentProjectsTitle: 'المشاريع الجارية الأخيرة بالمنصة',
    recentRequestsTitle: 'طلبات الخدمات الأخيرة بانتظار التأكيد',
    projectName: 'اسم المشروع / الطلب',
    progress: 'نسبة الإنجاز',
    status: 'الحالة',
    viewAll: 'عرض الكل',
    noData: 'لا توجد بيانات متاحة حالياً.',
  },
  en: {
    dashboard: 'Dashboard',
    properties: 'Properties Management',
    propertiesList: 'Properties List',
    propertyTypes: 'Property Types',
    categoriesFeatures: 'Categories & Features',
    requests: 'Service Requests',
    projects: 'Operational Projects',
    services: 'Manage Services',
    community: 'Community Portal',
    users: 'Users & Teams',
    settings: 'System Settings',
    logs: 'Audit Logs',
    reports: 'Reports & Analytics',
    welcome: 'Welcome to Afaq Arab Dashboard',
    welcomeSub: 'Manage listed properties, review engineering and contracting requests, assign tasks to supervisors, and track operational progress.',
    totalProperties: 'Total Properties',
    pendingRequests: 'Pending Requests',
    activeProjects: 'Active Projects',
    aiUsage: 'AI Token Consumption',
    quickAccess: 'Quick Access',
    addProperty: 'Add New Property',
    reviewRequests: 'Review Client Requests',
    aiSettings: 'AI Assistant Console',
    recentEvents: 'Recent Platform Events',
    loading: 'Loading...',
    themeLight: 'Light Mode',
    themeDark: 'Dark Mode',
    langEn: 'English',
    langAr: 'العربية',
    logout: 'Logout',
    admin: 'System Admin',
    themeColor: 'Accent Color',
    activePropertyCount: 'Properties Listed',
    pendingRequestCount: 'Pending Requests',
    activeProjectCount: 'Projects in Progress',
    aiTokensLabel: 'Tokens consumed via Gemini API',
    recentSystemLogs: 'Recent System Operations & Audit Logs',
    logAction: 'Action',
    logUser: 'User',
    logDate: 'Date',
    logDetails: 'Audit Log Details & Client IP',
    close: 'Close',
    recentProjectsTitle: 'Recent Active Projects Progress',
    recentRequestsTitle: 'Recent Pending Service Requests',
    projectName: 'Project / Request Name',
    progress: 'Progress',
    status: 'Status',
    viewAll: 'View All',
    noData: 'No data available currently.',
  },
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [lang, setLang] = useState<Lang>('ar');
  const [themeColor, setThemeColorState] = useState<ThemeColor>('gold');
  const [mounted, setMounted] = useState(false);

  // Global Dialog States
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    resolve?: (value: void | PromiseLike<void>) => void;
  } | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    message: string;
    title: string;
    resolve?: (value: boolean | PromiseLike<boolean>) => void;
  } | null>(null);

  useEffect(() => {
    // Load preference from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    const savedLang = localStorage.getItem('lang') as Lang;
    const savedColor = localStorage.getItem('themeColor') as ThemeColor;

    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      applyTheme('dark');
    }

    if (savedLang) {
      setLang(savedLang);
      applyLangDirection(savedLang);
    } else {
      applyLangDirection('ar');
    }

    if (savedColor) {
      setThemeColorState(savedColor);
      applyThemeColor(savedColor);
    } else {
      applyThemeColor('gold');
    }
    
    setMounted(true);
  }, []);

  const applyThemeColor = (color: ThemeColor) => {
    const root = window.document.documentElement;
    const themes = {
      gold: { primary: '#c29853', start: '#e5c07b', end: '#c29853' },
      emerald: { primary: '#10b981', start: '#34d399', end: '#059669' },
      blue: { primary: '#3b82f6', start: '#60a5fa', end: '#2563eb' },
      purple: { primary: '#8b5cf6', start: '#a78bfa', end: '#7c3aed' },
      orange: { primary: '#f97316', start: '#fb923c', end: '#ea580c' },
    };
    const t = themes[color] || themes.gold;
    root.style.setProperty('--primary', t.primary);
    root.style.setProperty('--primary-gradient-start', t.start);
    root.style.setProperty('--primary-gradient-end', t.end);
    root.style.setProperty('--dynamic-primary', t.primary);
    root.style.setProperty('--dynamic-primary-start', t.start);
    root.style.setProperty('--dynamic-primary-end', t.end);
  };

  const setThemeColor = (color: ThemeColor) => {
    setThemeColorState(color);
    localStorage.setItem('themeColor', color);
    applyThemeColor(color);
  };

  const applyTheme = (t: Theme) => {
    const root = window.document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  };

  const applyLangDirection = (l: Lang) => {
    const root = window.document.documentElement;
    root.dir = l === 'ar' ? 'rtl' : 'ltr';
    root.lang = l;
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    applyTheme(nextTheme);
  };

  const toggleLang = () => {
    const nextLang = lang === 'ar' ? 'en' : 'ar';
    setLang(nextLang);
    localStorage.setItem('lang', nextLang);
    applyLangDirection(nextLang);
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] || key;
  };

  // Promise-based Dialog Invokers
  const showAlert = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', title: string = '') => {
    return new Promise<void>((resolve) => {
      setAlertDialog({
        isOpen: true,
        message,
        type,
        title: title || (type === 'success' ? (lang === 'ar' ? 'نجاح' : 'Success') : type === 'error' ? (lang === 'ar' ? 'خطأ' : 'Error') : (lang === 'ar' ? 'تنبيه' : 'Alert')),
        resolve,
      });
    });
  };

  const showConfirm = (message: string, title: string = '') => {
    return new Promise<boolean>((resolve) => {
      setConfirmDialog({
        isOpen: true,
        message,
        title: title || (lang === 'ar' ? 'تأكيد العملية' : 'Confirm Action'),
        resolve,
      });
    });
  };

  // Prevent hydration flash
  if (!mounted) {
    return null;
  }

  const isRtl = lang === 'ar';
  const isDark = theme === 'dark';

  return (
    <AppContext.Provider value={{ theme, lang, themeColor, toggleTheme, toggleLang, setThemeColor, t, showAlert, showConfirm }}>
      {children}

      {/* ── Custom Global Alert Modal ── */}
      {alertDialog && alertDialog.isOpen && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className={`w-full max-w-sm rounded-2xl border p-6 text-center shadow-2xl scale-[1.02] transition-all duration-200 ${
            isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-800'
          }`}>
            <div className="text-4xl mb-3 select-none">
              {alertDialog.type === 'success' ? '✅' : alertDialog.type === 'error' ? '❌' : '⚠️'}
            </div>
            <h3 className="font-extrabold text-base mb-2">{alertDialog.title}</h3>
            <p className={`text-xs font-semibold leading-relaxed mb-5 opacity-90 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>{alertDialog.message}</p>
            <button
              onClick={() => {
                alertDialog.resolve?.();
                setAlertDialog(null);
              }}
              className="px-6 py-2.5 rounded-xl primary-gradient text-zinc-950 font-black text-xs hover:opacity-90 active:scale-[0.98] transition cursor-pointer min-w-[120px] shadow-md shadow-primary/25"
            >
              {isRtl ? 'موافق' : 'OK'}
            </button>
          </div>
        </div>
      )}

      {/* ── Custom Global Confirm Modal ── */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className={`w-full max-w-sm rounded-2xl border p-6 text-center shadow-2xl scale-[1.02] transition-all duration-200 ${
            isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-800'
          }`}>
            <div className="text-4xl mb-3 select-none">❓</div>
            <h3 className="font-extrabold text-base mb-2">{confirmDialog.title}</h3>
            <p className={`text-xs font-semibold leading-relaxed mb-5 opacity-90 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>{confirmDialog.message}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  confirmDialog.resolve?.(false);
                  setConfirmDialog(null);
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  isDark ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700' : 'border-zinc-250 text-zinc-550 hover:bg-zinc-50'
                }`}
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  confirmDialog.resolve?.(true);
                  setConfirmDialog(null);
                }}
                className="px-6 py-2.5 rounded-xl primary-gradient text-zinc-950 font-black text-xs hover:opacity-90 active:scale-[0.98] transition cursor-pointer shadow-md shadow-primary/25"
              >
                {isRtl ? 'تأكيد' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
