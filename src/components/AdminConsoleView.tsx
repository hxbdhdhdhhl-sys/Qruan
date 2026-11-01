import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  BellRing,
  BookCheck,
  CheckCircle2,
  ClipboardList,
  Flag,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { useQuranApp } from '../context/QuranAppContext';
import { verifyCanonicalQuranMetadata } from '../data/surahs';
import {
  clampStr,
  collection,
  db,
  deleteDoc,
  doc,
  getDocs,
  handleFirestoreError,
  recordAdminAudit,
  sanitizeDocId,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '../lib/firebase';
import { OperationType } from '../types/quran';
import type { AdminTabId } from '../types/quran';

interface ServerHealthReport {
  status: string;
  uptimeSeconds: number;
  totalApiRequests: number;
  cacheEntries: number;
  cacheHitsCount: number;
  canonicalSurahsVerified: boolean;
  canonicalTotalAyahs: number;
  recentErrors: Array<{
    id: string;
    refCode: string;
    timestampUtc: string;
    scope: string;
    message: string;
  }>;
}

export const AdminConsoleView: React.FC = () => {
  const { user, staffRole, adminTab: activeTab, navigateTo, pushToast } = useQuranApp();

  const [health, setHealth] = useState<ServerHealthReport | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Verified Catalog Items
  const [catalogItems, setCatalogItems] = useState<
    Array<{
      id: string;
      itemType: string;
      titleAr: string;
      authorName: string;
      sourceInfo: string;
      language: string;
      enabled: boolean;
    }>
  >([]);
  const [catType, setCatType] = useState<'reciter' | 'tafsir' | 'translation' | 'book'>('tafsir');
  const [catTitleAr, setCatTitleAr] = useState('');
  const [catTitleEn, setCatTitleEn] = useState('');
  const [catAuthor, setCatAuthor] = useState('');
  const [catSource, setCatSource] = useState('');
  const [catLang, setCatLang] = useState('ar');

  // Broadcast Notification Form
  const [bcTitleAr, setBcTitleAr] = useState('');
  const [bcTitleEn, setBcTitleEn] = useState('');
  const [bcMsgAr, setBcMsgAr] = useState('');
  const [bcMsgEn, setBcMsgEn] = useState('');
  const [bcCategory, setBcCategory] = useState<'quran' | 'adhkar' | 'occasion' | 'system'>('occasion');

  // Moderation Queue (Content Reports)
  const [reports, setReports] = useState<
    Array<{
      id: string;
      targetType: string;
      targetId: string;
      reporterId: string;
      reason: string;
      details: string;
      status: string;
    }>
  >([]);

  // Staff Roles (Super Admin Only)
  const [rolesList, setRolesList] = useState<Array<{ uid: string; role: string }>>([]);
  const [targetStaffUid, setTargetStaffUid] = useState('');
  const [targetStaffRole, setTargetStaffRole] = useState<'admin' | 'moderator'>('moderator');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<
    Array<{ id: string; actorId: string; actionType: string; targetCollection: string; summary: string }>
  >([]);

  const canonicalCheck = verifyCanonicalQuranMetadata();

  const loadHealth = useCallback(async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch('/api/admin/health');
      if (res.ok) {
        const d = (await res.json()) as ServerHealthReport;
        setHealth(d);
      }
    } catch {
      // Offline safe
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  const loadFirestoreAdminCollections = useCallback(async () => {
    if (!staffRole) return;
    try {
      const catSnap = await getDocs(collection(db, 'admin_catalog'));
      setCatalogItems(
        catSnap.docs.map((d) => {
          const x = d.data();
          return {
            id: d.id,
            itemType: String(x.itemType || ''),
            titleAr: String(x.titleAr || ''),
            authorName: String(x.authorName || ''),
            sourceInfo: String(x.sourceInfo || ''),
            language: String(x.language || 'ar'),
            enabled: Boolean(x.enabled),
          };
        })
      );
    } catch {
      // Non-super-admin list fallback
    }

    if (staffRole === 'super_admin') {
      try {
        const repSnap = await getDocs(collection(db, 'content_reports'));
        setReports(
          repSnap.docs.map((d) => {
            const x = d.data();
            return {
              id: d.id,
              targetType: String(x.targetType || ''),
              targetId: String(x.targetId || ''),
              reporterId: String(x.reporterId || ''),
              reason: String(x.reason || ''),
              details: String(x.details || ''),
              status: String(x.status || 'open'),
            };
          })
        );

        const rSnap = await getDocs(collection(db, 'staff_roles'));
        setRolesList(
          rSnap.docs.map((d) => ({
            uid: d.id,
            role: String(d.data().role || 'moderator'),
          }))
        );

        const aSnap = await getDocs(collection(db, 'admin_audit_logs'));
        setAuditLogs(
          aSnap.docs.map((d) => {
            const x = d.data();
            return {
              id: d.id,
              actorId: String(x.actorId || ''),
              actionType: String(x.actionType || ''),
              targetCollection: String(x.targetCollection || ''),
              summary: String(x.summary || ''),
            };
          })
        );
      } catch {
        // Ignore transient offline
      }
    }
  }, [staffRole]);

  useEffect(() => {
    if (!staffRole) return;
    void loadHealth();
    void loadFirestoreAdminCollections();
  }, [staffRole, loadHealth, loadFirestoreAdminCollections]);

  if (!user || !staffRole) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto" />
        <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
          لوحة الإدارة مخصصة للمشرفين المعتمدين فقط
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          تُحمى صلاحيات إدارة المصادر العلمية والإشراف بقواعد أمان الخادم وسجل التدقيق غير القابل للتعديل.
        </p>
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="px-5 py-2.5 rounded-xl bg-[#0E4A3A] text-white text-xs font-bold"
        >
          العودة إلى الرئيسية
        </button>
      </div>
    );
  }

  const handleAddCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (catTitleAr.trim().length < 2 || catAuthor.trim().length < 2 || catSource.trim().length < 3) {
      pushToast('warning', 'يرجى استيفاء العنوان واسم المؤلف وتوثيق المصدر العلمي');
      return;
    }
    const itemId = sanitizeDocId(`cat_${catType}_${Date.now()}`);
    try {
      await setDoc(doc(db, 'admin_catalog', itemId), {
        itemType: catType,
        titleAr: clampStr(catTitleAr, 160, 'مصدر علمي'),
        titleEn: clampStr(catTitleEn || catTitleAr, 160, 'Verified Source'),
        authorName: clampStr(catAuthor, 120, 'علماء التفسير'),
        sourceInfo: clampStr(catSource, 300, 'طبعة محققة معتمدة'),
        externalUrl: '',
        language: clampStr(catLang, 10, 'ar'),
        enabled: true,
        visibility: 'public',
        authorId: sanitizeDocId(user.uid),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await recordAdminAudit(
        user.uid,
        'create_catalog_source',
        'admin_catalog',
        itemId,
        `إضافة مصدر موثق: ${catTitleAr}`
      );
      setCatTitleAr('');
      setCatTitleEn('');
      setCatAuthor('');
      setCatSource('');
      pushToast('success', 'تمت إضافة المصدر العلمي وتوثيقه في سجل المراجعة');
      void loadFirestoreAdminCollections();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `admin_catalog/${itemId}`);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bcTitleAr.trim().length < 2 || bcMsgAr.trim().length < 3) {
      pushToast('warning', 'يرجى كتابة عنوان ونص التنبيه العام');
      return;
    }
    const notifId = sanitizeDocId(`bc_${Date.now()}`);
    try {
      await setDoc(doc(db, 'notifications', notifId), {
        recipientId: 'all_users',
        scope: 'broadcast',
        titleAr: clampStr(bcTitleAr, 160, 'تذكير إيماني'),
        titleEn: clampStr(bcTitleEn || bcTitleAr, 160, 'Spiritual Reminder'),
        messageAr: clampStr(bcMsgAr, 600, 'اطمئن بذكر الله'),
        messageEn: clampStr(bcMsgEn || bcMsgAr, 600, 'Remember Allah'),
        category: bcCategory,
        targetView: 'home',
        isRead: false,
        authorId: sanitizeDocId(user.uid),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await recordAdminAudit(
        user.uid,
        'send_broadcast',
        'notifications',
        notifId,
        `إرسال إشعار عام: ${bcTitleAr}`
      );
      setBcTitleAr('');
      setBcTitleEn('');
      setBcMsgAr('');
      setBcMsgEn('');
      pushToast('success', 'تم بث الإشعار العام لجميع مستخدمي المنصة');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `notifications/${notifId}`);
    }
  };

  const handleResolveReport = async (reportId: string, targetType: string, targetId: string, hideTarget: boolean) => {
    try {
      if (hideTarget && targetType === 'post') {
        await updateDoc(doc(db, 'community_posts', sanitizeDocId(targetId)), {
          status: 'hidden',
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }
      await updateDoc(doc(db, 'content_reports', sanitizeDocId(reportId)), {
        status: 'resolved',
        updatedAt: serverTimestamp(),
      });
      await recordAdminAudit(
        user.uid,
        'resolve_report',
        'content_reports',
        reportId,
        `معالجة بلاغ محتوى (${targetId})`
      );
      pushToast('success', 'تمت معالجة البلاغ وتحديث السجل الرقابي');
      void loadFirestoreAdminCollections();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `content_reports/${reportId}`);
    }
  };

  const handleAssignStaffRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (staffRole !== 'super_admin') return;
    const cleanUid = sanitizeDocId(targetStaffUid);
    try {
      await setDoc(doc(db, 'staff_roles', cleanUid), {
        uid: cleanUid,
        role: targetStaffRole,
        assignedBy: sanitizeDocId(user.uid),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await recordAdminAudit(
        user.uid,
        'assign_role',
        'staff_roles',
        cleanUid,
        `تعيين صلاحية ${targetStaffRole} للمعرف ${cleanUid}`
      );
      setTargetStaffUid('');
      pushToast('success', 'تم تعيين الصلاحية الإدارية بنجاح');
      void loadFirestoreAdminCollections();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `staff_roles/${cleanUid}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="rounded-2xl bg-[#0E4A3A] text-white p-6 border border-amber-400/30 flex flex-wrap items-center justify-between gap-4 islamic-pattern-subtle">
        <div>
          <div className="text-xs text-amber-300 font-semibold">
            لوحة الإدارة والحوكمة العلمية · الصلاحية الحالية: {staffRole}
          </div>
          <h1 className="font-display text-3xl font-bold mt-1">
            إدارة المصادر الموثقة وسلامة المحتوى القرآني
          </h1>
        </div>
        <button
          type="button"
          onClick={() => {
            void loadHealth();
            void loadFirestoreAdminCollections();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold"
        >
          <RefreshCw className="w-4 h-4" />
          <span>تحديث البيانات</span>
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200 dark:border-emerald-950 text-xs">
        {[
          { id: 'health', label: 'سلامة المصحف والخادم', icon: <Activity className="w-4 h-4" /> },
          { id: 'catalog', label: 'المصادر والقراء والكتب', icon: <BookCheck className="w-4 h-4" /> },
          { id: 'broadcast', label: 'بث التنبيهات والمناسبات', icon: <BellRing className="w-4 h-4" /> },
          { id: 'moderation', label: 'مراجعة البلاغات', icon: <Flag className="w-4 h-4" /> },
          ...(staffRole === 'super_admin'
            ? [
                { id: 'roles', label: 'صلاحيات المشرفين', icon: <Users className="w-4 h-4" /> },
                { id: 'audit', label: 'سجل التدقيق الرقابي', icon: <ClipboardList className="w-4 h-4" /> },
              ]
            : []),
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => navigateTo('admin', { adminTab: tab.id as AdminTabId })}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#0E4A3A] text-white dark:bg-amber-400 dark:text-stone-950'
                : 'bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 1. System Health & Canonical Verification */}
      {activeTab === 'health' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950">
              <div className="text-xs text-stone-500">فحص سلامة فهرس المصحف</div>
              <div className="font-bold text-lg text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {canonicalCheck.surahCount} سورة · {canonicalCheck.totalAyahs} آية
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950">
              <div className="text-xs text-stone-500">حالة الخادم والذاكرة المؤقتة</div>
              <div className="font-mono text-xl font-bold mt-1">
                {loadingHealth ? '...' : `${health?.cacheEntries ?? 0} عنصر مخزن`}
              </div>
              <div className="text-xs text-stone-500 mt-0.5">
                إصابات الكاش السريع: {health?.cacheHitsCount ?? 0}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950">
              <div className="text-xs text-stone-500">إجمالي طلبات الواجهة البرمجية</div>
              <div className="font-mono text-xl font-bold mt-1">
                {health?.totalApiRequests ?? 0}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950">
              <div className="text-xs text-stone-500">زمن تشغيل الخدمة المستمر</div>
              <div className="font-mono text-xl font-bold mt-1">
                {Math.floor((health?.uptimeSeconds ?? 0) / 60)} دقيقة
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-5 space-y-3">
            <h3 className="font-display text-xl font-bold">
              سجل التشخيص والأخطاء المنقّى من البيانات الشخصية
            </h3>
            {!health?.recentErrors?.length ? (
              <p className="text-xs text-emerald-700 dark:text-emerald-400 py-4">
                لا توجد أخطاء تشغيلية مسجلة حالياً — جميع خدمات المصحف والتفسير تعمل بكفاءة.
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                {health.recentErrors.map((err) => (
                  <div
                    key={err.id}
                    className="p-3 rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-mono font-bold text-red-600 me-2">{err.refCode}</span>
                      <span className="font-semibold">[{err.scope}]</span> {err.message}
                    </div>
                    <span className="text-stone-400 font-mono">{err.timestampUtc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Verified Catalog Management */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={(e) => void handleAddCatalogItem(e)}
            className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-5 space-y-3 text-xs"
          >
            <h3 className="font-display text-xl font-bold">إضافة مصدر علمي معتمد</h3>
            <select
              value={catType}
              onChange={(e) => setCatType(e.target.value as typeof catType)}
              className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5"
            >
              <option value="tafsir">مصدر تفسير معتمد</option>
              <option value="reciter">قارئ قرآن مجاز</option>
              <option value="translation">ترجمة معانٍ موثقة</option>
              <option value="book">كتاب في المكتبة الإسلامية</option>
            </select>
            <input
              type="text"
              value={catTitleAr}
              onChange={(e) => setCatTitleAr(e.target.value)}
              placeholder="الاسم بالعربية"
              className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5"
            />
            <input
              type="text"
              value={catTitleEn}
              onChange={(e) => setCatTitleEn(e.target.value)}
              placeholder="الاسم بالإنجليزية"
              className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5"
            />
            <input
              type="text"
              value={catAuthor}
              onChange={(e) => setCatAuthor(e.target.value)}
              placeholder="اسم الإمام المؤلف / القارئ / المترجم"
              className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5"
            />
            <input
              type="text"
              value={catSource}
              onChange={(e) => setCatSource(e.target.value)}
              placeholder="توثيق الطبعة أو الجهة العلمية المعتمدة"
              className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5"
            />
            <input
              type="text"
              value={catLang}
              onChange={(e) => setCatLang(e.target.value)}
              placeholder="رمز اللغة (ar, en, fr...)"
              className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#0E4A3A] text-white font-bold inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>إدراج وتوثيق المصدر</span>
            </button>
          </form>

          <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-5 space-y-3">
            <h3 className="font-display text-xl font-bold">المصادر الإضافية المسجلة سحابياً</h3>
            {catalogItems.length === 0 ? (
              <p className="text-xs text-stone-500 py-6">
                المصادر الأساسية المعتمدة (114 سورة، 10 قراء، 7 تفاسير، 10 ترجمات، 9 كتب محققة) مدمجة ومفعلة افتراضياً.
              </p>
            ) : (
              <div className="space-y-2.5 text-xs">
                {catalogItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold">
                        [{item.itemType}] {item.titleAr} — {item.authorName}
                      </div>
                      <div className="text-stone-500">{item.sourceInfo}</div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteDoc(doc(db, 'admin_catalog', item.id));
                        await recordAdminAudit(
                          user.uid,
                          'delete_catalog_source',
                          'admin_catalog',
                          item.id,
                          `حذف مصدر: ${item.titleAr}`
                        );
                        void loadFirestoreAdminCollections();
                      }}
                      className="text-red-600 p-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Broadcast Notifications */}
      {activeTab === 'broadcast' && (
        <form
          onSubmit={(e) => void handleSendBroadcast(e)}
          className="max-w-2xl rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-6 space-y-4 text-xs"
        >
          <h3 className="font-display text-xl font-bold">
            إرسال تذكير إيماني أو إشعار مناسبة إسلامية عام
          </h3>
          <select
            value={bcCategory}
            onChange={(e) => setBcCategory(e.target.value as typeof bcCategory)}
            className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5"
          >
            <option value="occasion">مناسبة إسلامية (رمضان، عاشوراء، عرفة...)</option>
            <option value="quran">تذكير بالورد القرآني وسورة الكهف</option>
            <option value="adhkar">تذكير بالأذكار الموثقة</option>
            <option value="system">تحديث في المنصة</option>
          </select>
          <input
            type="text"
            value={bcTitleAr}
            onChange={(e) => setBcTitleAr(e.target.value)}
            placeholder="عنوان الإشعار بالعربية"
            className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5"
          />
          <input
            type="text"
            value={bcTitleEn}
            onChange={(e) => setBcTitleEn(e.target.value)}
            placeholder="عنوان الإشعار بالإنجليزية (اختياري)"
            className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5"
          />
          <textarea
            rows={3}
            value={bcMsgAr}
            onChange={(e) => setBcMsgAr(e.target.value)}
            placeholder="نص التذكير بالعربية..."
            className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 p-3"
          />
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#0E4A3A] text-white font-bold"
          >
            نشر التنبيه العام الآن
          </button>
        </form>
      )}

      {/* 4. Moderation Queue */}
      {activeTab === 'moderation' && (
        <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-6 space-y-4">
          <h3 className="font-display text-xl font-bold">قائمة مراجعة بلاغات مجتمع القرآن</h3>
          {reports.length === 0 ? (
            <p className="text-xs text-stone-500 py-6">لا توجد بلاغات مفتوحة حالياً.</p>
          ) : (
            <div className="space-y-3 text-xs">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-bold">
                      الهدف: {rep.targetType} ({rep.targetId}) · السبب: {rep.reason} · الحالة: {rep.status}
                    </div>
                    <p className="text-stone-600 dark:text-stone-300 mt-1">{rep.details}</p>
                  </div>
                  {rep.status !== 'resolved' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void handleResolveReport(rep.id, rep.targetType, rep.targetId, true)
                        }
                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold"
                      >
                        إخفاء المشاركة وإغلاق البلاغ
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void handleResolveReport(rep.id, rep.targetType, rep.targetId, false)
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#0E4A3A] text-white font-semibold"
                      >
                        حفظ وإغلاق البلاغ
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Staff Roles RBAC (Super Admin Only) */}
      {activeTab === 'roles' && staffRole === 'super_admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form
            onSubmit={(e) => void handleAssignStaffRole(e)}
            className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-6 space-y-3 text-xs"
          >
            <h3 className="font-display text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              <span>تعيين مشرف أو مدير محتوى علمي</span>
            </h3>
            <input
              type="text"
              value={targetStaffUid}
              onChange={(e) => setTargetStaffUid(e.target.value)}
              placeholder="معرف المستخدم (Firebase UID)"
              className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5 font-mono"
            />
            <select
              value={targetStaffRole}
              onChange={(e) => setTargetStaffRole(e.target.value as 'admin' | 'moderator')}
              className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5"
            >
              <option value="moderator">مشرف مجتمع ومراجعة (Moderator)</option>
              <option value="admin">مدير مصادر ومحتوى (Admin)</option>
            </select>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#0E4A3A] text-white font-bold"
            >
              منح الصلاحية وتوثيقها
            </button>
          </form>

          <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-6 space-y-3 text-xs">
            <h3 className="font-display text-xl font-bold">المشرفون الحاليون</h3>
            {rolesList.length === 0 ? (
              <p className="text-stone-500">لا يوجد مشرفون إضافيون حالياً سوى المدير العام.</p>
            ) : (
              rolesList.map((r) => (
                <div
                  key={r.uid}
                  className="p-3 rounded-xl bg-stone-50 dark:bg-[#15251E] flex items-center justify-between"
                >
                  <span className="font-mono">
                    {r.uid} — <strong>{r.role}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteDoc(doc(db, 'staff_roles', r.uid));
                      void loadFirestoreAdminCollections();
                    }}
                    className="text-red-600"
                  >
                    إلغاء الصلاحية
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 6. Immutable Audit Trail */}
      {activeTab === 'audit' && staffRole === 'super_admin' && (
        <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-6 space-y-3 text-xs">
          <h3 className="font-display text-xl font-bold">
            سجل التدقيق الإداري غير القابل للحذف أو التعديل
          </h3>
          {auditLogs.length === 0 ? (
            <p className="text-stone-500 py-4">لا توجد عمليات إدارية مسجلة بعد.</p>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900"
                >
                  <span className="font-bold text-[#0E4A3A] dark:text-amber-300">
                    [{log.actionType}]
                  </span>{' '}
                  {log.summary} · الفاعل: <span className="font-mono">{log.actorId}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
