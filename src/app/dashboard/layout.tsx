'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { clearCookie } from '../../lib/api';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';

const MENU_ITEMS = [
  { path: '/dashboard', labelKey: 'dashboard', icon: '📊' },
  { path: '/dashboard/reports', labelKey: 'reports', icon: '📈' },
  
  // Properties Submenu
  { path: '/dashboard/properties', labelKey: 'propertiesList', icon: '🏢' },
  { path: '/dashboard/properties/types', labelKey: 'propertyTypes', icon: '🏷️' },
  { path: '/dashboard/properties/categories', labelKey: 'categoriesFeatures', icon: '🧩' },
  
  // Engineering & Contracting
  { path: '/dashboard/requests', labelKey: 'requests', icon: '📝' },
  { path: '/dashboard/projects', labelKey: 'projects', icon: '⚙️' },
  { path: '/dashboard/services', labelKey: 'services', icon: '🏗️' },
  
  // Community
  { path: '/dashboard/community', labelKey: 'community', icon: '🌐' },
  
  // Users & Admin Settings
  { path: '/dashboard/users', labelKey: 'users', icon: '👥' },
  { path: '/dashboard/taxonomies', labelKey: 'taxonomies', icon: '📑' },
  { path: '/dashboard/settings', labelKey: 'settings', icon: '🔧' },
  { path: '/dashboard/logs', labelKey: 'logs', icon: '📜' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { lang, theme, themeColor, toggleLang, toggleTheme, setThemeColor, t } = useApp();

  const handleLogout = () => {
    clearCookie('token');
    window.location.href = '/login';
  };

  const activeItem = MENU_ITEMS.find((item) => item.path === pathname);

  return (
    <div className={`h-screen flex overflow-hidden ${theme === 'dark' ? 'bg-[#09090b] text-[#f4f4f5]' : 'bg-zinc-50 text-zinc-800'}`}>
      
      {/* 1. Sidebar for Desktop */}
      <aside className={`hidden md:flex flex-col w-64 h-full ${theme === 'dark' ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200'} ${lang === 'ar' ? 'border-l' : 'border-r'} shrink-0`}>
        <div className={`h-16 flex items-center justify-between px-6 border-b ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg primary-gradient flex items-center justify-center text-zinc-950 font-bold text-sm">
              آفاق
            </div>
            <span className={`font-bold text-base ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>آفاق العرب</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-primary/15 text-primary border-primary ' + (lang === 'ar' ? 'border-r-2' : 'border-l-2')
                    : theme === 'dark'
                    ? 'text-zinc-400 hover:bg-zinc-800/20 hover:text-zinc-200'
                    : 'text-zinc-550 hover:bg-zinc-100 hover:text-zinc-800'
                }`}
              >
                <span>{item.icon}</span>
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        <div className={`p-4 border-t ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-950/15 hover:text-red-400 transition"
          >
            <span>🚪</span>
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
        ></div>
      )}

      {/* Sidebar for Mobile */}
      <aside
        className={`fixed inset-y-0 ${lang === 'ar' ? 'right-0' : 'left-0'} w-64 ${
          theme === 'dark' ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200'
        } ${lang === 'ar' ? 'border-l' : 'border-r'} z-50 transform md:hidden transition-transform duration-300 ${
          lang === 'ar'
            ? sidebarOpen ? 'translate-x-0' : 'translate-x-full'
            : sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={`h-16 flex items-center justify-between px-6 border-b ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg primary-gradient flex items-center justify-center text-zinc-950 font-bold text-sm">
              آفاق
            </div>
            <span className={`font-bold text-base ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>آفاق العرب</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-zinc-400 text-lg">
            ✕
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-primary/15 text-primary border-primary ' + (lang === 'ar' ? 'border-r-2' : 'border-l-2')
                    : theme === 'dark'
                    ? 'text-zinc-400 hover:bg-zinc-800/20 hover:text-zinc-200'
                    : 'text-zinc-550 hover:bg-zinc-100 hover:text-zinc-800'
                }`}
              >
                <span>{item.icon}</span>
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        <div className={`p-4 border-t ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'} absolute bottom-0 w-full`}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-950/15 hover:text-red-400 transition"
          >
            <span>🚪</span>
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Page Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
        {/* Topbar */}
        <header className={`h-16 flex items-center justify-between px-6 backdrop-blur-md border-b sticky top-0 z-30 ${
          theme === 'dark' ? 'bg-[#18181b]/70 border-zinc-800' : 'bg-white/80 border-zinc-200'
        }`}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 text-zinc-400 hover:text-zinc-200"
          >
            ☰
          </button>

          <div>
            <h2 className="font-bold text-base text-zinc-800 dark:text-zinc-100 hidden md:block">
              {activeItem ? t(activeItem.labelKey) : t('dashboard')}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Color Palette Selector */}
            <div className="flex items-center gap-1.5 border border-zinc-700/30 rounded-lg p-1 bg-zinc-800/20">
              {(['gold', 'emerald', 'blue', 'purple', 'orange'] as const).map((color) => {
                const colors = {
                  gold: 'bg-[#c29853]',
                  emerald: 'bg-[#10b981]',
                  blue: 'bg-[#3b82f6]',
                  purple: 'bg-[#8b5cf6]',
                  orange: 'bg-[#f97316]',
                };
                const labels = {
                  gold: lang === 'ar' ? 'ذهبي' : 'Gold',
                  emerald: lang === 'ar' ? 'زمردي' : 'Emerald',
                  blue: lang === 'ar' ? 'أزرق' : 'Blue',
                  purple: lang === 'ar' ? 'بنفسجي' : 'Purple',
                  orange: lang === 'ar' ? 'برتقالي' : 'Orange',
                };
                const active = themeColor === color;
                return (
                  <button
                    key={color}
                    onClick={() => setThemeColor(color)}
                    title={labels[color]}
                    className={`w-3.5 h-3.5 rounded-full border transition duration-150 cursor-pointer ${
                      colors[color]
                    } ${active ? 'border-white scale-125 ring-2 ring-primary/40' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-110'}`}
                  />
                );
              })}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-zinc-800/10 dark:hover:bg-zinc-850/50 text-zinc-450 hover:text-primary transition cursor-pointer"
              title={theme === 'dark' ? t('themeLight') : t('themeDark')}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="px-3 py-1.5 text-xs font-extrabold rounded-lg border border-zinc-700/50 hover:border-primary text-primary hover:bg-primary/10 transition cursor-pointer"
            >
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>

            <span className="text-xs text-zinc-400 hidden sm:inline-block">{t('admin')}</span>
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-200 shadow-sm text-sm">
              M
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 overflow-y-auto relative">{children}</main>
      </div>
    </div>
  );
}
