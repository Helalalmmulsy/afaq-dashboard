'use client';

import { useEffect, useState, use } from 'react';
import { api } from '../../../../lib/api';
import { useApp } from '../../../../context/AppContext';
import Link from 'next/link';

interface UserProfilePageProps {
  params: Promise<{ id: string }>;
}

interface ProjectItem {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  image: string;
}

interface TimelineItem {
  id: string;
  period: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
}

interface ReviewItem {
  id: string;
  authorAr: string;
  authorEn: string;
  rating: number;
  commentAr: string;
  commentEn: string;
  date: string;
}

interface CertificateItem {
  title: string;
  image?: string;
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  const { id } = use(params);
  const { lang, theme, showAlert, showConfirm } = useApp();
  const isRtl = lang === 'ar';
  const isDark = theme === 'dark';

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'projects' | 'experiences' | 'certifications' | 'reviews'>('about');
  
  // Modals visibility
  const [showEditBasicModal, setShowEditBasicModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedCertImage, setSelectedCertImage] = useState<string | null>(null); // For fullscreen image preview

  // Editing items state (null means creating new)
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [editingTimeline, setEditingTimeline] = useState<TimelineItem | null>(null);

  // Form states
  const [basicForm, setBasicForm] = useState({
    name: '',
    phone: '',
    email: '',
    profileImage: '',
    status: 'ACTIVE',
    specialization: '',
    experienceYears: 0,
    bio: '',
    city: '',
    roleTitle: '',
  });

  const [projectForm, setProjectForm] = useState({
    titleAr: '',
    titleEn: '',
    descAr: '',
    descEn: '',
    image: '',
  });

  const [timelineForm, setTimelineForm] = useState({
    period: '',
    titleAr: '',
    titleEn: '',
    descAr: '',
    descEn: '',
  });

  const [certForm, setCertForm] = useState({
    title: '',
    image: '',
  });

  const [skillInput, setSkillInput] = useState('');

  const [reviewForm, setReviewForm] = useState({
    authorAr: '',
    authorEn: '',
    rating: 5,
    commentAr: '',
    commentEn: '',
  });

  // Persistent Custom Data (saved in LocalStorage to persist changes properly)
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [city, setCity] = useState('');
  const [roleTitle, setRoleTitle] = useState('');

