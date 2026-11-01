import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Bookmark,
  CheckCircle2,
  Download,
  FileDown,
  HardDrive,
  LogIn,
  LogOut,
  Save,
  Shield,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { useQuranApp } from '../context/QuranAppContext';
import { MESSAGE_LIBRARY, UI_LABELS } from '../data/i18n';
import { ALL_SURAHS, VERIFIED_RECITERS } from '../data/surahs';
import {
  clampStr,
  db,
  deleteDoc,
  doc,
  handleFirestoreError,
  sanitizeDocId,
  serverTimestamp,
  updateDoc,
} from '../lib/firebase';
import { listDownloadedSurahMeta } from '../lib/offlineStorage';
import { OperationType } from '../types/quran';

export const UserProfileView: React.FC = () => {
  const {
    lang,
    user,
    profile,
    staffRole,
    loginWithGoogle,
    logoutUser,
    lastRead,
    bookmarks,
    deleteBookmark,
    hifzPlans,
    khatmahPlans,
    listeningHistory,
    selectedReciter,
    setSelectedReciter,
    notificationSettings,
    updateNotificationSettings,
    navigateTo,
    askConfirm,
    pushToast,
  } = useQuranApp();

  const t = UI_LABELS[lang];

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [savingProfile, setSavingProfile] = useState(false);

  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [downloadedSurahs, setDownloadedSurahs] = useState<
    Array<{ surahNumber: number; nameAr: string; reciterId: string; savedAtIso: string }>
  >([]);

  useEffect(() => {
    setDisplayName(profile?.displayName || user?.displayName || 'قارئ القرآن');
    setBio(profile?.bio || '');
    setVisibility(profile?.visibility || 'public');
  }, [profile, user]);

  useEffect(() => {
    void listDownloadedSurahMeta().then(setDownloadedSurahs);
  }, []);

  const collectionTags = useMemo(() => {
    const set = new Set<string>();
    bookmarks.forEach((b) => set.add(b.collectionTag || 'المفضلة'));
    return ['all', ...Array.from(set)];
  }, [bookmarks]);

  const filteredBookmarks = useMemo(() => {
    if (selectedTagFilter === 'all') return bookmarks;
    return bookmarks.filter((b) => b.collectionTag === selectedTagFilter);
  }, [bookmarks, selectedTagFilter]);

  const totalMemorizedAyahs = useMemo(
    () => hifzPlans.reduce((sum, p) => sum + p.memorizedAyahsCount, 0),
    [hifzPlans]
  );

  const totalKhatmahPages = useMemo(
    () => khatmahPlans.reduce((sum, p) => sum + p.completedPages, 0),
    [khatmahPlans]
  );

  const handleSaveProfileAndNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.emailVerified) {
      pushToast('success', 'تم حفظ إعداداتك وتنبيهاتك محلياً على هذا الجهاز');
      return;
    }

    setSavingProfile(true);
    const safeUid = sanitizeDocId(user.uid);
    try {
      await updateDoc(doc(db, 'users_public', safeUid), {
        displayName: clampStr(displayName, 80, 'قارئ القرآن'),
        bio: clampStr(bio, 300, ''),
        preferredLang: lang,
        preferredReciter: selectedReciter,
        visibility,
        updatedAt: serverTimestamp(),
      });

      if (user.email) {
        await updateDoc(doc(db, 'users_private', safeUid), {
          prayerAlerts: notificationSettings.prayerAlerts,
          adhkarAlerts: notificationSettings.adhkarAlerts,
          wirdReminderTime: clampStr(notificationSettings.quranReminderTime, 16, '20:00'),
          quietHours: clampStr(
            `${notificationSettings.quietHoursStart}-${notificationSettings.quietHoursEnd}`,
            32,
            '23:00-04:30'
          ),
          updatedAt: serverTimestamp(),
        });
      }
      pushToast('success', MESSAGE_LIBRARY[lang].success.synced);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users_public/${safeUid}`);
    } finally {
      setSavingProfile(false);
    }
  };

  // Export Bookmarks & Personal Notes as JSON or TXT (Section 13)
  const handleExportNotes = (format: 'json' | 'txt') => {
    if (bookmarks.length === 0) {
      pushToast('info', MESSAGE_LIBRARY[lang].empty.bookmarks);
      return;
    }

    let content = '';
    let mime = 'text/plain;charset=utf-8';
    let ext = 'txt';

    if (format === 'json') {
      content = JSON.stringify(bookmarks, null, 2);
      mime = 'application/json;charset=utf-8';
      ext = 'json';
    } else {
      content = [
        'اطمئنان القرآن — سجل الآيات المحفوظة والملاحظات التدبرية',
        '=========================================================',
        ...bookmarks.map(
          (b, i) =>
            `${i + 1}. سورة ${b.surahName} (الآية ${b.ayahNumber} · صفحة ${b.pageNumber}) [${b.collectionTag}]\n﴿ ${b.verseExcerpt} ﴾\n${
              b.note ? `الملاحظة: ${b.note}\n` : ''
            }---------------------------------------------------------`
        ),
      ].join('\n\n');
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quran-reassurance-notes.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
    pushToast('success', 'تم تصدير قائمة الآيات والملاحظات التدبرية بنجاح');
  };

  // Self-Service Account & Data Deletion (Sections 18 & 20)
  const handleDeleteAccountData = () => {
    askConfirm(MESSAGE_LIBRARY[lang].confirmations.deleteAccountData, async () => {
      if (user && user.emailVerified) {
        const safeUid = sanitizeDocId(user.uid);
        try {
          for (const bm of bookmarks) {
            await deleteDoc(doc(db, 'bookmarks', sanitizeDocId(bm.id))).catch(() => {});
          }
          await deleteDoc(doc(db, 'users_private', safeUid)).catch(() => {});
          await deleteDoc(doc(db, 'users_public', safeUid)).catch(() => {});
          await logoutUser();
        } catch {
          // Proceed with local cleanup as well
        }
      }
      localStorage.clear();
      window.location.hash = '';
      window.location.reload();
    });
  };

  const lastReadSurah = ALL_SURAHS[(lastRead.surah || 1) - 1] || ALL_SURAHS[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Account Identity & Guest / Cloud Sync Banner */}
      <section className="rounded-2xl bg-[#0E4A3A] dark:bg-[#0B2920] text-[#FBF9F5] p-6 border border-amber-400/30 flex flex-col md:flex-row md:items-center justify-between gap-5 islamic-pattern-subtle">
        <div className="space-y-1.5">
          <div className="text-xs text-amber-300 font-semibold">
            {user
              ? `حساب موثق عبر Google · ${staffRole ? `صلاحية إدارية (${staffRole})` : 'مزامنة سحابية نشطة'}`
              : 'وضع الزائر الآمن — جميع المزايا متاحة ومحفوظة محلياً'}
          </div>
          <h1 className="font-display text-3xl font-bold">
            {user ? displayName : 'ملفك القرآني وإحصائياتك اليومية'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-200 max-w-2xl">
            {user
              ? `البريد الإلكتروني المسجل: ${user.email} · تتم مزامنة موضع القراءة والمفضلة وخطط الحفظ والختمات عبر أجهزتك.`
              : 'يمكنك استخدام المصحف والأذكار والحفظ دون حساب، أو تسجيل الدخول لمزامنة تقدمك وملاحظاتك سحابياً.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {!user ? (
            <button
              type="button"
              onClick={() => void loginWithGoogle()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs sm:text-sm font-bold"
            >
              <LogIn className="w-4 h-4" />
              <span>{t.signInGoogle}</span>
            </button>
          ) : (
            <>
              {staffRole && (
                <button
                  type="button"
                  onClick={() => navigateTo('admin')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-400 text-stone-950 text-xs font-bold"
                >
                  <Shield className="w-4 h-4" />
                  <span>فتح لوحة الإدارة</span>
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  askConfirm(MESSAGE_LIBRARY[lang].confirmations.signOut, () => {
                    void logoutUser();
                  })
                }
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.signOut}</span>
              </button>
            </>
          )}
        </div>
      </section>

      {/* 2. Weekly & Monthly Spiritual Progress Report (Section 23) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-4">
          <div className="text-xs text-stone-500">آخر موضع قراءة</div>
          <div className="font-display text-xl font-bold text-stone-900 dark:text-stone-100 mt-1">
            سورة {lastReadSurah.nameAr} · آية {lastRead.ayah}
          </div>
          <div className="text-xs text-[#0E4A3A] dark:text-amber-300 mt-1">
            صفحة المصحف {lastRead.page} من 604
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-4">
          <div className="text-xs text-stone-500">الآيات المحفوظة في خططك</div>
          <div className="font-mono text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1 tabular-nums">
            {totalMemorizedAyahs}
          </div>
          <div className="text-xs text-stone-500 mt-1">
            عبر {hifzPlans.length || 0} خطة حفظ شخصية
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-4">
          <div className="text-xs text-stone-500">صفحات الختمات المنجزة</div>
          <div className="font-mono text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1 tabular-nums">
            {totalKhatmahPages}
          </div>
          <div className="text-xs text-stone-500 mt-1">
            التلاوات المسجلة: {listeningHistory.length} تلاوة
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-4">
          <div className="text-xs text-stone-500">المفضلة والملاحظات التدبرية</div>
          <div className="font-mono text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1 tabular-nums">
            {bookmarks.length}
          </div>
          <div className="text-xs text-stone-500 mt-1">
            سور محفوظة دون إنترنت: {downloadedSurahs.length}
          </div>
        </div>
      </section>

      {/* 3. Saved Bookmarks & Reflection Notes Manager + Export (Section 13) */}
      <section className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 dark:border-emerald-950 pb-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-[#0E4A3A] dark:text-amber-300" />
              <span>الآيات المفضلة والملاحظات التدبرية</span>
            </h2>
            <p className="text-xs text-stone-500">
              صنّف آياتك المحفوظة وصدّر ملاحظاتك التدبرية بنسخة نصية أو JSON
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleExportNotes('txt')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-[#15251E] text-stone-800 dark:text-stone-200 font-semibold"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>تصدير نصي (TXT)</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportNotes('json')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E4A3A] text-white font-semibold"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>تصدير شامل (JSON)</span>
            </button>
          </div>
        </div>

        {/* Tag Filters */}
        <div className="flex flex-wrap gap-2 text-xs">
          {collectionTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTagFilter(tag)}
              className={`px-3 py-1.5 rounded-lg font-medium ${
                selectedTagFilter === tag
                  ? 'bg-[#0E4A3A] text-white dark:bg-amber-400 dark:text-stone-950'
                  : 'bg-stone-100 dark:bg-[#15251E] text-stone-700 dark:text-stone-300'
              }`}
            >
              {tag === 'all' ? 'جميع التصنيفات' : tag}
            </button>
          ))}
        </div>

        {filteredBookmarks.length === 0 ? (
          <p className="text-sm text-stone-500 py-6 text-center">
            {MESSAGE_LIBRARY[lang].empty.bookmarks}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredBookmarks.map((bm) => (
              <div
                key={bm.id}
                className="p-4 rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200/80 dark:border-emerald-900/60 flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span className="font-bold text-[#0E4A3A] dark:text-amber-300">
                      سورة {bm.surahName} ({bm.surahNumber}:{bm.ayahNumber}) · {bm.collectionTag}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        askConfirm(MESSAGE_LIBRARY[lang].confirmations.deleteNote, () => {
                          void deleteBookmark(bm.id);
                        })
                      }
                      className="text-stone-400 hover:text-red-600"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p dir="rtl" className="font-quran-uthmani text-xl text-stone-900 dark:text-stone-100 leading-loose">
                    ﴿ {bm.verseExcerpt} ﴾
                  </p>
                  {bm.note && (
                    <p className="text-xs text-stone-700 dark:text-stone-300 bg-white dark:bg-[#101C17] p-2.5 rounded-lg border border-stone-200/70 dark:border-emerald-950">
                      <strong>ملاحظتي:</strong> {bm.note}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      navigateTo('quran', {
                        quranTab: 'mushaf',
                        surah: bm.surahNumber,
                        ayah: bm.ayahNumber,
                        page: bm.pageNumber,
                      })
                    }
                    className="text-xs font-semibold text-[#0E4A3A] dark:text-amber-300 hover:underline"
                  >
                    فتح الآية في المصحف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Profile Preferences, Granular Notifications & Offline Downloads */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={(e) => void handleSaveProfileAndNotifications(e)}
          className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-6 space-y-5"
        >
          <h3 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#0E4A3A] dark:text-amber-300" />
            <span>إعدادات الحساب والتنبيهات الذكية وساعات الهدوء</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="block font-semibold mb-1">الاسم الظاهر:</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">القارئ المفضل الافتراضي:</label>
              <select
                value={selectedReciter}
                onChange={(e) => setSelectedReciter(e.target.value)}
                className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5"
              >
                {VERIFIED_RECITERS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nameAr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">وقت تذكير الورد القرآني:</label>
              <input
                type="time"
                value={notificationSettings.quranReminderTime}
                onChange={(e) =>
                  updateNotificationSettings({ quranReminderTime: e.target.value })
                }
                className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">وقت تذكير الحفظ والمراجعة:</label>
              <input
                type="time"
                value={notificationSettings.hifzReminderTime}
                onChange={(e) =>
                  updateNotificationSettings({ hifzReminderTime: e.target.value })
                }
                className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">بداية ساعات الهدوء (عدم الإزعاج):</label>
              <input
                type="time"
                value={notificationSettings.quietHoursStart}
                onChange={(e) =>
                  updateNotificationSettings({ quietHoursStart: e.target.value })
                }
                className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">نهاية ساعات الهدوء:</label>
              <input
                type="time"
                value={notificationSettings.quietHoursEnd}
                onChange={(e) =>
                  updateNotificationSettings({ quietHoursEnd: e.target.value })
                }
                className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1">
            {[
              {
                key: 'prayerAlerts' as const,
                label: 'تفعيل تنبيهات دخول أوقات الصلاة',
                val: notificationSettings.prayerAlerts,
              },
              {
                key: 'adhkarAlerts' as const,
                label: 'تفعيل تذكير أذكار الصباح والمساء',
                val: notificationSettings.adhkarAlerts,
              },
              {
                key: 'soundEnabled' as const,
                label: 'تشغيل التنبيه الصوتي الهادئ',
                val: notificationSettings.soundEnabled,
              },
              {
                key: 'pauseAll' as const,
                label: 'إيقاف جميع الإشعارات مؤقتاً',
                val: notificationSettings.pauseAll,
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 dark:bg-[#15251E] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={item.val}
                  onChange={(e) =>
                    updateNotificationSettings({ [item.key]: e.target.checked })
                  }
                  className="rounded accent-[#0E4A3A]"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
              className="rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2 text-xs"
            >
              <option value="public">ملف عام في حلقات التدارس</option>
              <option value="private">ملف خاص (سري)</option>
            </select>

            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0E4A3A] text-white text-xs font-bold"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>{savingProfile ? 'جارٍ الحفظ...' : 'حفظ التفضيلات والتنبيهات'}</span>
            </button>
          </div>
        </form>

        {/* Offline Downloads & Account Security */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-6 space-y-3">
            <h3 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-[#0E4A3A] dark:text-amber-300" />
              <span>السور المحفوظة للعمل دون إنترنت</span>
            </h3>
            {downloadedSurahs.length === 0 ? (
              <p className="text-xs text-stone-500 py-4">
                {MESSAGE_LIBRARY[lang].empty.offlineDownloads}
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {downloadedSurahs.map((d) => (
                  <div
                    key={d.surahNumber}
                    className="p-3 rounded-xl bg-stone-50 dark:bg-[#15251E] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold">
                        {d.surahNumber}. سورة {d.nameAr}
                      </span>
                      <span className="text-stone-500 ms-2">· جاهزة دون إنترنت</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigateTo('quran', { quranTab: 'mushaf', surah: d.surahNumber })
                      }
                      className="text-[#0E4A3A] dark:text-amber-300 font-semibold hover:underline"
                    >
                      فتح
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-6 space-y-3">
            <h3 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#0E4A3A] dark:text-amber-300" />
              <span>الخصوصية وحماية البيانات</span>
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              لا يقوم تطبيق اطمئنان القرآن ببيع أو مشاركة بياناتك مع أي جهات إعلانية، ولا يطلب صلاحية الموقع الجغرافي إلا عند رغبتك بحساب مواقيت الصلاة.
            </p>
            <div className="pt-2 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>الجلسة الحالية مشفرة ومؤمنة</span>
              </span>
              <button
                type="button"
                onClick={handleDeleteAccountData}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف الحساب والبيانات</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
