'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useApp } from '../../../context/AppContext';
import Link from 'next/link';

const ROLE_META: Record<string, { label: string; labelEn: string; icon: string; cls: string; dot: string; bg: string; border: string; color: string; bar: string }> = {
  SYSTEM_ADMIN: { label: 'مدير النظام',  labelEn: 'System Admin',  icon: '🔴', cls: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/60',         dot: 'bg-red-500',    bg: 'bg-red-50 dark:bg-red-500/10',       border: 'border-red-200 dark:border-red-500/20',    color: 'text-red-600 dark:text-red-400',    bar: 'bg-red-500' },
  ADMIN:        { label: 'مشرف',          labelEn: 'Admin',         icon: '🟠', cls: 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/60', dot: 'bg-orange-500',  bg: 'bg-orange-50 dark:bg-orange-500/10',  border: 'border-orange-200 dark:border-orange-500/20', color: 'text-orange-600 dark:text-orange-400', bar: 'bg-orange-500' },
  ENGINEER:     { label: 'مهندس',         labelEn: 'Engineer',      icon: '🔵', cls: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60',         dot: 'bg-blue-500',   bg: 'bg-blue-50 dark:bg-blue-500/10',      border: 'border-blue-200 dark:border-blue-500/20',   color: 'text-blue-600 dark:text-blue-400',   bar: 'bg-blue-500' },
  CONTRACTOR:   { label: 'مقاول',         labelEn: 'Contractor',    icon: '🟣', cls: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/60', dot: 'bg-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10',  border: 'border-purple-200 dark:border-purple-500/20', color: 'text-purple-600 dark:text-purple-400', bar: 'bg-purple-500' },
  CUSTOMER:     { label: 'عميل',          labelEn: 'Customer',      icon: '🟢', cls: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60', dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', color: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' },
};

function RoleBadge({ roleName, roleNameAr, lang }: { roleName: string; roleNameAr: string; lang: string }) {
  const m = ROLE_META[roleName];
  if (!m) return <span className="text-xs text-zinc-400">{roleNameAr}</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${m.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {lang === 'ar' ? m.label : m.labelEn}
    </span>
  );
}

function UserAvatar({
  name,
  roleName,
  profileImage,
  onClick,
}: {
  name: string;
  roleName: string;
  profileImage?: string | null;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const m = ROLE_META[roleName];
  const initials = name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '??';
  const [imgErr, setImgErr] = useState(false);

  if (profileImage && !imgErr) {
    return (
      <div
        onClick={onClick}
        className={`w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700 shadow-sm relative group ${
          onClick ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 transition' : ''
        }`}
        title={onClick ? 'عرض الصورة الشخصية' : name}
      >
        <img
          src={profileImage}
          alt={name}
          className="w-full h-full object-cover transition group-hover:scale-110"
          onError={() => setImgErr(true)}
        />
        {onClick && (
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
            <span className="text-white text-[10px]">👁️</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 border ${
        m ? `${m.bg} ${m.border} ${m.color}` : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      {initials}
    </div>
  );
}

export default function UsersPage() {
  const { lang, theme, showAlert, showConfirm } = useApp();
  const isRtl = lang === 'ar';

  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterRole, setFilterRole] = useState('ALL');
  const [search, setSearch] = useState('');

  const [selected, setSelected] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [avatarModalUser, setAvatarModalUser] = useState<any | null>(null);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    showAlert(isRtl ? 'تم نسخ رابط الصورة إلى الحافظة! 📋' : 'Image URL copied to clipboard! 📋', 'success');
  };
  const DEFAULT_QUALIFICATION = 'بكالوريوس هندسة مدنية - جامعة ذمار (2011)';

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', roleId: '',
    specialization: isRtl ? 'تصميم معماري' : 'Architectural Design',
    experienceYears: 5, bio: '', companyName: '',
    qualifications: [DEFAULT_QUALIFICATION] as string[],
    newQualification: '',
  });

  async function loadData() {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.allSettled([api.get('/users'), api.get('/users/roles')]);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.users || []);
      if (rolesRes.status === 'fulfilled') {
        setRoles(rolesRes.value || []);
        if (rolesRes.value.length > 0) setForm(f => ({ ...f, roleId: rolesRes.value[0].id }));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const selectedRoleObj = roles.find(r => r.id === form.roleId);
  const selectedRoleName = selectedRoleObj?.name || '';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { name: form.name, email: form.email, phone: form.phone, password: form.password, roleId: form.roleId };
      if (selectedRoleName === 'ENGINEER') {
        const quals = [
          ...form.qualifications.map(q => q.trim()).filter(Boolean),
          ...(form.newQualification.trim() ? [form.newQualification.trim()] : []),
        ];
        payload.engineerDetails = {
          specialization: form.specialization,
          experienceYears: Number(form.experienceYears),
          bio: form.bio,
          qualifications: quals.length > 0 ? quals : [DEFAULT_QUALIFICATION],
        };
      } else if (selectedRoleName === 'CONTRACTOR') {
        payload.contractorDetails = {
          companyName: form.companyName,
          experienceYears: Number(form.experienceYears),
          bio: form.bio,
        };
      }
      await api.post('/users', payload);
      showAlert(isRtl ? 'تم إضافة المستخدم بنجاح' : 'User added successfully', 'success');
      setShowModal(false);
      setForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        roleId: roles[0]?.id || '',
        specialization: isRtl ? 'تصميم معماري' : 'Architectural Design',
        experienceYears: 5,
        bio: '',
        companyName: '',
        qualifications: [DEFAULT_QUALIFICATION],
        newQualification: '',
      });
      loadData();
    } catch (err: any) {
      showAlert(err?.message || (isRtl ? 'فشلت العملية.' : 'Operation failed.'), 'error');
    } finally { setSaving(false); }
  };

  const handleToggleStatus = async (targetUser: any) => {
    const isSuspended = targetUser.status === 'SUSPENDED';
    const actionText = isSuspended
      ? (isRtl ? `تنشيط حساب "${targetUser.name}"؟` : `activate account of "${targetUser.name}"?`)
      : (isRtl ? `إيقاف وتجميد حساب "${targetUser.name}"؟ سيتم منع المستخدم من تسجيل الدخول واستخدام التطبيق.` : `suspend account of "${targetUser.name}"? The user will be blocked from logging in.`);

    const confirmed = await showConfirm(
      isRtl ? (isSuspended ? 'تنشيط الحساب' : 'إيقاف الحساب') : (isSuspended ? 'Activate Account' : 'Suspend Account'),
      actionText
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      const endpoint = isSuspended ? `/users/${targetUser.id}/activate` : `/users/${targetUser.id}/suspend`;
      await api.patch(endpoint, {});
      showAlert(
        isRtl
          ? (isSuspended ? 'تم تنشيط الحساب بنجاح' : 'تم إيقاف الحساب بنجاح')
          : (isSuspended ? 'Account activated successfully' : 'Account suspended successfully'),
        'success'
      );
      loadData();
      if (selected?.id === targetUser.id) {
        setSelected((prev: any) => ({ ...prev, status: isSuspended ? 'ACTIVE' : 'SUSPENDED' }));
      }
    } catch (err: any) {
      showAlert(err?.message || (isRtl ? 'فشلت العملية' : 'Operation failed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (targetUser: any) => {
    const confirmed = await showConfirm(
      isRtl ? 'حذف المستخدم نهائياً' : 'Delete User Permanently',
      isRtl
        ? `تحذير: هل أنت متأكد من حذف المستخدم "${targetUser.name}"؟ سيتم حذف حسابه وكافة الملفات والبيانات التابعة له نهائياً من قاعدة البيانات ولا يمكن التراجع.`
        : `Warning: Are you sure you want to permanently delete "${targetUser.name}"? All associated data will be removed.`
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      await api.delete(`/users/${targetUser.id}`);
      showAlert(isRtl ? 'تم حذف المستخدم نهائياً بنجاح' : 'User deleted permanently', 'success');
      if (selected?.id === targetUser.id) setSelected(null);
      loadData();
    } catch (err: any) {
      showAlert(err?.message || (isRtl ? 'فشل حذف المستخدم' : 'Failed to delete user'), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Count per role
  const roleCounts: Record<string, number> = {};
  users.forEach(u => { const rn = u.role?.name || 'OTHER'; roleCounts[rn] = (roleCounts[rn] || 0) + 1; });

  const filtered = users.filter(u => {
    const matchRole = filterRole === 'ALL' || u.role?.name === filterRole;
    const q = search.toLowerCase();
    const matchSearch = !q || (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.phone || '').toLowerCase().includes(q);
    return matchRole && matchSearch;
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
          <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{isRtl ? 'جاري تحميل المستخدمين...' : 'Loading users...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isRtl ? 'text-right' : 'text-left'}`}>

      {/* ── Header ── */}
      <div className={`relative rounded-2xl overflow-hidden border p-6 ${
        theme === 'dark' ? 'bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800/60 border-zinc-800/80' : 'bg-gradient-to-br from-white via-zinc-50 to-indigo-50/30 border-zinc-200'
      }`}>
        <div className="absolute top-0 right-0 w-56 h-28 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-20 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-2">
              <span className="text-sm">👥</span>
              <span className="text-[11px] font-bold text-primary tracking-wide uppercase">{isRtl ? 'إدارة المستخدمين' : 'User Management'}</span>
            </div>
            <h1 className={`text-2xl font-black mb-1 ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
              {isRtl ? 'المستخدمون والفرق' : 'Users & Teams'}
            </h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {isRtl ? `${users.length} مستخدم — ${roleCounts['ENGINEER'] || 0} مهندس · ${roleCounts['CONTRACTOR'] || 0} مقاول · ${roleCounts['CUSTOMER'] || 0} عميل` : `${users.length} users — ${roleCounts['ENGINEER'] || 0} engineers · ${roleCounts['CONTRACTOR'] || 0} contractors`}
            </p>
          </div>
          <button onClick={() => setShowModal(true)} className="px-5 py-2.5 rounded-xl primary-gradient text-zinc-950 font-bold text-sm hover:opacity-90 transition shadow-md flex items-center gap-2">
            <span>+</span>
            <span>{isRtl ? 'إضافة مستخدم' : 'Add User'}</span>
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { key: 'ALL',         label: isRtl ? 'الكل'      : 'All',         icon: '👥', count: users.length,                color: theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700', bg: theme === 'dark' ? 'bg-zinc-800/60' : 'bg-zinc-100', border: theme === 'dark' ? 'border-zinc-700' : 'border-zinc-200' },
          { key: 'ENGINEER',    label: isRtl ? 'مهندسون'   : 'Engineers',   icon: '👷', count: roleCounts['ENGINEER'] || 0,   color: ROLE_META.ENGINEER.color,   bg: ROLE_META.ENGINEER.bg,   border: ROLE_META.ENGINEER.border },
          { key: 'CONTRACTOR',  label: isRtl ? 'مقاولون'   : 'Contractors', icon: '🏗️', count: roleCounts['CONTRACTOR'] || 0, color: ROLE_META.CONTRACTOR.color, bg: ROLE_META.CONTRACTOR.bg, border: ROLE_META.CONTRACTOR.border },
          { key: 'CUSTOMER',    label: isRtl ? 'عملاء'     : 'Customers',   icon: '🧑‍💼', count: roleCounts['CUSTOMER'] || 0,   color: ROLE_META.CUSTOMER.color,   bg: ROLE_META.CUSTOMER.bg,   border: ROLE_META.CUSTOMER.border },
          { key: 'ADMIN',       label: isRtl ? 'مشرفون'    : 'Admins',      icon: '🛡️', count: (roleCounts['ADMIN'] || 0) + (roleCounts['SYSTEM_ADMIN'] || 0), color: ROLE_META.ADMIN.color, bg: ROLE_META.ADMIN.bg, border: ROLE_META.ADMIN.border },
        ].map(s => (
          <button key={s.key} onClick={() => setFilterRole(filterRole === s.key ? 'ALL' : s.key)}
            className={`rounded-2xl border p-3 text-center transition-all duration-200 cursor-pointer ${
              filterRole === s.key ? `${s.bg} ${s.border} scale-[1.02] shadow-md` : theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
            }`}>
            <div className="text-xl mb-1">{s.icon}</div>
            <div className={`text-xl font-black ${filterRole === s.key ? s.color : theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>{s.count}</div>
            <div className={`text-[9px] font-bold mt-0.5 ${filterRole === s.key ? s.color : theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* ── Filter + Search Bar ── */}
      <div className={`${card} px-5 py-4 flex flex-wrap gap-3 items-center`}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={isRtl ? 'بحث بالاسم أو الإيميل أو الهاتف...' : 'Search by name, email or phone...'} className={`${inputCls} max-w-xs`} />
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'ENGINEER', 'CONTRACTOR', 'CUSTOMER', 'ADMIN'].map(r => (
            <button key={r} onClick={() => setFilterRole(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                filterRole === r ? 'bg-primary text-zinc-950 border-primary' : theme === 'dark' ? 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-primary/50' : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-primary/50'
              }`}>
              {r === 'ALL' ? (isRtl ? 'الكل' : 'All') : r === 'ENGINEER' ? (isRtl ? 'مهندسون' : 'Engineers') : r === 'CONTRACTOR' ? (isRtl ? 'مقاولون' : 'Contractors') : r === 'CUSTOMER' ? (isRtl ? 'عملاء' : 'Customers') : (isRtl ? 'مشرفون' : 'Admins')}
            </button>
          ))}
        </div>
        <span className={`ms-auto text-xs font-semibold ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{filtered.length} {isRtl ? 'مستخدم' : 'users'}</span>
      </div>

      {/* ── Two-pane Layout ── */}
      <div className="flex gap-5">

        {/* Users Table */}
        <div className={`flex-1 min-w-0 ${card} overflow-hidden`}>
          <div className={`flex items-center justify-between px-5 py-3.5 border-b ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-primary" />
              <span className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                👥 {isRtl ? 'قائمة المستخدمين' : 'Users List'}
              </span>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20`}>
              {filtered.length} {isRtl ? 'مستخدم' : 'users'}
            </span>
          </div>

          <table className={`w-full border-collapse text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className={`text-[11px] font-bold uppercase tracking-wider border-b ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 text-zinc-500' : 'bg-zinc-50/80 border-zinc-200 text-zinc-400'}`}>
                <th className="px-5 py-3">{isRtl ? 'المستخدم' : 'User'}</th>
                <th className="px-5 py-3 hidden md:table-cell">{isRtl ? 'التواصل' : 'Contact'}</th>
                <th className="px-5 py-3">{isRtl ? 'الدور' : 'Role'}</th>
                <th className="px-5 py-3">{isRtl ? 'الحالة' : 'Status'}</th>
                <th className="px-5 py-3 hidden lg:table-cell">{isRtl ? 'الملف المهني' : 'Profile'}</th>
                <th className="px-5 py-3 hidden lg:table-cell">{isRtl ? 'تاريخ الانضمام' : 'Joined'}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-zinc-800/60' : 'divide-zinc-100'}`}>
              {filtered.map(user => {
                const isActive = selected?.id === user.id;
                const isSuspended = user.status === 'SUSPENDED';
                const rm = ROLE_META[user.role?.name];
                return (
                  <tr key={user.id} onClick={() => setSelected(isActive ? null : user)}
                    className={`cursor-pointer transition-colors duration-150 ${
                      isActive
                        ? theme === 'dark' ? 'bg-primary/8 border-l-2 border-primary' : 'bg-amber-50/60 border-l-2 border-primary'
                        : theme === 'dark' ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-50'
                    }`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={user.name}
                          roleName={user.role?.name}
                          profileImage={user.profileImage}
                          onClick={(e) => {
                            if (user.profileImage) {
                              e.stopPropagation();
                              setAvatarModalUser(user);
                            }
                          }}
                        />
                        <div>
                          <div className={`font-bold text-xs leading-tight ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>{user.name}</div>
                          <div className={`text-[10px] font-mono mt-0.5 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <div className={`text-xs font-mono ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{user.phone || '—'}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <RoleBadge roleName={user.role?.name} roleNameAr={user.role?.nameAr} lang={lang} />
                    </td>
                    <td className="px-5 py-3.5">
                      {isSuspended ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          {isRtl ? 'موقوف' : 'Suspended'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {isRtl ? 'نشط' : 'Active'}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      {user.role?.name === 'ENGINEER' && user.engineerProfile ? (
                        <div>
                          <div className={`text-[10px] font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>🔧 {user.engineerProfile.specialization}</div>
                          <div className={`text-[10px] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{user.engineerProfile.experienceYears} {isRtl ? 'سنوات خبرة' : 'yrs exp'}</div>
                        </div>
                      ) : user.role?.name === 'CONTRACTOR' && user.contractorProfile ? (
                        <div>
                          <div className={`text-[10px] font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>🏗️ {user.contractorProfile.companyName || (isRtl ? 'مستقل' : 'Independent')}</div>
                          <div className={`text-[10px] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{user.contractorProfile.experienceYears} {isRtl ? 'سنوات' : 'yrs'}</div>
                        </div>
                      ) : (
                        <span className={`text-[10px] italic ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className={`text-[10px] font-mono ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{new Date(user.createdAt).toLocaleDateString()}</span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className={`py-14 text-center text-sm italic ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  {isRtl ? 'لا يوجد مستخدمون مطابقون.' : 'No users match the current filter.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Detail Side Panel ── */}
        {selected && (
          <div className={`w-72 xl:w-80 shrink-0 ${card} flex flex-col overflow-hidden max-h-[calc(100vh-10rem)] sticky top-24`}>
            <div className={`px-5 py-4 border-b shrink-0 ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-5 rounded-full ${ROLE_META[selected.role?.name]?.bar ?? 'bg-primary'}`} />
                  <span className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>{isRtl ? 'تفاصيل المستخدم' : 'User Details'}</span>
                </div>
                <button onClick={() => setSelected(null)} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer transition ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500'}`} aria-label={isRtl ? 'إغلاق' : 'Close'}>✕</button>
              </div>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Avatar + name + role */}
              <div className={`p-4 rounded-xl border flex items-center gap-3.5 ${ROLE_META[selected.role?.name]?.bg ?? ''} ${ROLE_META[selected.role?.name]?.border ?? 'border-zinc-200 dark:border-zinc-700'}`}>
                {selected.profileImage ? (
                  <button
                    type="button"
                    onClick={() => setAvatarModalUser(selected)}
                    className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border-2 border-primary/40 shadow-md group cursor-pointer"
                    title={isRtl ? 'عرض الصورة الشخصية بالكامل' : 'View full profile photo'}
                  >
                    <img
                      src={selected.profileImage}
                      alt={selected.name}
                      className="w-full h-full object-cover transition group-hover:scale-110"
                      onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <span className="text-white text-xs">🔍</span>
                    </div>
                  </button>
                ) : (
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-extrabold border ${
                    ROLE_META[selected.role?.name] ? `${ROLE_META[selected.role?.name].bg} ${ROLE_META[selected.role?.name].border} ${ROLE_META[selected.role?.name].color}` : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
                  }`}>
                    {selected.name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className={`font-extrabold text-sm truncate ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>{selected.name}</div>
                  <div className="mt-1">
                    <RoleBadge roleName={selected.role?.name} roleNameAr={selected.role?.nameAr} lang={lang} />
                  </div>
                  {selected.profileImage && (
                    <button
                      type="button"
                      onClick={() => setAvatarModalUser(selected)}
                      className="text-[10px] font-bold text-primary hover:underline mt-1.5 flex items-center gap-1 cursor-pointer"
                    >
                      <span>👁️</span>
                      <span>{isRtl ? 'عرض الصورة الشخصية' : 'View full photo'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Contact info */}
              <div className={`p-3 rounded-xl border space-y-2 ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                <div>
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-0.5">{isRtl ? 'البريد الإلكتروني' : 'Email'}</span>
                  <span className={`text-xs font-mono ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{selected.email}</span>
                </div>
                <div className={`pt-2 border-t ${theme === 'dark' ? 'border-zinc-700/60' : 'border-zinc-200'}`}>
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-0.5">{isRtl ? 'الهاتف' : 'Phone'}</span>
                  <span className={`text-xs font-mono ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{selected.phone || '—'}</span>
                </div>
              </div>

              {/* Engineer profile */}
              {selected.role?.name === 'ENGINEER' && selected.engineerProfile && (
                <div className={`p-3 rounded-xl border space-y-2 ${theme === 'dark' ? 'bg-blue-950/20 border-blue-800/40' : 'bg-blue-50 border-blue-200'}`}>
                  <span className="block text-[10px] font-bold text-blue-500 uppercase">{isRtl ? 'الملف المهني — مهندس' : 'Engineer Profile'}</span>
                  <div>
                    <span className="block text-[10px] text-zinc-500">{isRtl ? 'التخصص' : 'Specialization'}</span>
                    <span className={`text-xs font-bold ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>{selected.engineerProfile.specialization}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-500">{isRtl ? 'سنوات الخبرة' : 'Experience'}</span>
                    <span className={`text-xs font-bold ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>{selected.engineerProfile.experienceYears} {isRtl ? 'سنة' : 'years'}</span>
                  </div>
                  {selected.engineerProfile.bio && (
                    <div>
                      <span className="block text-[10px] text-zinc-500">{isRtl ? 'النبذة' : 'Bio'}</span>
                      <p className={`text-[11px] leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{selected.engineerProfile.bio}</p>
                    </div>
                  )}
                  <div>
                    <span className="block text-[10px] text-zinc-500 mb-1">{isRtl ? 'المؤهلات العلمية والاعتمادات' : 'Qualifications'}</span>
                    {Array.isArray(selected.engineerProfile.qualifications) && selected.engineerProfile.qualifications.length > 0 ? (
                      <ul className="space-y-1">
                        {selected.engineerProfile.qualifications.map((q: string, idx: number) => (
                          <li key={idx} className={`text-[11px] font-semibold flex items-start gap-1.5 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                            <span className="text-emerald-500 mt-0.5">🎓</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-[11px] italic text-zinc-500">{isRtl ? 'لا توجد مؤهلات مسجلة' : 'No qualifications listed'}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Contractor profile */}
              {selected.role?.name === 'CONTRACTOR' && selected.contractorProfile && (
                <div className={`p-3 rounded-xl border space-y-2 ${theme === 'dark' ? 'bg-purple-950/20 border-purple-800/40' : 'bg-purple-50 border-purple-200'}`}>
                  <span className="block text-[10px] font-bold text-purple-500 uppercase">{isRtl ? 'الملف المهني — مقاول' : 'Contractor Profile'}</span>
                  <div>
                    <span className="block text-[10px] text-zinc-500">{isRtl ? 'الشركة' : 'Company'}</span>
                    <span className={`text-xs font-bold ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>{selected.contractorProfile.companyName || (isRtl ? 'مستقل' : 'Independent')}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-500">{isRtl ? 'سنوات الخبرة' : 'Experience'}</span>
                    <span className={`text-xs font-bold ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>{selected.contractorProfile.experienceYears} {isRtl ? 'سنة' : 'years'}</span>
                  </div>
                  {selected.contractorProfile.bio && (
                    <div>
                      <span className="block text-[10px] text-zinc-500">{isRtl ? 'النبذة' : 'Bio'}</span>
                      <p className={`text-[11px] leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{selected.contractorProfile.bio}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Join date */}
              <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                <span className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isRtl ? 'تاريخ الانضمام' : 'Joined'}</span>
                <span className={`text-xs font-mono ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{new Date(selected.createdAt).toLocaleString()}</span>
              </div>

              {/* Status and Actions Card */}
              <div className={`p-3.5 rounded-xl border space-y-3 ${theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700/70' : 'bg-zinc-100/70 border-zinc-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">{isRtl ? 'حالة الحساب' : 'Account Status'}</span>
                  {selected.status === 'SUSPENDED' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500/10 text-red-500 border border-red-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      {isRtl ? 'موقوف مؤقتاً' : 'Suspended'}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {isRtl ? 'نشط ويعمل' : 'Active'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-700/60">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleStatus(selected); }}
                    disabled={saving}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                      selected.status === 'SUSPENDED'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    {selected.status === 'SUSPENDED' ? (
                      <><span>▶️</span> {isRtl ? 'تنشيط' : 'Activate'}</>
                    ) : (
                      <><span>⏸️</span> {isRtl ? 'إيقاف' : 'Suspend'}</>
                    )}
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteUser(selected); }}
                    disabled={saving}
                    className="py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border border-red-300 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 cursor-pointer"
                  >
                    <span>🗑️</span> {isRtl ? 'حذف' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Link Action */}
            {(selected.role?.name === 'ENGINEER' || selected.role?.name === 'CONTRACTOR') && (
              <div className={`p-4 border-t shrink-0 ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900/60' : 'border-zinc-200 bg-zinc-50'}`}>
                <Link href={`/dashboard/users/${selected.id}`} className="w-full py-2.5 rounded-xl text-xs font-bold primary-gradient text-zinc-950 hover:opacity-90 transition flex items-center justify-center gap-2 shadow-md">
                  📁 {isRtl ? 'عرض وإدارة البروفايل بالكامل' : 'View & Manage Full Profile'}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Create User Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col ${isRtl ? 'text-right' : 'text-left'} ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-1 h-5 rounded-full transition-colors ${ROLE_META[selectedRoleName]?.bar ?? 'bg-primary'}`} />
                <div>
                  <h3 className={`font-extrabold text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                    {isRtl ? 'إضافة مستخدم جديد' : 'Add New User'}
                  </h3>
                  <p className={`text-[10px] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{isRtl ? '* الحقول المطلوبة' : '* Required fields'}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer transition ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500'}`} aria-label={isRtl ? 'إغلاق' : 'Close'}>✕</button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Name */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'الاسم الكامل *' : 'Full Name *'}</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'البريد الإلكتروني *' : 'Email *'}</label>
                  <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} dir="ltr" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'رقم الهاتف *' : 'Phone *'}</label>
                  <input type="text" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} dir="ltr" />
                </div>
              </div>

              {/* Password + Role */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'كلمة المرور *' : 'Password *'}</label>
                  <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={inputCls} dir="ltr" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'الدور الوظيفي *' : 'Role *'}</label>
                  <select value={form.roleId} onChange={e => setForm({ ...form, roleId: e.target.value })} className={inputCls}>
                    {roles.map(r => <option key={r.id} value={r.id}>{isRtl ? r.nameAr : (r.name || r.nameAr)}</option>)}
                  </select>
                </div>
              </div>

              {/* Engineer Profile */}
              {selectedRoleName === 'ENGINEER' && (
                <div className={`p-4 rounded-xl border space-y-4 ${theme === 'dark' ? 'bg-blue-950/20 border-blue-800/40' : 'bg-blue-50 border-blue-200'}`}>
                  <h4 className="text-[11px] font-extrabold text-blue-500 uppercase">👷 {isRtl ? 'الملف المهني — مهندس' : 'Engineer Profile'}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'التخصص *' : 'Specialization *'}</label>
                      <input required value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'سنوات الخبرة *' : 'Exp. Years *'}</label>
                      <input type="number" required min="0" value={form.experienceYears} onChange={e => setForm({ ...form, experienceYears: Number(e.target.value) })} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'النبذة المهنية' : 'Bio'}</label>
                    <textarea rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} className={inputCls} />
                  </div>

                  {/* Qualifications Editor inside Add Engineer Modal */}
                  <div className="space-y-2 pt-2 border-t border-blue-500/20">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-zinc-500 uppercase">
                        🎓 {isRtl ? 'المؤهلات العلمية والاعتمادات' : 'Academic Qualifications'}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (!form.qualifications.includes(DEFAULT_QUALIFICATION)) {
                            setForm({ ...form, qualifications: [...form.qualifications, DEFAULT_QUALIFICATION] });
                          }
                        }}
                        className="text-[10px] font-bold text-blue-500 hover:underline cursor-pointer"
                      >
                        {isRtl ? '+ إدراج المؤهل الافتراضي' : '+ Insert Default'}
                      </button>
                    </div>

                    <div className="space-y-2">
                      {form.qualifications.map((q, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            value={q}
                            onChange={e => {
                              const next = [...form.qualifications];
                              next[idx] = e.target.value;
                              setForm({ ...form, qualifications: next });
                            }}
                            placeholder={DEFAULT_QUALIFICATION}
                            className={inputCls}
                          />
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, qualifications: form.qualifications.filter((_, i) => i !== idx) })}
                            className="px-2.5 py-2 rounded-lg text-xs font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 cursor-pointer shrink-0"
                            title={isRtl ? 'حذف' : 'Remove'}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        value={form.newQualification}
                        onChange={e => setForm({ ...form, newQualification: e.target.value })}
                        placeholder={isRtl ? 'إضافة مؤهل أو اعتماد إضافي...' : 'Add another qualification...'}
                        className={inputCls}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (form.newQualification.trim()) {
                              setForm({
                                ...form,
                                qualifications: [...form.qualifications, form.newQualification.trim()],
                                newQualification: '',
                              });
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (form.newQualification.trim()) {
                            setForm({
                              ...form,
                              qualifications: [...form.qualifications, form.newQualification.trim()],
                              newQualification: '',
                            });
                          }
                        }}
                        className="px-3 py-2 rounded-lg text-xs font-bold bg-blue-500/15 text-blue-500 hover:bg-blue-500/25 border border-blue-500/30 cursor-pointer shrink-0"
                      >
                        + {isRtl ? 'إضافة' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Contractor Profile */}
              {selectedRoleName === 'CONTRACTOR' && (
                <div className={`p-4 rounded-xl border space-y-4 ${theme === 'dark' ? 'bg-purple-950/20 border-purple-800/40' : 'bg-purple-50 border-purple-200'}`}>
                  <h4 className="text-[11px] font-extrabold text-purple-500 uppercase">🏗️ {isRtl ? 'ملف المقاولات' : 'Contractor Profile'}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'اسم الشركة' : 'Company Name'}</label>
                      <input value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} className={inputCls} placeholder={isRtl ? 'اختياري' : 'Optional'} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'سنوات الخبرة *' : 'Exp. Years *'}</label>
                      <input type="number" required min="0" value={form.experienceYears} onChange={e => setForm({ ...form, experienceYears: Number(e.target.value) })} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'السيرة الذاتية وخلفية الأعمال' : 'Bio & Work Background'}</label>
                    <textarea rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} className={inputCls} />
                  </div>
                </div>
              )}

              <div className={`flex justify-end gap-3 -mx-6 -mb-6 px-6 py-4 border-t ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
                <button type="button" onClick={() => setShowModal(false)} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${theme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'}`}>
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl primary-gradient text-zinc-950 font-bold text-xs hover:opacity-90 transition disabled:opacity-60 cursor-pointer flex items-center gap-2">
                  {saving && <span className="w-3.5 h-3.5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />}
                  {isRtl ? 'حفظ الحساب' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── User Avatar Lightbox Modal ── */}
      {avatarModalUser && avatarModalUser.profileImage && (
        <div
          className="fixed inset-0 bg-black/85 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setAvatarModalUser(null)}
        >
          <div
            className={`relative max-w-md w-full rounded-2xl border overflow-hidden shadow-2xl ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
            }`}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`px-5 py-3.5 border-b flex items-center justify-between ${
              theme === 'dark' ? 'bg-zinc-900/90 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center gap-2.5 truncate">
                <span className="text-sm">👤</span>
                <div className="truncate">
                  <div className={`text-xs font-bold truncate ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    {avatarModalUser.name}
                  </div>
                  <div className={`text-[10px] font-mono ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {avatarModalUser.email}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAvatarModalUser(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Image Preview */}
            <div className="p-6 flex flex-col items-center justify-center bg-black/5 dark:bg-black/40">
              <div className="relative w-64 h-64 rounded-2xl overflow-hidden border-2 border-primary/40 shadow-xl">
                <img
                  src={avatarModalUser.profileImage}
                  alt={avatarModalUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className={`px-5 py-3.5 border-t flex items-center justify-between gap-2 ${
              theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center gap-1.5">
                <RoleBadge
                  roleName={avatarModalUser.role?.name}
                  roleNameAr={avatarModalUser.role?.nameAr}
                  lang={lang}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyUrl(avatarModalUser.profileImage)}
                  className="px-3 py-1.5 text-xs rounded-lg font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition cursor-pointer flex items-center gap-1"
                >
                  📋 {isRtl ? 'نسخ الرابط' : 'Copy URL'}
                </button>
                <a
                  href={avatarModalUser.profileImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs rounded-lg font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20 transition cursor-pointer flex items-center gap-1"
                >
                  ↗️ {isRtl ? 'فتح الرابط' : 'Open'}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