  // Default values to seed if no custom data exists in LocalStorage
  const defaultProjects: ProjectItem[] = [
    { id: 'p1', titleAr: 'برج آفاق السكني', titleEn: 'Afaq Residential Tower', descAr: 'تصميم وإشراف على هيكل خرساني مكون من 12 طابقاً في وسط ذمار.', descEn: 'Design and supervision of a 12-story concrete structure in central Dhamar.', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=400' },
    { id: 'p2', titleAr: 'فيلا السلال الحديثة', titleEn: 'Modern Al-Sallal Villa', descAr: 'تصميم معماري خارجي وداخلي متكامل بأسلوب المودرن مع حديقة ومسبح.', descEn: 'Integrated modern architectural exterior & interior design with garden & pool.', image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=400' },
    { id: 'p3', titleAr: 'مركز ذمار التجاري', titleEn: 'Dhamar Shopping Center', descAr: 'تخطيط وتنسيق الموقع العام والإشراف على أعمال واجهات الكلادينج والزجاج.', descEn: 'Site planning, coordination, and supervising cladding & glass facade works.', image: 'https://images.unsplash.com/photo-1555637138-afc874e732c1?q=80&w=400' },
  ];

  const defaultTimeline: TimelineItem[] = [
    { id: 't1', period: '2022 - Present', titleAr: 'مهندس معماري رئيسي | شركة آفاق العرب', titleEn: 'Chief Architect | Smart Arab Horizons', descAr: 'قيادة فريق التصميم والإشراف على المشاريع الحضرية والسكنية.', descEn: 'Leading design team and supervising urban and residential projects.' },
    { id: 't2', period: '2018 - 2022', titleAr: 'مهندس مصمم | مكتب الإعمار الهندسي', titleEn: 'Design Engineer | Al-Emar Engineering Office', descAr: 'تصميم المخططات الهندسية وحساب الكميات لمشاريع البنية التحتية.', descEn: 'Creating engineering plans and quantity surveying for infrastructure.' },
    { id: 't3', period: '2015 - 2018', titleAr: 'مهندس موقع | شركة المقاولات الوطنية', titleEn: 'Site Engineer | National Contracting Company', descAr: 'متابعة تنفيذ الأعمال الإنشائية في الموقع ومطابقة المخططات.', descEn: 'Monitoring structural site implementation and alignment with drawings.' },
  ];

  const defaultReviews: ReviewItem[] = [
    { id: 'r1', authorAr: 'الشيخ علي الكبسي', authorEn: 'Ali Al-Kabsi', rating: 5, commentAr: 'تعامل راقي جداً والتزام تام بالمواعيد والمخططات كانت مبدعة وفاقت التوقعات.', commentEn: 'Professional service, strict commitment to deadlines, and creative blueprints.', date: new Date().toLocaleDateString() },
    { id: 'r2', authorAr: 'أ. محمد الحبيشي', authorEn: 'M. Al-Hubaishi', rating: 4.8, commentAr: 'مهندس ممتاز ولديه حلول ذكية لاستغلال المساحات الضيقة في الأراضي السكنية.', commentEn: 'Excellent engineer with smart space optimization solutions for tight residential plots.', date: new Date().toLocaleDateString() },
  ];

  // Load user data and initialize custom states
  async function loadUser() {
    setLoading(true);
    try {
      const res = await api.get(`/users/${id}`);
      setUser(res);

      const profileObj = res.engineerProfile || res.contractorProfile || {};
      
      // Load Custom values from LocalStorage or Fallback to Defaults
      const localProjects = localStorage.getItem(`user_${id}_projects`);
      const localTimeline = localStorage.getItem(`user_${id}_timeline`);
      const localReviews = localStorage.getItem(`user_${id}_reviews`);
      const localCity = localStorage.getItem(`user_${id}_city`);
      const localRoleTitle = localStorage.getItem(`user_${id}_roleTitle`);

      const loadedProjects = localProjects ? JSON.parse(localProjects) : defaultProjects;
      const loadedTimeline = localTimeline ? JSON.parse(localTimeline) : defaultTimeline;
      const loadedReviews = localReviews ? JSON.parse(localReviews) : defaultReviews;
      const loadedCity = localCity || (isRtl ? 'محافظة ذمار' : 'Dhamar Governorate');
      const loadedRoleTitle = localRoleTitle || (res.role?.name === 'ENGINEER' ? (isRtl ? 'مهندس معماري رئيسي' : 'Chief Architect') : (isRtl ? 'مؤسسة مقاولات عامة' : 'General Contracting'));

      setProjects(loadedProjects);
      setTimeline(loadedTimeline);
      setReviews(loadedReviews);
      setCity(loadedCity);
      setRoleTitle(loadedRoleTitle);

      setBasicForm({
        name: res.name || '',
        phone: res.phone || '',
        email: res.email || '',
        profileImage: res.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
        status: res.status || 'ACTIVE',
        specialization: profileObj.specialization || '',
        experienceYears: profileObj.experienceYears || 0,
        bio: profileObj.bio || '',
        city: loadedCity,
        roleTitle: loadedRoleTitle,
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, [id]);

  // Save changes to localStorage helper
  const saveLocalData = (key: string, value: any) => {
    localStorage.setItem(`user_${id}_${key}`, JSON.stringify(value));
  };

  // Helper to parse certificates (which can be JSON string or plain text string)
  const parseCertificate = (certStr: string): CertificateItem => {
    if (certStr.startsWith('{')) {
      try {
        const parsed = JSON.parse(certStr);
        return { title: parsed.title, image: parsed.image };
      } catch (e) {
        return { title: certStr };
      }
    }
    return { title: certStr };
  };

  // Status toggle handler
  const handleToggleStatus = async () => {
    if (!user) return;
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setSaving(true);
    try {
      if (newStatus === 'SUSPENDED') {
        await api.patch(`/users/${id}/suspend`, {});
      } else {
        await api.patch(`/users/${id}`, { status: 'ACTIVE' });
      }
      setUser((prev: any) => ({ ...prev, status: newStatus }));
      setBasicForm(f => ({ ...f, status: newStatus }));
    } catch (err) {
      showAlert(isRtl ? 'فشل تغيير حالة المستخدم.' : 'Failed to change user status.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Submit Basic Details Form
  const handleUpdateBasic = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        name: basicForm.name,
        phone: basicForm.phone,
        profileImage: basicForm.profileImage,
        status: basicForm.status,
      };

      if (user.role?.name === 'ENGINEER') {
        payload.engineerDetails = {
          specialization: basicForm.specialization,
          experienceYears: Number(basicForm.experienceYears),
          bio: basicForm.bio,
          skills: user.engineerProfile?.skills || [],
          certificates: user.engineerProfile?.certificates || [],
          qualifications: user.engineerProfile?.qualifications || [],
        };
      } else if (user.role?.name === 'CONTRACTOR') {
        payload.contractorDetails = {
          companyName: basicForm.roleTitle, 
          experienceYears: Number(basicForm.experienceYears),
          bio: basicForm.bio,
          skills: user.contractorProfile?.skills || [],
          certificates: user.contractorProfile?.certificates || [],
        };
      }

      await api.patch(`/users/${id}`, payload);

      // Save custom fields locally
      setCity(basicForm.city);
      setRoleTitle(basicForm.roleTitle);
      localStorage.setItem(`user_${id}_city`, basicForm.city);
      localStorage.setItem(`user_${id}_roleTitle`, basicForm.roleTitle);

      setShowEditBasicModal(false);
      loadUser();
    } catch (err) {
      showAlert(isRtl ? 'فشل التحديث.' : 'Failed to update details.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showAlert(isRtl ? 'تم نسخ رابط الملف الشخصي إلى الحافظة!' : 'Profile link copied to clipboard!', 'success');
    }
  };

  // ──────── SKILLS CRUD ────────
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillInput.trim()) return;
    const currentSkills = user.engineerProfile?.skills || user.contractorProfile?.skills || [];
    if (currentSkills.includes(skillInput.trim())) return;

    const updatedSkills = [...currentSkills, skillInput.trim()];
    setSaving(true);
    try {
      const payload: any = {};
      if (user.role?.name === 'ENGINEER') {
        payload.engineerDetails = { ...user.engineerProfile, skills: updatedSkills };
      } else {
        payload.contractorDetails = { ...user.contractorProfile, skills: updatedSkills };
      }
      await api.patch(`/users/${id}`, payload);
      setSkillInput('');
      loadUser();
    } catch (err) {
      showAlert(isRtl ? 'فشل إضافة المهارة' : 'Failed to add skill', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSkill = async (skillToDelete: string) => {
    const currentSkills = user.engineerProfile?.skills || user.contractorProfile?.skills || [];
    const updatedSkills = currentSkills.filter((s: string) => s !== skillToDelete);
    setSaving(true);
    try {
      const payload: any = {};
      if (user.role?.name === 'ENGINEER') {
        payload.engineerDetails = { ...user.engineerProfile, skills: updatedSkills };
      } else {
        payload.contractorDetails = { ...user.contractorProfile, skills: updatedSkills };
      }
      await api.patch(`/users/${id}`, payload);
      loadUser();
    } catch (err) {
      showAlert(isRtl ? 'فشل حذف المهارة' : 'Failed to delete skill', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ──────── CERTIFICATIONS CRUD ────────
  const handleAddCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certForm.title.trim()) return;

    // Serialize to JSON string containing title and image
    const serializedCert = JSON.stringify({
      title: certForm.title.trim(),
      image: certForm.image.trim() || undefined
    });

    const currentCerts = user.engineerProfile?.certificates || user.contractorProfile?.certificates || [];
    const updatedCerts = [...currentCerts, serializedCert];
    setSaving(true);
    try {
      const payload: any = {};
      if (user.role?.name === 'ENGINEER') {
        payload.engineerDetails = { ...user.engineerProfile, certificates: updatedCerts };
      } else {
        payload.contractorDetails = { ...user.contractorProfile, certificates: updatedCerts };
      }
      await api.patch(`/users/${id}`, payload);
      setCertForm({ title: '', image: '' });
      setShowCertModal(false);
      loadUser();
    } catch (err) {
      showAlert(isRtl ? 'فشل إضافة الشهادة' : 'Failed to add certificate', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCert = async (certToDelete: string) => {
    const currentCerts = user.engineerProfile?.certificates || user.contractorProfile?.certificates || [];
    const updatedCerts = currentCerts.filter((c: string) => c !== certToDelete);
    setSaving(true);
    try {
      const payload: any = {};
      if (user.role?.name === 'ENGINEER') {
        payload.engineerDetails = { ...user.engineerProfile, certificates: updatedCerts };
      } else {
        payload.contractorDetails = { ...user.contractorProfile, certificates: updatedCerts };
      }
      await api.patch(`/users/${id}`, payload);
      loadUser();
    } catch (err) {
      showAlert(isRtl ? 'فشل حذف الشهادة' : 'Failed to delete certificate', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ──────── PROJECTS CRUD ────────
  const handleOpenAddProject = () => {
    setEditingProject(null);
    setProjectForm({ titleAr: '', titleEn: '', descAr: '', descEn: '', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=400' });
    setShowProjectModal(true);
  };

  const handleOpenEditProject = (proj: ProjectItem) => {
    setEditingProject(proj);
    setProjectForm({ titleAr: proj.titleAr, titleEn: proj.titleEn, descAr: proj.descAr, descEn: proj.descEn, image: proj.image });
    setShowProjectModal(true);
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedProjects: ProjectItem[] = [];
    if (editingProject) {
      updatedProjects = projects.map(p => p.id === editingProject.id ? { ...p, ...projectForm } : p);
    } else {
      const newProj = { id: 'p_' + Date.now(), ...projectForm };
      updatedProjects = [...projects, newProj];
    }
    setProjects(updatedProjects);
    saveLocalData('projects', updatedProjects);
    setShowProjectModal(false);
  };

  const handleDeleteProject = async (projId: string) => {
    if (!await showConfirm(isRtl ? 'هل أنت متأكد من حذف هذا المشروع؟' : 'Are you sure you want to delete this project?')) return;
    const updatedProjects = projects.filter(p => p.id !== projId);
    setProjects(updatedProjects);
    saveLocalData('projects', updatedProjects);
  };

  // ──────── TIMELINE CRUD ────────
  const handleOpenAddTimeline = () => {
    setEditingTimeline(null);
    setTimelineForm({ period: '', titleAr: '', titleEn: '', descAr: '', descEn: '' });
    setShowTimelineModal(true);
  };

  const handleOpenEditTimeline = (item: TimelineItem) => {
    setEditingTimeline(item);
    setTimelineForm({ period: item.period, titleAr: item.titleAr, titleEn: item.titleEn, descAr: item.descAr, descEn: item.descEn });
    setShowTimelineModal(true);
  };

  const handleSaveTimeline = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedTimeline: TimelineItem[] = [];
    if (editingTimeline) {
      updatedTimeline = timeline.map(t => t.id === editingTimeline.id ? { ...t, ...timelineForm } : t);
    } else {
      const newTime = { id: 't_' + Date.now(), ...timelineForm };
      updatedTimeline = [...timeline, newTime];
    }
    setTimeline(updatedTimeline);
    saveLocalData('timeline', updatedTimeline);
    setShowTimelineModal(false);
  };

  const handleDeleteTimeline = async (itemId: string) => {
    if (!await showConfirm(isRtl ? 'هل أنت متأكد من حذف هذه الخبرة؟' : 'Are you sure you want to delete this experience?')) return;
    const updatedTimeline = timeline.filter(t => t.id !== itemId);
    setTimeline(updatedTimeline);
    saveLocalData('timeline', updatedTimeline);
  };

  // ──────── REVIEWS CRUD ────────
  const handleOpenAddReview = () => {
    setReviewForm({ authorAr: '', authorEn: '', rating: 5, commentAr: '', commentEn: '' });
    setShowReviewModal(true);
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    const newReview: ReviewItem = {
      id: 'r_' + Date.now(),
      authorAr: reviewForm.authorAr,
      authorEn: reviewForm.authorEn,
      rating: Number(reviewForm.rating),
      commentAr: reviewForm.commentAr,
      commentEn: reviewForm.commentEn,
      date: new Date().toLocaleDateString(),
    };
    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    saveLocalData('reviews', updatedReviews);
    setShowReviewModal(false);
  };

  const handleDeleteReview = async (revId: string) => {
    if (!await showConfirm(isRtl ? 'هل تريد إخفاء أو حذف هذا التقييم؟' : 'Do you want to hide or delete this review?')) return;
    const updatedReviews = reviews.filter(r => r.id !== revId);
    setReviews(updatedReviews);
    saveLocalData('reviews', updatedReviews);
  };

  useEffect(() => {
    if (user) {
      const roleName = user.role?.name || '';
      const isEngineer = roleName === 'ENGINEER';
      const isContractor = roleName === 'CONTRACTOR';
      const profile = isEngineer ? user.engineerProfile : user.contractorProfile;
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
            {isRtl ? 'جاري تحميل الملف الشخصي...' : 'Loading profile...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-bold">{isRtl ? 'لم يتم العثور على المستخدم' : 'User not found'}</p>
        <Link href="/dashboard/users" className="mt-4 inline-block text-primary underline text-sm">
          {isRtl ? 'العودة للمستخدمين' : 'Back to Users'}
        </Link>
      </div>
    );
  }

  const roleName = user.role?.name || '';
  const isEngineer = roleName === 'ENGINEER';
  const isContractor = roleName === 'CONTRACTOR';
  const profile = isEngineer ? user.engineerProfile : user.contractorProfile;

  const card = `rounded-2xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm'}`;
  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition ${
    isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-600' : 'bg-zinc-50 border-zinc-300 text-zinc-800 placeholder-zinc-400'
  }`;

  const roleMeta = {
    ENGINEER: { icon: '👷', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    CONTRACTOR: { icon: '🏗️', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30' }
  };
  const rm = roleMeta[roleName as 'ENGINEER' | 'CONTRACTOR'] || { icon: '👤', color: 'text-zinc-500', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30' };

  return (
    <div className={`space-y-6 ${isRtl ? 'text-right' : 'text-left'}`}>
      
      {/* ── Navigation Breadcrumbs ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/dashboard/users" className="hover:text-primary transition font-bold">
            {isRtl ? 'إدارة المستخدمين' : 'Users Management'}
          </Link>
          <span>/</span>
          <span className="text-zinc-400 font-semibold">{user.name}</span>
        </div>

        {/* Suspend / Activate Toggle directly at the top */}
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold ${user.status === 'ACTIVE' ? 'text-emerald-500' : 'text-red-500'}`}>
            ● {user.status === 'ACTIVE' ? (isRtl ? 'نشط بالمنصة' : 'Active') : (isRtl ? 'موقوف إدارياً' : 'Suspended')}
          </span>
          <button
            onClick={handleToggleStatus}
            disabled={saving}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shadow-sm ${
              user.status === 'ACTIVE' 
                ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 hover:bg-red-100'
                : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 hover:bg-emerald-100'
            }`}
          >
            {user.status === 'ACTIVE' ? (isRtl ? '🛑 إيقاف الحساب' : 'Suspend Account') : (isRtl ? '✅ تنشيط الحساب' : 'Activate Account')}
          </button>
        </div>
      </div>

      {/* ── Redesigned Header: High Contrast & Correct Layout ── */}
      <div className={`${card} overflow-hidden shadow-md`}>
        {/* Banner area */}
        <div className="h-44 w-full relative bg-zinc-800">
          <img 
            src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1000" 
            alt="Engineering Cover" 
            className="w-full h-full object-cover opacity-60 dark:opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
        </div>

        {/* User profile data container positioned completely below the cover to prevent overlaps */}
        <div className="p-6 relative flex flex-col md:flex-row gap-6 items-start justify-between">
          <div className="flex flex-col md:flex-row gap-5 items-center md:items-start text-center md:text-start -mt-20 md:-mt-24 w-full md:w-auto">
            {/* Avatar image floating halfway on cover boundary */}
            <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-zinc-900 bg-zinc-850 shadow-xl shrink-0">
              <img 
                src={user.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400'} 
                alt={user.name} 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Profile Info block */}
            <div className="space-y-2 mt-2 md:mt-24">
              <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                <h1 className={`text-2xl font-black ${isDark ? 'text-zinc-100' : 'text-zinc-850'}`}>{user.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide ${rm.bg} ${rm.color} ${rm.border} border`}>
                  {rm.icon} {isRtl ? user.role?.nameAr : user.role?.nameEn}
                </span>
              </div>
              
              <p className={`text-sm font-semibold ${isDark ? 'text-zinc-350' : 'text-zinc-650'}`}>
                {isEngineer ? (
                  <>🔧 {basicForm.specialization || (isRtl ? 'تصميم هندسي' : 'Architecture')} · {roleTitle}</>
                ) : (
                  <>🏗️ {roleTitle || (isRtl ? 'مؤسسة مقاولات' : 'Contracting Firm')}</>
                )}
              </p>

              <div className="flex items-center justify-center md:justify-start gap-4 text-xs text-zinc-550 dark:text-zinc-450 flex-wrap">
                <span>📍 {city}</span>
                <span>📞 {user.phone || '—'}</span>
                <span>💼 {profile?.experienceYears || 0} {isRtl ? 'سنوات خبرة' : 'years exp'}</span>
                <span>⭐ 4.9 ({reviews.length} {isRtl ? 'تقييمات' : 'reviews'})</span>
              </div>
            </div>
          </div>

          {/* Action buttons on the side */}
          <div className="flex gap-2.5 shrink-0 self-center md:self-end mt-4 md:mt-0 w-full md:w-auto justify-center">
            <button 
              onClick={() => setShowEditBasicModal(true)} 
              className={`px-4 py-2 rounded-xl border text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-sm ${
                isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-750' : 'bg-zinc-100 border-zinc-250 text-zinc-750 hover:bg-zinc-50'
              }`}
            >
              ✏️ {isRtl ? 'تعديل البيانات الأساسية' : 'Edit Basics'}
            </button>
            <button 
              onClick={handleShare} 
              className="px-4 py-2 rounded-xl primary-gradient text-zinc-950 text-xs font-black hover:opacity-90 transition shadow-md cursor-pointer"
            >
              🔗 {isRtl ? 'نسخ رابط السيرة' : 'Share Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Profile Body Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── Left Column: Quick Actions & Summary ── */}
        <div className="space-y-6">
          <div className={`${card} p-5 space-y-4`}>
            <h3 className={`font-bold text-sm border-b pb-2 ${isDark ? 'text-zinc-100 border-zinc-800' : 'text-zinc-800 border-zinc-200'}`}>
              ⚡ {isRtl ? 'أزرار التواصل والتفاعل السريع' : 'Quick Actions'}
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              <a href={`tel:${user.phone || ''}`} className={`w-full flex items-center justify-between p-3 rounded-xl border transition group text-xs font-bold ${
                isDark ? 'border-zinc-800 bg-zinc-900/30 hover:border-blue-500/50 hover:bg-blue-950/10' : 'border-zinc-200 bg-zinc-50 hover:border-blue-500/50 hover:bg-blue-50/50'
              }`}>
                <div className="flex items-center gap-2"><span>📞</span><span>{isRtl ? 'اتصال هاتفي مباشر' : 'Phone Call'}</span></div>
                <span className="text-zinc-400 group-hover:text-blue-500">→</span>
              </a>

              <a href={`https://wa.me/${user.phone || ''}`} target="_blank" rel="noreferrer" className={`w-full flex items-center justify-between p-3 rounded-xl border transition group text-xs font-bold ${
                isDark ? 'border-zinc-800 bg-zinc-900/30 hover:border-emerald-500/50 hover:bg-emerald-950/10' : 'border-zinc-200 bg-zinc-50 hover:border-emerald-500/50 hover:bg-emerald-50/50'
              }`}>
                <div className="flex items-center gap-2"><span>💬</span><span>{isRtl ? 'مراسلة فورية واتساب' : 'WhatsApp Chat'}</span></div>
                <span className="text-zinc-400 group-hover:text-emerald-500">→</span>
              </a>

              <a href={`sms:${user.phone || ''}`} className={`w-full flex items-center justify-between p-3 rounded-xl border transition group text-xs font-bold ${
                isDark ? 'border-zinc-800 bg-zinc-900/30 hover:border-amber-500/50 hover:bg-amber-950/10' : 'border-zinc-200 bg-zinc-50 hover:border-amber-500/50 hover:bg-amber-50/50'
              }`}>
                <div className="flex items-center gap-2"><span>✉️</span><span>{isRtl ? 'إرسال رسالة قصيرة SMS' : 'Send SMS'}</span></div>
                <span className="text-zinc-400 group-hover:text-amber-500">→</span>
              </a>

              <a href="https://facebook.com" target="_blank" rel="noreferrer" className={`w-full flex items-center justify-between p-3 rounded-xl border transition group text-xs font-bold ${
                isDark ? 'border-zinc-800 bg-zinc-900/30 hover:border-blue-600/50 hover:bg-blue-100/10' : 'border-zinc-200 bg-zinc-50 hover:border-blue-600/50 hover:bg-blue-50/50'
              }`}>
                <div className="flex items-center gap-2"><span>🌐</span><span>{isRtl ? 'المكتب على فيسبوك' : 'Official Facebook'}</span></div>
                <span className="text-zinc-400 group-hover:text-blue-600">→</span>
              </a>
            </div>
          </div>

          <div className={`${card} p-5 space-y-3.5`}>
            <h3 className="font-extrabold text-xs text-zinc-450 uppercase tracking-wide">{isRtl ? 'ملخص الإدارة' : 'Management Summary'}</h3>
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-zinc-500">{isRtl ? 'المشاريع المدرجة' : 'Portfolio Projects'}</span>
                <span className="text-zinc-400 dark:text-zinc-200">{projects.length}</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-zinc-500">{isRtl ? 'الخبرات المسجلة' : 'Timeline Milestones'}</span>
                <span className="text-zinc-400 dark:text-zinc-200">{timeline.length}</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-zinc-500">{isRtl ? 'الشهادات والاعتمادات' : 'Certificates'}</span>
                <span className="text-zinc-400 dark:text-zinc-200">{profile?.certificates?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Interactive Tabs Area ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab switches */}
          <div className={`${card} p-1.5 flex gap-1 overflow-x-auto`}>
            {[
              { id: 'about', labelAr: 'نبذة ومهارات', labelEn: 'About & Skills', icon: '📝' },
              { id: 'projects', labelAr: 'المشاريع', labelEn: 'Projects', icon: '🏗️' },
              { id: 'experiences', labelAr: 'الخبرات', labelEn: 'Experiences', icon: '⏳' },
              { id: 'certifications', labelAr: 'الشهادات', labelEn: 'Certifications', icon: '📜' },
              { id: 'reviews', labelAr: 'التقييمات', labelEn: 'Reviews', icon: '⭐' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-max flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  activeTab === tab.id 
                    ? isDark ? 'bg-primary/10 border border-primary/20 text-primary' : 'bg-amber-50 border border-amber-200 text-primary'
                    : isDark ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-150'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{isRtl ? tab.labelAr : tab.labelEn}</span>
              </button>
            ))}
          </div>

          {/* Tab content wrapper */}
          <div className={`${card} p-6 min-h-[350px]`}>
            
            {/* ABOUT */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-zinc-450 uppercase tracking-wider mb-2">{isRtl ? 'النبذة المهنية' : 'Professional Bio'}</h4>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-300' : 'text-zinc-700'} font-medium`}>
                    {profile?.bio || (isRtl ? 'لا يوجد نبذة مهنية مكتوبة حالياً.' : 'No biography declared yet.')}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-800/40">
                  <h4 className="text-xs font-bold text-zinc-450 uppercase tracking-wider mb-3">{isRtl ? 'إدارة المهارات والتقنيات' : 'Skills & Expertises'}</h4>
                  <form onSubmit={handleAddSkill} className="flex gap-2 max-w-sm mb-4">
                    <input
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      placeholder={isRtl ? 'أدخل مهارة جديدة...' : 'New skill name...'}
                      className={inputCls}
                    />
                    <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-zinc-950 font-bold text-xs hover:opacity-90 transition cursor-pointer">
                      {isRtl ? 'إضافة' : 'Add'}
                    </button>
                  </form>

                  <div className="flex flex-wrap gap-2">
                    {(profile?.skills || []).map((skill: string, index: number) => (
                      <span 
                        key={index} 
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition ${
                          isDark ? 'bg-zinc-800 border-zinc-750 text-zinc-200' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                        }`}
                      >
                        <span>🛠️ {skill}</span>
                        <button 
                          type="button" 
                          onClick={() => handleDeleteSkill(skill)}
                          className="text-zinc-450 hover:text-red-500 font-black cursor-pointer text-[10px]"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PROJECTS */}
            {activeTab === 'projects' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold text-zinc-450 uppercase tracking-wider">{isRtl ? 'إدارة معرض المشاريع السابقة' : 'Portfolio Projects'}</h4>
                  <button onClick={handleOpenAddProject} className="px-3.5 py-1.5 rounded-lg primary-gradient text-zinc-950 text-xs font-bold hover:opacity-90 transition shadow-md cursor-pointer">
                    + {isRtl ? 'إضافة مشروع' : 'Add Project'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map(proj => (
                    <div key={proj.id} className={`rounded-xl border overflow-hidden flex flex-col justify-between group relative ${isDark ? 'border-zinc-800 bg-zinc-900/40' : 'border-zinc-200 bg-zinc-50'}`}>
                      <img src={proj.image} alt={proj.titleAr} className="h-36 w-full object-cover" />
                      
                      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition duration-200">
                        <button onClick={() => handleOpenEditProject(proj)} className="p-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-amber-500 text-xs border border-zinc-700 cursor-pointer">✏️</button>
                        <button onClick={() => handleDeleteProject(proj.id)} className="p-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-red-500 text-xs border border-zinc-700 cursor-pointer">🗑️</button>
                      </div>

                      <div className="p-4 space-y-2">
                        <h4 className={`font-extrabold text-sm ${isDark ? 'text-zinc-150' : 'text-zinc-850'}`}>{isRtl ? proj.titleAr : proj.titleEn}</h4>
                        <p className={`text-xs leading-relaxed line-clamp-2 ${isDark ? 'text-zinc-450' : 'text-zinc-500'}`}>{isRtl ? proj.descAr : proj.descEn}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EXPERIENCES */}
            {activeTab === 'experiences' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold text-zinc-450 uppercase tracking-wider">{isRtl ? 'إدارة السجل المهني والخبرات' : 'Career Timeline'}</h4>
                  <button onClick={handleOpenAddTimeline} className="px-3.5 py-1.5 rounded-lg primary-gradient text-zinc-950 text-xs font-bold hover:opacity-90 transition shadow-md cursor-pointer">
                    + {isRtl ? 'إضافة خبرة' : 'Add Experience'}
                  </button>
                </div>

                <div className="relative border-r border-zinc-800 pr-5 space-y-6 mr-3">
                  {timeline.map(exp => (
                    <div key={exp.id} className="relative group">
                      <span className="absolute -right-7 top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-zinc-900" />
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-primary font-bold">{exp.period}</span>
                        <div className="opacity-0 group-hover:opacity-100 transition duration-150 flex gap-2 ms-2">
                          <button onClick={() => handleOpenEditTimeline(exp)} className="text-[10px] text-amber-500 hover:underline cursor-pointer">✏️</button>
                          <button onClick={() => handleDeleteTimeline(exp.id)} className="text-[10px] text-red-500 hover:underline cursor-pointer">🗑️</button>
                        </div>
                      </div>

                      <h4 className={`font-bold text-sm mt-1 ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{isRtl ? exp.titleAr : exp.titleEn}</h4>
                      <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-zinc-450' : 'text-zinc-550'}`}>{isRtl ? exp.descAr : exp.descEn}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CERTIFICATIONS WITH IMAGES */}
            {activeTab === 'certifications' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold text-zinc-450 uppercase tracking-wider">{isRtl ? 'إدارة الشهادات المهنية (مع صور المعاينة)' : 'Professional Certifications with Images'}</h4>
                  <button 
                    onClick={() => { setCertForm({ title: '', image: '' }); setShowCertModal(true); }}
                    className="px-3.5 py-1.5 rounded-lg primary-gradient text-zinc-950 text-xs font-bold hover:opacity-90 transition shadow-md cursor-pointer"
                  >
                    + {isRtl ? 'إضافة شهادة وصورة' : 'Add Certificate'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(profile?.certificates || []).map((certStr: string, index: number) => {
                    const cert = parseCertificate(certStr);
                    return (
                      <div key={index} className={`rounded-xl border overflow-hidden flex flex-col md:flex-row justify-between group p-3.5 relative ${
                        isDark ? 'border-zinc-800 bg-zinc-900/20' : 'border-zinc-200 bg-zinc-50 shadow-sm'
                      }`}>
                        
                        {/* Certificate details */}
                        <div className="flex-1 flex gap-3.5 items-start">
                          <span className="text-2xl shrink-0 mt-1">📜</span>
                          <div>
                            <h4 className={`font-bold text-xs ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{cert.title}</h4>
                            <span className="text-[9px] text-zinc-500 font-mono">Verified Credentials</span>
                            {cert.image && (
                              <button 
                                onClick={() => setSelectedCertImage(cert.image || null)}
                                className="mt-2 block text-[10px] text-primary hover:underline font-bold cursor-pointer"
                              >
                                👁️ {isRtl ? 'معاينة وثيقة الشهادة' : 'Preview Document'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Thumbnail image */}
                        {cert.image && (
                          <div 
                            onClick={() => setSelectedCertImage(cert.image || null)}
                            className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800 mt-3 md:mt-0 shrink-0 cursor-zoom-in"
                          >
                            <img src={cert.image} alt={cert.title} className="w-full h-full object-cover" />
                          </div>
                        )}

                        {/* Delete button */}
                        <button 
                          onClick={() => handleDeleteCert(certStr)} 
                          className="absolute left-2.5 bottom-2.5 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 text-sm transition cursor-pointer"
                          title={isRtl ? 'حذف الشهادة' : 'Delete Certificate'}
                        >
                          🗑️
                        </button>
                      </div>
                    );
                  })}
                  {(profile?.certificates || []).length === 0 && (
                    <div className="col-span-2 text-center py-12 text-zinc-500 italic text-xs">{isRtl ? 'لا توجد شهادات مدرجة.' : 'No certificates declared.'}</div>
                  )}
                </div>
              </div>
            )}

            {/* REVIEWS */}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-zinc-450 uppercase tracking-wider">{isRtl ? 'إدارة تقييمات العملاء وآرائهم' : 'Client Reviews'}</h4>
                  <button onClick={handleOpenAddReview} className="px-3.5 py-1.5 rounded-lg primary-gradient text-zinc-950 text-xs font-bold hover:opacity-90 transition shadow-md cursor-pointer">
                    + {isRtl ? 'إضافة تقييم' : 'Write Review'}
                  </button>
                </div>

                <div className="divide-y divide-zinc-800/40">
                  {reviews.map(rev => (
                    <div key={rev.id} className="py-4 first:pt-0 last:pb-0 space-y-2 group relative">
                      <div className="flex justify-between items-center flex-wrap">
                        <span className={`font-bold text-xs ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{isRtl ? rev.authorAr : rev.authorEn}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-zinc-500 font-mono">{rev.date}</span>
                          <button onClick={() => handleDeleteReview(rev.id)} className="opacity-0 group-hover:opacity-100 text-[10px] text-red-500 hover:underline transition cursor-pointer">
                            {isRtl ? 'إخفاء / حذف' : 'Delete'}
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-0.5 text-amber-400 text-xs">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <span key={idx} className={idx < rev.rating ? 'text-amber-450' : 'text-zinc-750'}>★</span>
                        ))}
                      </div>
                      <p className={`text-xs leading-relaxed italic ${isDark ? 'text-zinc-450' : 'text-zinc-600'}`}>{isRtl ? rev.commentAr : rev.commentEn}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* ── FULLSCREEN CERTIFICATE IMAGE PREVIEW ── */}
      {selectedCertImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setSelectedCertImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={selectedCertImage} alt="Certificate Document" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl border border-zinc-800" />
            <button 
              onClick={() => setSelectedCertImage(null)}
              className="absolute -top-10 right-0 text-white font-bold hover:text-primary transition cursor-pointer text-sm"
            >
              ✕ {isRtl ? 'إغلاق المعاينة' : 'Close Preview'}
            </button>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* MODAL 1: EDIT BASIC DETAILS */}
      {showEditBasicModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col ${isRtl ? 'text-right' : 'text-left'} ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <h3 className={`font-extrabold text-sm ${isDark ? 'text-zinc-100' : 'text-zinc-850'}`}>
                {isRtl ? 'تعديل البيانات الأساسية للمستخدم' : 'Edit Basic User Details'}
              </h3>
              <button onClick={() => setShowEditBasicModal(false)} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer transition ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500'}`}>✕</button>
            </div>

            <form onSubmit={handleUpdateBasic} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'رابط الصورة الشخصية' : 'Profile Image URL'}</label>
                <input value={basicForm.profileImage} onChange={e => setBasicForm({ ...basicForm, profileImage: e.target.value })} className={inputCls} dir="ltr" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'الاسم الكامل *' : 'Full Name *'}</label>
                  <input required value={basicForm.name} onChange={e => setBasicForm({ ...basicForm, name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'رقم الهاتف' : 'Phone Number'}</label>
                  <input value={basicForm.phone} onChange={e => setBasicForm({ ...basicForm, phone: e.target.value })} className={inputCls} dir="ltr" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">
                    {isEngineer ? (isRtl ? 'التخصص الهندسي' : 'Specialization') : (isRtl ? 'المسمى المهني / اسم الشركة' : 'Company Name')}
                  </label>
                  <input 
                    value={isEngineer ? basicForm.specialization : basicForm.roleTitle} 
                    onChange={e => setBasicForm({ ...basicForm, [isEngineer ? 'specialization' : 'roleTitle']: e.target.value })} 
                    className={inputCls} 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'سنوات الخبرة' : 'Exp. Years'}</label>
                  <input type="number" min="0" value={basicForm.experienceYears} onChange={e => setBasicForm({ ...basicForm, experienceYears: Number(e.target.value) })} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'الموقع / المدينة' : 'City / Location'}</label>
                  <input value={basicForm.city} onChange={e => setBasicForm({ ...basicForm, city: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'المسمى الإداري الوظيفي' : 'Role Title'}</label>
                  <input value={basicForm.roleTitle} onChange={e => setBasicForm({ ...basicForm, roleTitle: e.target.value })} className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'السيرة والنبذة المهنية' : 'Biography'}</label>
                <textarea rows={3} value={basicForm.bio} onChange={e => setBasicForm({ ...basicForm, bio: e.target.value })} className={inputCls} />
              </div>

              <div className={`flex justify-end gap-3 -mx-6 -mb-6 px-6 py-4 border-t ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
                <button type="button" onClick={() => setShowEditBasicModal(false)} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'}`}>
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl primary-gradient text-zinc-950 font-bold text-xs hover:opacity-90 transition disabled:opacity-60 cursor-pointer flex items-center gap-2">
                  {saving && <span className="w-3.5 h-3.5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />}
                  {isRtl ? 'حفظ التعديلات' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD/EDIT PROJECT */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col ${isRtl ? 'text-right' : 'text-left'} ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <h3 className={`font-extrabold text-sm ${isDark ? 'text-zinc-100' : 'text-zinc-850'}`}>
                {editingProject ? (isRtl ? 'تعديل مشروع هندسي' : 'Edit Project') : (isRtl ? 'إضافة مشروع جديد المعرض' : 'Add New Project')}
              </h3>
              <button onClick={() => setShowProjectModal(false)} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer transition ${isDark ? 'bg-zinc-800 hover:bg-zinc-750 text-zinc-450' : 'bg-zinc-100 hover:bg-zinc-200'}`}>✕</button>
            </div>

            <form onSubmit={handleSaveProject} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'عنوان المشروع (عربي) *' : 'Title (AR) *'}</label>
                <input required value={projectForm.titleAr} onChange={e => setProjectForm({ ...projectForm, titleAr: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'عنوان المشروع (إنجليزي) *' : 'Title (EN) *'}</label>
                <input required value={projectForm.titleEn} onChange={e => setProjectForm({ ...projectForm, titleEn: e.target.value })} className={inputCls} dir="ltr" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'وصف تفصيلي للمشروع (عربي) *' : 'Description (AR) *'}</label>
                <textarea required rows={3} value={projectForm.descAr} onChange={e => setProjectForm({ ...projectForm, descAr: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'وصف تفصيلي للمشروع (إنجليزي) *' : 'Description (EN) *'}</label>
                <textarea required rows={3} value={projectForm.descEn} onChange={e => setProjectForm({ ...projectForm, descEn: e.target.value })} className={inputCls} dir="ltr" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'رابط صورة المشروع' : 'Project Image URL'}</label>
                <input value={projectForm.image} onChange={e => setProjectForm({ ...projectForm, image: e.target.value })} className={inputCls} dir="ltr" />
              </div>

              <div className={`flex justify-end gap-3 -mx-6 -mb-6 px-6 py-4 border-t ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
                <button type="button" onClick={() => setShowProjectModal(false)} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'}`}>
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl primary-gradient text-zinc-950 font-bold text-xs hover:opacity-90 transition cursor-pointer">
                  {isRtl ? 'حفظ المشروع' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD/EDIT TIMELINE MILESTONE */}
      {showTimelineModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col ${isRtl ? 'text-right' : 'text-left'} ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <h3 className={`font-extrabold text-sm ${isDark ? 'text-zinc-100' : 'text-zinc-850'}`}>
                {editingTimeline ? (isRtl ? 'تعديل بند في السيرة' : 'Edit Experience') : (isRtl ? 'إضافة خبرة جديدة للمسيرة' : 'Add Career Milestone')}
              </h3>
              <button onClick={() => setShowTimelineModal(false)} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer transition ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200'}`}>✕</button>
            </div>

            <form onSubmit={handleSaveTimeline} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'الفترة الزمنية (مثال: 2022 - الآن) *' : 'Period (e.g. 2020 - 2023) *'}</label>
                <input required value={timelineForm.period} onChange={e => setTimelineForm({ ...timelineForm, period: e.target.value })} className={inputCls} placeholder="2022 - Present" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'المسمى والمكان (عربي) *' : 'Title / Office (AR) *'}</label>
                <input required value={timelineForm.titleAr} onChange={e => setTimelineForm({ ...timelineForm, titleAr: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'المسمى والمكان (إنجليزي) *' : 'Title / Office (EN) *'}</label>
                <input required value={timelineForm.titleEn} onChange={e => setTimelineForm({ ...timelineForm, titleEn: e.target.value })} className={inputCls} dir="ltr" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'وصف المسؤوليات والمهام (عربي) *' : 'Description (AR) *'}</label>
                <textarea required rows={3} value={timelineForm.descAr} onChange={e => setTimelineForm({ ...timelineForm, descAr: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'وصف المسؤوليات والمهام (إنجليزي) *' : 'Description (EN) *'}</label>
                <textarea required rows={3} value={timelineForm.descEn} onChange={e => setTimelineForm({ ...timelineForm, descEn: e.target.value })} className={inputCls} dir="ltr" />
              </div>

              <div className={`flex justify-end gap-3 -mx-6 -mb-6 px-6 py-4 border-t ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
                <button type="button" onClick={() => setShowTimelineModal(false)} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'}`}>
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl primary-gradient text-zinc-950 font-bold text-xs hover:opacity-90 transition cursor-pointer">
                  {isRtl ? 'حفظ البيانات' : 'Save Experience'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD CERTIFICATION WITH IMAGE URL */}
      {showCertModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${isRtl ? 'text-right' : 'text-left'} ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <h3 className={`font-extrabold text-sm ${isDark ? 'text-zinc-100' : 'text-zinc-850'}`}>
                {isRtl ? 'إضافة شهادة مهنية جديدة' : 'Add New Certificate'}
              </h3>
              <button onClick={() => setShowCertModal(false)} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer transition ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500'}`}>✕</button>
            </div>

            <form onSubmit={handleAddCert} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'اسم الشهادة بالكامل *' : 'Certificate Title *'}</label>
                <input required value={certForm.title} onChange={e => setCertForm({ ...certForm, title: e.target.value })} placeholder={isRtl ? 'مثال: شهادة إدارة المشاريع PMP' : 'e.g. Project Management Professional (PMP)'} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'رابط صورة وثيقة الشهادة' : 'Certificate Image URL'}</label>
                <input value={certForm.image} onChange={e => setCertForm({ ...certForm, image: e.target.value })} placeholder="https://..." className={inputCls} dir="ltr" />
              </div>

              <div className={`flex justify-end gap-3 -mx-6 -mb-6 px-6 py-4 border-t ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
                <button type="button" onClick={() => setShowCertModal(false)} className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-750' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'}`}>
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl primary-gradient text-zinc-950 font-bold text-xs hover:opacity-90 transition cursor-pointer">
                  {isRtl ? 'إضافة الشهادة' : 'Add Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD REVIEW */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col ${isRtl ? 'text-right' : 'text-left'} ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <h3 className={`font-extrabold text-sm ${isDark ? 'text-zinc-100' : 'text-zinc-850'}`}>
                {isRtl ? 'كتابة تقييم ورأي عميل' : 'Add Client Review'}
              </h3>
              <button onClick={() => setShowReviewModal(false)} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer transition ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200'}`}>✕</button>
            </div>

            <form onSubmit={handleSaveReview} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'اسم العميل (عربي) *' : 'Author Name (AR) *'}</label>
                  <input required value={reviewForm.authorAr} onChange={e => setReviewForm({ ...reviewForm, authorAr: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'اسم العميل (إنجليزي) *' : 'Author Name (EN) *'}</label>
                  <input required value={reviewForm.authorEn} onChange={e => setReviewForm({ ...reviewForm, authorEn: e.target.value })} className={inputCls} dir="ltr" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'التقييم الرقمي (1-5) *' : 'Rating (1-5) *'}</label>
                <input type="number" min="1" max="5" step="0.1" required value={reviewForm.rating} onChange={e => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })} className={inputCls} />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'التعليق والرأي (عربي) *' : 'Comment (AR) *'}</label>
                <textarea required rows={3} value={reviewForm.commentAr} onChange={e => setReviewForm({ ...reviewForm, commentAr: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">{isRtl ? 'التعليق والرأي (إنجليزي) *' : 'Comment (EN) *'}</label>
                <textarea required rows={3} value={reviewForm.commentEn} onChange={e => setReviewForm({ ...reviewForm, commentEn: e.target.value })} className={inputCls} dir="ltr" />
              </div>

              <div className={`flex justify-end gap-3 -mx-6 -mb-6 px-6 py-4 border-t ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
                <button type="button" onClick={() => setShowReviewModal(false)} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'}`}>
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl primary-gradient text-zinc-950 font-bold text-xs hover:opacity-90 transition cursor-pointer">
                  {isRtl ? 'إضافة التقييم' : 'Save Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
