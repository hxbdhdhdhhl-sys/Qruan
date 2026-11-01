import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bell,
  BookMarked,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Contrast,
  CornerLeftUp,
  CornerRightUp,
  Download,
  Globe,
  HeartHandshake,
  Home,
  Info,
  Library,
  Loader2,
  MapPin,
  Mic,
  MicOff,
  Moon,
  Pause,
  Play,
  Repeat,
  Search,
  ShieldCheck,
  Sparkles,
  Square,
  Sun,
  Timer,
  User,
  Users,
  Volume2,
  WifiOff,
  X,
} from 'lucide-react';
import { useQuranApp } from '../context/QuranAppContext';
import { MESSAGE_LIBRARY, UI_LABELS } from '../data/i18n';
import {
  ALL_SURAHS,
  QURAN_THEMATIC_TOPICS,
  VERIFIED_RECITERS,
} from '../data/surahs';
import {
  AUTHENTIC_ADHKAR,
  ISLAMIC_LIBRARY_BOOKS,
  TAJWEED_LESSONS,
} from '../data/adhkarAndLibrary';
import { getFormattedHijriToday } from '../lib/prayerUtils';
import { usePWAInstall } from '../lib/pwa';
import type { AdhkarTabId, AdminTabId, MainNavId } from '../types/quran';

interface SearchApiMatch {
  verseKey: string;
  surahNumber: number;
  ayahNumber: number;
  surahNameAr: string;
  surahNameEn: string;
  text: string;
  editionName: string;
}

export const TopNavigationHeader: React.FC = () => {
  const { lang, activeNav, navigateTo, setIsSearchModalOpen } = useQuranApp();
  const t = UI_LABELS[lang];

  const primaryLinks: Array<{ id: MainNavId; label: string }> = [
    { id: 'home', label: t.navHome },
    { id: 'quran', label: t.navQuran },
    { id: 'adhkar', label: t.navAdhkar },
    { id: 'tools', label: t.navTools },
    { id: 'library', label: t.navLibrary },
  ];

  return (
    <header className="sticky top-0 z-40 h-16 bg-[#FBF9F5]/95 dark:bg-[#09120E]/95 backdrop-blur-md border-b border-stone-200/90 dark:border-emerald-950/80">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="flex items-center gap-3 text-start shrink-0 group focus:outline-none"
        >
          <span className="w-9 h-9 rounded-lg bg-[#0E4A3A] dark:bg-emerald-900/80 text-amber-300 flex items-center justify-center shadow-sm border border-amber-500/30">
            <svg className="w-5 h-5" viewBox="0 0 64 64" fill="none" aria-hidden="true">
              <rect x="16" y="16" width="32" height="32" stroke="currentColor" strokeWidth="3" />
              <rect
                x="16"
                y="16"
                width="32"
                height="32"
                transform="rotate(45 32 32)"
                stroke="currentColor"
                strokeWidth="3"
              />
              <circle cx="32" cy="32" r="5" fill="currentColor" />
            </svg>
          </span>
          <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-stone-900 dark:text-stone-50 whitespace-nowrap">
            {t.brandName}
          </span>
        </button>

        {/* Zone 2: Primary Desktop Navigation Links (5 clean links, whitespace-nowrap) */}
        <nav aria-label="التنقل الرئيسي" className="hidden md:flex items-center gap-6">
          {primaryLinks.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`whitespace-nowrap text-sm font-semibold py-2 border-b-2 transition-colors ${
                  isActive
                    ? 'border-[#0E4A3A] dark:border-amber-400 text-[#0E4A3A] dark:text-amber-300'
                    : 'border-transparent text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Header CTA (Unified Global Search) */}
        <button
          type="button"
          onClick={() => setIsSearchModalOpen(true)}
          className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-[#0E4A3A] hover:bg-[#0B3B2E] dark:bg-emerald-800 dark:hover:bg-emerald-700 text-[#FBF9F5] text-sm font-medium transition-colors shrink-0 shadow-xs"
          aria-label={lang === 'ar' ? 'البحث الشامل في التطبيق' : 'Global Search'}
        >
          <Search className="w-4 h-4 text-amber-300" />
          <span className="whitespace-nowrap">
            {lang === 'ar' ? 'البحث الشامل' : 'Search'}
          </span>
          <kbd className="hidden lg:inline-block text-[11px] font-mono opacity-80 px-1.5 py-0.5 rounded bg-black/20">
            Ctrl+K
          </kbd>
        </button>
      </div>
    </header>
  );
};

export const OperationalUtilityBar: React.FC = () => {
  const {
    lang,
    setLang,
    theme,
    toggleTheme,
    highContrastMode,
    setHighContrastMode,
    activeNav,
    canGoBack,
    goBack,
    navigateTo,
    inAppAlerts,
    setIsNotificationsOpen,
    staffRole,
    isOnline,
    isSyncing,
    pendingSyncCount,
    userCoords,
    pushToast,
  } = useQuranApp();

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const t = UI_LABELS[lang];
  const hijriToday = useMemo(() => getFormattedHijriToday(new Date()), []);

  const unreadCount = useMemo(
    () => inAppAlerts.filter((a) => !a.isRead).length,
    [inAppAlerts]
  );

  const handleVoiceNavigation = () => {
    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      pushToast(
        'warning',
        lang === 'ar'
          ? 'التنقل الصوتي غير مدعوم في هذا المتصفح، يرجى استخدام البحث الشامل'
          : 'Voice recognition is not supported in this browser'
      );
      return;
    }

    if (isListeningVoice) {
      setIsListeningVoice(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListeningVoice(true);
      pushToast(
        'info',
        lang === 'ar'
          ? 'تحدث الآن... مثال: "سورة الكهف" أو "مواقيت الصلاة" أو "أذكار الصباح"'
          : 'Listening... Try saying "Surah Kahf", "Prayer times", or "Adhkar"'
      );

      recognition.onresult = (event: any) => {
        setIsListeningVoice(false);
        const transcript = String(event?.results?.[0]?.[0]?.transcript || '').trim();
        if (!transcript) return;

        const normalized = transcript.toLowerCase();
        // Match Surah name in Arabic or English
        const matchedSurah = ALL_SURAHS.find(
          (s) =>
            transcript.includes(s.nameAr) ||
            normalized.includes(s.nameEn.toLowerCase())
        );

        if (matchedSurah) {
          navigateTo('quran', { quranTab: 'mushaf', surah: matchedSurah.number, ayah: 1 });
          pushToast(
            'success',
            lang === 'ar'
              ? `تم الانتقال صوتياً إلى سورة ${matchedSurah.nameAr}`
              : `Opened Surah ${matchedSurah.nameEn}`
          );
          return;
        }

        if (transcript.includes('صلاة') || transcript.includes('مواقيت') || normalized.includes('prayer')) {
          navigateTo('tools', { toolsTab: 'prayer' });
        } else if (transcript.includes('قبلة') || transcript.includes('قبله') || normalized.includes('qibla')) {
          navigateTo('tools', { toolsTab: 'qibla' });
        } else if (transcript.includes('حفظ') || normalized.includes('hifz')) {
          navigateTo('tools', { toolsTab: 'hifz' });
        } else if (transcript.includes('تجويد') || normalized.includes('tajweed')) {
          navigateTo('tools', { toolsTab: 'tajweed' });
        } else if (transcript.includes('ختمة') || transcript.includes('ختمه') || normalized.includes('khatmah')) {
          navigateTo('tools', { toolsTab: 'khatmah' });
        } else if (transcript.includes('أذكار') || transcript.includes('اذكار') || normalized.includes('adhkar')) {
          navigateTo('adhkar');
        } else if (transcript.includes('تفسير') || normalized.includes('tafsir')) {
          navigateTo('quran', { quranTab: 'tafsir' });
        } else if (transcript.includes('مكتبة') || transcript.includes('مكتبه') || normalized.includes('library')) {
          navigateTo('library');
        } else if (transcript.includes('مساعد') || normalized.includes('assistant')) {
          navigateTo('assistant');
        } else if (transcript.includes('مجتمع') || normalized.includes('community')) {
          navigateTo('community');
        } else if (transcript.includes('حساب') || normalized.includes('account')) {
          navigateTo('account');
        } else if (transcript.includes('مصحف') || transcript.includes('قرآن') || normalized.includes('quran')) {
          navigateTo('quran', { quranTab: 'mushaf' });
        } else {
          pushToast(
            'info',
            lang === 'ar'
              ? `تم سماع: "${transcript}" — يمكنك قول اسم السورة أو القسم مباشرة`
              : `Heard: "${transcript}"`
          );
        }
      };

      recognition.onerror = () => {
        setIsListeningVoice(false);
      };
      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognition.start();
    } catch {
      setIsListeningVoice(false);
    }
  };

  return (
    <>
      {!isOnline && (
        <div className="bg-amber-950 text-amber-100 px-4 py-2 text-xs sm:text-sm border-b border-amber-800/60">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{MESSAGE_LIBRARY[lang].errors.offline}</span>
            </span>
            {pendingSyncCount > 0 && (
              <span className="text-xs text-amber-300 whitespace-nowrap">
                {lang === 'ar'
                  ? `${pendingSyncCount} تغييرات بانتظار المزامنة`
                  : `${pendingSyncCount} pending sync`}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="bg-[#F4EFE6]/90 dark:bg-[#0D1712] border-b border-stone-200/80 dark:border-emerald-950/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Operational Hijri Date, Active Location & History Back */}
          <div className="flex items-center flex-wrap gap-2 text-stone-600 dark:text-stone-300">
            {canGoBack && (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-[#13221B] border border-stone-200 dark:border-emerald-900/70 text-stone-800 dark:text-stone-200 hover:border-emerald-700 transition-colors"
                title={t.goBack}
              >
                {lang === 'ar' ? (
                  <ArrowRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowLeft className="w-3.5 h-3.5" />
                )}
                <span>{lang === 'ar' ? 'السابق' : 'Back'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => navigateTo('tools', { toolsTab: 'hijri' })}
              className="inline-flex items-center gap-1.5 hover:text-[#0E4A3A] dark:hover:text-amber-300 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-[#0E4A3A] dark:text-amber-300 shrink-0" />
              <span>{lang === 'ar' ? hijriToday.ar : hijriToday.en}</span>
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => navigateTo('tools', { toolsTab: 'prayer' })}
              className="inline-flex items-center gap-1 hover:text-[#0E4A3A] dark:hover:text-amber-300 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-[#0E4A3A] dark:text-amber-300 shrink-0" />
              <span>{userCoords.labelAr}</span>
            </button>
            {isSyncing && (
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 ms-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>{lang === 'ar' ? 'مزامنة...' : 'Syncing...'}</span>
              </span>
            )}
          </div>

          {/* Secondary Section Shortcuts & Accessibility / Utility Controls */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigateTo('assistant')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                activeNav === 'assistant'
                  ? 'bg-[#0E4A3A] text-white dark:bg-amber-500 dark:text-stone-950 font-semibold'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-emerald-950/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.navAssistant}</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('community')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                activeNav === 'community'
                  ? 'bg-[#0E4A3A] text-white dark:bg-amber-500 dark:text-stone-950 font-semibold'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-emerald-950/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{t.navCommunity}</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('account')}
              className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                activeNav === 'account'
                  ? 'bg-[#0E4A3A] text-white dark:bg-amber-500 dark:text-stone-950 font-semibold'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-emerald-950/60'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{t.navAccount}</span>
            </button>

            {staffRole && (
              <button
                type="button"
                onClick={() => navigateTo('admin')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                  activeNav === 'admin'
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'text-amber-800 dark:text-amber-300 hover:bg-amber-500/15'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t.navAdmin}</span>
              </button>
            )}

            <span className="h-4 w-px bg-stone-300 dark:bg-emerald-900 mx-0.5 hidden sm:inline-block" />

            {/* Voice Navigation */}
            <button
              type="button"
              onClick={handleVoiceNavigation}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
                isListeningVoice
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white dark:bg-[#13221B] border-stone-200 dark:border-emerald-900/70 text-stone-700 dark:text-stone-200 hover:border-emerald-700'
              }`}
              title={lang === 'ar' ? 'التنقل الصوتي السريع' : 'Voice Navigation'}
            >
              {isListeningVoice ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {lang === 'ar' ? 'تنقل صوتي' : 'Voice'}
              </span>
            </button>

            {/* Blind & High-Contrast Mode */}
            <button
              type="button"
              onClick={() => setHighContrastMode(!highContrastMode)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
                highContrastMode
                  ? 'bg-[#0E4A3A] text-white border-[#0E4A3A] dark:bg-amber-400 dark:text-stone-950'
                  : 'bg-white dark:bg-[#13221B] border-stone-200 dark:border-emerald-900/70 text-stone-700 dark:text-stone-200 hover:border-emerald-700'
              }`}
              title={
                lang === 'ar'
                  ? 'وضع التباين العالي وتكبير العناصر للمكفوفين وكبار السن'
                  : 'High-Contrast & Large Controls Accessibility Mode'
              }
            >
              <Contrast className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">
                {lang === 'ar' ? 'تباين واضح' : 'A11y'}
              </span>
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-[#13221B] border border-stone-200 dark:border-emerald-900/70 text-stone-700 dark:text-stone-200 hover:border-emerald-700 transition-colors"
              aria-label={lang === 'ar' ? 'تبديل الوضع الليلي والنهاري' : 'Toggle Theme'}
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-[#0E4A3A]" />
              )}
              <span className="hidden sm:inline">
                {theme === 'dark'
                  ? lang === 'ar'
                    ? 'نهاري'
                    : 'Light'
                  : lang === 'ar'
                    ? 'ليلي'
                    : 'Dark'}
              </span>
            </button>

            {/* UI Language Toggle */}
            <button
              type="button"
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-[#13221B] border border-stone-200 dark:border-emerald-900/70 text-stone-700 dark:text-stone-200 hover:border-emerald-700 transition-colors"
              title={
                lang === 'ar'
                  ? 'تغيير لغة واجهة التطبيق مع الحفاظ الكامل على النص القرآني العربي'
                  : 'Switch UI language while preserving Arabic Quranic scripture'
              }
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Notifications Trigger */}
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(true)}
              className="relative inline-flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-[#13221B] border border-stone-200 dark:border-emerald-900/70 text-stone-700 dark:text-stone-200 hover:border-emerald-700 transition-colors"
              aria-label={lang === 'ar' ? 'الإشعارات والتذكيرات' : 'Notifications'}
            >
              <Bell className="w-3.5 h-3.5" />
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                  ({unreadCount})
                </span>
              )}
            </button>

            {/* Install PWA Trigger */}
            {!isInstalled && (isInstallable || isIOS) && (
              <button
                type="button"
                onClick={() => {
                  if (isIOS && !isInstallable) {
                    setShowIOSGuide(true);
                  } else {
                    void install();
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'تثبيت التطبيق' : 'Install App'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* iOS Add to Home Screen Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-900 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                {lang === 'ar' ? 'تثبيت اطمئنان القرآن على جهازك' : 'Install Quran Reassurance'}
              </h3>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="p-1 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-4">
              {lang === 'ar'
                ? 'لتثبيت التطبيق والوصول السريع للمصحف والأذكار دون إنترنت على أجهزة iPhone و iPad: اضغط على زر المشاركة (Share) في متصفح Safari ثم اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).'
                : 'Tap the Share button in Safari, then choose "Add to Home Screen" for full-screen offline access.'}
            </p>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-lg bg-[#0E4A3A] text-white text-sm font-semibold"
            >
              {lang === 'ar' ? 'تم الفهم' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

interface BreadcrumbNode {
  id: string;
  label: string;
  shortLabel?: string;
  onClick?: () => void;
  isCurrent?: boolean;
  icon?: React.ReactNode;
}

const LIBRARY_CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
  all: { ar: 'جميع الكتب', en: 'All Books' },
  saved: { ar: 'القراءة لاحقاً', en: 'Saved Books' },
  quran_sciences: { ar: 'علوم القرآن', en: 'Quran Sciences' },
  tafsir: { ar: 'كتب التفسير', en: 'Tafsir Books' },
  hadith: { ar: 'الحديث الشريف', en: 'Hadith' },
  seerah: { ar: 'السيرة النبوية', en: 'Prophetic Seerah' },
  prophets_stories: { ar: 'قصص الأنبياء', en: 'Stories of Prophets' },
  tajweed: { ar: 'كتب التجويد', en: 'Tajweed Books' },
  aqeedah: { ar: 'العقيدة الصحيحة', en: 'Aqeedah' },
  fiqh: { ar: 'الفقه الميسر', en: 'Fiqh' },
  adhkar_lectures: { ar: 'الأذكار والدروس الصوتية', en: 'Adhkar & Lectures' },
};

const ADHKAR_CATEGORY_LABELS: Record<AdhkarTabId, { ar: string; en: string }> = {
  all: { ar: 'جميع الأذكار والأدعية', en: 'All Adhkar & Duas' },
  morning: { ar: 'أذكار الصباح', en: 'Morning Adhkar' },
  evening: { ar: 'أذكار المساء', en: 'Evening Adhkar' },
  after_prayer: { ar: 'أذكار بعد الصلاة', en: 'After Prayer' },
  prayer: { ar: 'أذكار الصلاة', en: 'In Prayer' },
  sleep: { ar: 'أذكار النوم والاستيقاظ', en: 'Sleep & Waking' },
  travel: { ar: 'دعاء السفر', en: 'Travel Dua' },
  quranic_duas: { ar: 'الأدعية القرآنية', en: 'Quranic Duas' },
  prophetic_duas: { ar: 'الأدعية النبوية', en: 'Prophetic Duas' },
  prophets_duas: { ar: 'أدعية الأنبياء', en: 'Prophets’ Duas' },
  favorites: { ar: 'الأذكار المفضلة', en: 'Favorite Adhkar' },
  tasbih: { ar: 'المسبحة الإلكترونية', en: 'Electronic Tasbih' },
};

const ADMIN_TAB_LABELS: Record<AdminTabId, { ar: string; en: string }> = {
  health: { ar: 'سلامة المصحف والخادم', en: 'System & Script Health' },
  catalog: { ar: 'إدارة المصادر والكتب', en: 'Verified Sources Catalog' },
  broadcast: { ar: 'بث التنبيهات والمناسبات', en: 'Broadcast Alerts' },
  moderation: { ar: 'مراجعة البلاغات', en: 'Moderation Queue' },
  roles: { ar: 'صلاحيات المشرفين', en: 'Staff Roles' },
  audit: { ar: 'سجل التدقيق الرقابي', en: 'Audit Trail' },
};

export const InternalPageBreadcrumbs: React.FC = () => {
  const {
    lang,
    activeNav,
    quranTab,
    toolsTab,
    mushafDisplayMode,
    activeSurah,
    activeAyah,
    activePage,
    libraryCategory,
    activeLibraryBookId,
    activeLibraryChapterIdx,
    adhkarCategory,
    adminTab,
    navigateTo,
  } = useQuranApp();

  const currentSurah = ALL_SURAHS[(activeSurah || 1) - 1] || ALL_SURAHS[0];
  const activeBook = useMemo(
    () =>
      activeLibraryBookId
        ? ISLAMIC_LIBRARY_BOOKS.find((b) => b.id === activeLibraryBookId) || null
        : null,
    [activeLibraryBookId]
  );

  const crumbs = useMemo<BreadcrumbNode[]>(() => {
    if (activeNav === 'home') return [];

    const homeNode: BreadcrumbNode = {
      id: 'home',
      label: lang === 'ar' ? 'الرئيسية' : 'Home',
      shortLabel: lang === 'ar' ? 'الرئيسية' : 'Home',
      icon: <Home className="w-3.5 h-3.5 shrink-0" />,
      onClick: () => navigateTo('home'),
    };

    if (activeNav === 'quran') {
      const surahIndexNode: BreadcrumbNode = {
        id: 'quran_surahs',
        label: lang === 'ar' ? 'فهرس السور' : 'Surah Index',
        shortLabel: lang === 'ar' ? 'فهرس السور' : 'Surah Index',
        onClick: () => navigateTo('quran', { quranTab: 'surahs' }),
      };

      if (quranTab === 'surahs') {
        return [
          homeNode,
          {
            id: 'quran_root',
            label: lang === 'ar' ? 'القرآن الكريم' : 'Noble Quran',
            shortLabel: lang === 'ar' ? 'المصحف الشريف' : 'Mushaf',
            onClick: () => navigateTo('quran', { quranTab: 'mushaf' }),
          },
          {
            id: 'surahs_current',
            label: lang === 'ar' ? 'فهرس السور (114 سورة)' : 'Surah Index (114)',
            isCurrent: true,
          },
        ];
      }

      if (quranTab === 'juz') {
        return [
          homeNode,
          surahIndexNode,
          {
            id: 'juz_current',
            label: lang === 'ar' ? 'الأجزاء والأحزاب (30 جزءاً)' : 'Juz & Hizb (30)',
            isCurrent: true,
          },
        ];
      }

      if (quranTab === 'mushaf') {
        if (mushafDisplayMode === 'page') {
          return [
            homeNode,
            surahIndexNode,
            {
              id: 'quran_juz',
              label: lang === 'ar' ? 'الأجزاء والأحزاب' : 'Juz & Hizb',
              shortLabel: lang === 'ar' ? 'الأجزاء والأحزاب' : 'Juz Index',
              onClick: () => navigateTo('quran', { quranTab: 'juz' }),
            },
            {
              id: 'mushaf_page_current',
              label:
                lang === 'ar'
                  ? `صفحة المصحف ${activePage} من 604`
                  : `Mushaf Page ${activePage} of 604`,
              isCurrent: true,
            },
          ];
        }

        const surahDetailLabel =
          lang === 'ar'
            ? `سورة ${currentSurah.nameAr} (${
                currentSurah.revelationType === 'Makki' ? 'مكية' : 'مدنية'
              } · ${currentSurah.ayahCount} آية)`
            : `Surah ${currentSurah.nameEn} (${currentSurah.ayahCount} Ayahs)`;

        if (activeAyah > 1) {
          return [
            homeNode,
            surahIndexNode,
            {
              id: 'surah_overview',
              label: lang === 'ar' ? `سورة ${currentSurah.nameAr}` : `Surah ${currentSurah.nameEn}`,
              shortLabel:
                lang === 'ar' ? `سورة ${currentSurah.nameAr}` : `Surah ${currentSurah.nameEn}`,
              onClick: () =>
                navigateTo('quran', {
                  quranTab: 'mushaf',
                  mushafMode: 'surah',
                  surah: currentSurah.number,
                  ayah: 1,
                }),
            },
            {
              id: 'ayah_current',
              label: lang === 'ar' ? `الآية ${activeAyah}` : `Ayah ${activeAyah}`,
              isCurrent: true,
            },
          ];
        }

        return [
          homeNode,
          surahIndexNode,
          {
            id: 'surah_current',
            label: surahDetailLabel,
            isCurrent: true,
          },
        ];
      }

      if (quranTab === 'tafsir') {
        return [
          homeNode,
          surahIndexNode,
          {
            id: 'tafsir_surah_parent',
            label: lang === 'ar' ? `سورة ${currentSurah.nameAr}` : `Surah ${currentSurah.nameEn}`,
            shortLabel:
              lang === 'ar' ? `سورة ${currentSurah.nameAr}` : `Surah ${currentSurah.nameEn}`,
            onClick: () =>
              navigateTo('quran', {
                quranTab: 'mushaf',
                mushafMode: 'surah',
                surah: currentSurah.number,
                ayah: activeAyah,
              }),
          },
          {
            id: 'tafsir_ayah_current',
            label:
              lang === 'ar'
                ? `تفسير الآية ${activeAyah} وأسباب النزول`
                : `Tafsir of Ayah ${activeAyah}`,
            isCurrent: true,
          },
        ];
      }

      if (quranTab === 'recitations') {
        return [
          homeNode,
          surahIndexNode,
          {
            id: 'recitation_surah_parent',
            label: lang === 'ar' ? `سورة ${currentSurah.nameAr}` : `Surah ${currentSurah.nameEn}`,
            shortLabel:
              lang === 'ar' ? `سورة ${currentSurah.nameAr}` : `Surah ${currentSurah.nameEn}`,
            onClick: () =>
              navigateTo('quran', {
                quranTab: 'mushaf',
                mushafMode: 'surah',
                surah: currentSurah.number,
                ayah: 1,
              }),
          },
          {
            id: 'recitations_current',
            label: lang === 'ar' ? 'التلاوات الصوتية والقوائم' : 'Audio Recitations & Playlists',
            isCurrent: true,
          },
        ];
      }

      if (quranTab === 'compare_reciters') {
        return [
          homeNode,
          surahIndexNode,
          {
            id: 'recitations_parent',
            label: lang === 'ar' ? 'التلاوات الصوتية' : 'Audio Recitations',
            shortLabel: lang === 'ar' ? 'التلاوات الصوتية' : 'Recitations',
            onClick: () => navigateTo('quran', { quranTab: 'recitations' }),
          },
          {
            id: 'compare_current',
            label: lang === 'ar' ? 'مقارنة القراء' : 'Compare Reciters',
            isCurrent: true,
          },
        ];
      }

      return [
        homeNode,
        surahIndexNode,
        {
          id: 'quran_search_current',
          label: lang === 'ar' ? 'البحث القرآني الموضوعي' : 'Thematic Quran Search',
          isCurrent: true,
        },
      ];
    }

    if (activeNav === 'library') {
      const libraryRootNode: BreadcrumbNode = {
        id: 'library_root',
        label: lang === 'ar' ? 'المكتبة الإسلامية' : 'Islamic Library',
        shortLabel: lang === 'ar' ? 'المكتبة الإسلامية' : 'Islamic Library',
        onClick: () =>
          navigateTo('library', {
            libraryCategory: 'all',
            libraryBookId: null,
            libraryChapterIdx: 0,
          }),
      };

      if (activeBook) {
        const bookCatMeta =
          LIBRARY_CATEGORY_LABELS[activeBook.category] || LIBRARY_CATEGORY_LABELS.all;
        const categoryNode: BreadcrumbNode = {
          id: `lib_cat_${activeBook.category}`,
          label: lang === 'ar' ? bookCatMeta.ar : bookCatMeta.en,
          shortLabel: lang === 'ar' ? bookCatMeta.ar : bookCatMeta.en,
          onClick: () =>
            navigateTo('library', {
              libraryCategory: activeBook.category,
              libraryBookId: null,
              libraryChapterIdx: 0,
            }),
        };

        if (activeBook.chapters.length > 1 && activeLibraryChapterIdx > 0) {
          const chHeading =
            activeBook.chapters[activeLibraryChapterIdx]?.headingAr ||
            (lang === 'ar' ? `الفصل ${activeLibraryChapterIdx + 1}` : `Chapter ${activeLibraryChapterIdx + 1}`);
          return [
            homeNode,
            libraryRootNode,
            categoryNode,
            {
              id: `lib_book_${activeBook.id}`,
              label: lang === 'ar' ? activeBook.titleAr : activeBook.titleEn,
              shortLabel: lang === 'ar' ? activeBook.titleAr : activeBook.titleEn,
              onClick: () =>
                navigateTo('library', {
                  libraryCategory: activeBook.category,
                  libraryBookId: activeBook.id,
                  libraryChapterIdx: 0,
                }),
            },
            {
              id: `lib_ch_${activeLibraryChapterIdx}`,
              label: chHeading,
              isCurrent: true,
            },
          ];
        }

        return [
          homeNode,
          libraryRootNode,
          categoryNode,
          {
            id: `lib_book_${activeBook.id}`,
            label: lang === 'ar' ? activeBook.titleAr : activeBook.titleEn,
            isCurrent: true,
          },
        ];
      }

      if (libraryCategory !== 'all') {
        const catMeta = LIBRARY_CATEGORY_LABELS[libraryCategory] || LIBRARY_CATEGORY_LABELS.all;
        return [
          homeNode,
          libraryRootNode,
          {
            id: `lib_cat_${libraryCategory}`,
            label: lang === 'ar' ? catMeta.ar : catMeta.en,
            isCurrent: true,
          },
        ];
      }

      return [
        homeNode,
        {
          id: 'library_current',
          label: lang === 'ar' ? 'المكتبة الإسلامية الموثقة' : 'Accredited Islamic Library',
          isCurrent: true,
        },
      ];
    }

    if (activeNav === 'adhkar') {
      if (adhkarCategory !== 'all') {
        const catMeta = ADHKAR_CATEGORY_LABELS[adhkarCategory] || ADHKAR_CATEGORY_LABELS.morning;
        return [
          homeNode,
          {
            id: 'adhkar_root',
            label: lang === 'ar' ? 'الأذكار والأدعية' : 'Adhkar & Duas',
            shortLabel: lang === 'ar' ? 'جميع الأذكار' : 'All Adhkar',
            onClick: () => navigateTo('adhkar', { adhkarCategory: 'all' }),
          },
          {
            id: `adhkar_${adhkarCategory}`,
            label: lang === 'ar' ? catMeta.ar : catMeta.en,
            isCurrent: true,
          },
        ];
      }
      return [
        homeNode,
        {
          id: 'adhkar_all_current',
          label: lang === 'ar' ? 'جميع الأذكار والأدعية النبوية' : 'All Authenticated Adhkar',
          isCurrent: true,
        },
      ];
    }

    if (activeNav === 'tools') {
      const toolsLabels: Record<string, { ar: string; en: string }> = {
        prayer: { ar: 'مواقيت الصلاة والأذان', en: 'Prayer Times & Adhan' },
        qibla: { ar: 'اتجاه القبلة الدقيق', en: 'Qibla Direction' },
        hijri: { ar: 'التقويم الهجري والمناسبات', en: 'Hijri Calendar' },
        hifz: { ar: 'خطة الحفظ والاختبارات', en: 'Hifz Planner & Quizzes' },
        tajweed: { ar: 'تعليم التجويد والأطفال', en: 'Tajweed & Kids' },
        khatmah: { ar: 'ختمة القرآن ومتابعة الورد', en: 'Khatmah Planner' },
        haramain: { ar: 'الحرمان والمساجد التاريخية', en: 'Haramain & Historic Mosques' },
      };

      if (toolsTab !== 'prayer') {
        const currentTool = toolsLabels[toolsTab] || toolsLabels.prayer;
        return [
          homeNode,
          {
            id: 'tools_root',
            label: lang === 'ar' ? 'الخدمات والأدوات' : 'Islamic Tools',
            shortLabel: lang === 'ar' ? 'الخدمات والأدوات' : 'Islamic Tools',
            onClick: () => navigateTo('tools', { toolsTab: 'prayer' }),
          },
          {
            id: `tool_${toolsTab}`,
            label: lang === 'ar' ? currentTool.ar : currentTool.en,
            isCurrent: true,
          },
        ];
      }

      return [
        homeNode,
        {
          id: 'tools_prayer_current',
          label:
            lang === 'ar'
              ? 'الخدمات والأدوات — مواقيت الصلاة والأذان'
              : 'Islamic Tools — Prayer Times & Adhan',
          isCurrent: true,
        },
      ];
    }

    if (activeNav === 'assistant') {
      return [
        homeNode,
        {
          id: 'assistant_current',
          label: lang === 'ar' ? 'المساعد القرآني الذكي' : 'Smart Quranic Assistant',
          isCurrent: true,
        },
      ];
    }

    if (activeNav === 'community') {
      return [
        homeNode,
        {
          id: 'community_current',
          label: lang === 'ar' ? 'مجتمع القرآن والختمات الجماعية' : 'Quran Community & Circles',
          isCurrent: true,
        },
      ];
    }

    if (activeNav === 'account') {
      return [
        homeNode,
        {
          id: 'account_current',
          label: lang === 'ar' ? 'حسابي وإحصائيات الورد والحفظ' : 'My Account & Progress',
          isCurrent: true,
        },
      ];
    }

    if (activeNav === 'admin') {
      if (adminTab !== 'health') {
        const tabMeta = ADMIN_TAB_LABELS[adminTab] || ADMIN_TAB_LABELS.health;
        return [
          homeNode,
          {
            id: 'admin_root',
            label: lang === 'ar' ? 'لوحة الإدارة' : 'Admin Console',
            shortLabel: lang === 'ar' ? 'لوحة الإدارة' : 'Admin Console',
            onClick: () => navigateTo('admin', { adminTab: 'health' }),
          },
          {
            id: `admin_${adminTab}`,
            label: lang === 'ar' ? tabMeta.ar : tabMeta.en,
            isCurrent: true,
          },
        ];
      }
      return [
        homeNode,
        {
          id: 'admin_health_current',
          label: lang === 'ar' ? 'لوحة الإدارة والحوكمة العلمية' : 'Admin & Governance Console',
          isCurrent: true,
        },
      ];
    }

    return [];
  }, [
    activeNav,
    lang,
    quranTab,
    toolsTab,
    mushafDisplayMode,
    activePage,
    activeAyah,
    currentSurah,
    activeBook,
    activeLibraryChapterIdx,
    libraryCategory,
    adhkarCategory,
    adminTab,
    navigateTo,
  ]);

  if (activeNav === 'home' || crumbs.length === 0) {
    return null;
  }

  const parentNode = crumbs.length >= 2 ? crumbs[crumbs.length - 2] : null;
  const SeparatorIcon = lang === 'ar' ? ChevronLeft : ChevronRight;
  const UpLevelIcon = lang === 'ar' ? CornerRightUp : CornerLeftUp;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-0">
      <nav
        aria-label={lang === 'ar' ? 'مسار التنقل' : 'Breadcrumb'}
        className="rounded-xl bg-[#F4EFE6]/80 dark:bg-[#0D1914] border border-stone-200/85 dark:border-emerald-950/80 px-3.5 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-3"
      >
        <ol className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm min-w-0">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1 || crumb.isCurrent;
            return (
              <React.Fragment key={crumb.id}>
                <li className="inline-flex items-center min-w-0">
                  {!isLast && crumb.onClick ? (
                    <button
                      type="button"
                      onClick={crumb.onClick}
                      className="inline-flex items-center gap-1.5 text-stone-600 dark:text-stone-300 hover:text-[#0E4A3A] dark:hover:text-amber-300 hover:underline underline-offset-4 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1 py-0.5"
                    >
                      {crumb.icon}
                      <span className="truncate max-w-[180px] sm:max-w-[260px]">{crumb.label}</span>
                    </button>
                  ) : (
                    <span
                      aria-current="page"
                      className="inline-flex items-center gap-1.5 font-bold text-[#0E4A3A] dark:text-amber-300 px-1 py-0.5 truncate max-w-[230px] sm:max-w-[400px]"
                    >
                      {crumb.icon}
                      <span className="truncate">{crumb.label}</span>
                    </span>
                  )}
                </li>
                {!isLast && (
                  <li aria-hidden="true" className="inline-flex items-center text-stone-400 dark:text-emerald-800">
                    <SeparatorIcon className="w-3.5 h-3.5 shrink-0" />
                  </li>
                )}
              </React.Fragment>
            );
          })}
        </ol>

        {parentNode && parentNode.onClick && (
          <button
            type="button"
            onClick={parentNode.onClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#13241C] border border-stone-200 dark:border-emerald-900/80 text-xs font-semibold text-stone-800 dark:text-stone-100 hover:border-[#0E4A3A] dark:hover:border-amber-400/70 hover:text-[#0E4A3A] dark:hover:text-amber-300 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <UpLevelIcon className="w-3.5 h-3.5 text-[#0E4A3A] dark:text-amber-300 shrink-0" />
            <span className="whitespace-nowrap">
              {lang === 'ar'
                ? `المستوى الأعلى: ${parentNode.shortLabel || parentNode.label}`
                : `Up to: ${parentNode.shortLabel || parentNode.label}`}
            </span>
          </button>
        )}
      </nav>
    </div>
  );
};

export const MobileBottomNav: React.FC = () => {
  const { lang, activeNav, navigateTo } = useQuranApp();

  const items: Array<{ id: MainNavId; labelAr: string; labelEn: string; icon: React.ReactNode }> = [
    { id: 'home', labelAr: 'الرئيسية', labelEn: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'quran', labelAr: 'القرآن', labelEn: 'Quran', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'adhkar', labelAr: 'الأذكار', labelEn: 'Adhkar', icon: <HeartHandshake className="w-4 h-4" /> },
    { id: 'tools', labelAr: 'أدواتي', labelEn: 'Tools', icon: <Compass className="w-4 h-4" /> },
    { id: 'account', labelAr: 'حسابي', labelEn: 'Account', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <nav
      aria-label="شريط التنقل السفلي"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-[#FBF9F5]/95 dark:bg-[#09120E]/95 backdrop-blur-md border-t border-stone-200 dark:border-emerald-950/90 flex items-center justify-around px-1"
    >
      {items.map((item) => {
        const active = activeNav === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => navigateTo(item.id)}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[11px] font-medium transition-colors ${
              active
                ? 'text-[#0E4A3A] dark:text-amber-300 font-bold'
                : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            {item.icon}
            <span className="truncate">{lang === 'ar' ? item.labelAr : item.labelEn}</span>
          </button>
        );
      })}
    </nav>
  );
};

export const AudioPlayerBar: React.FC = () => {
  const {
    lang,
    audioState,
    selectedReciter,
    setSelectedReciter,
    togglePlayPause,
    stopAudio,
    setPlaybackRate,
    setRepeatMode,
    setAutoAdvance,
    setSleepTimer,
    navigateTo,
  } = useQuranApp();

  if (!audioState.verseText) return null;

  return (
    <div className="fixed bottom-14 md:bottom-0 inset-x-0 z-30 bg-[#0B3B2E] dark:bg-[#071D16] text-[#FBF9F5] border-t border-amber-400/30 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Active Verse & Reciter Info */}
        <div className="flex items-center gap-3 w-full lg:w-auto min-w-0">
          <button
            type="button"
            onClick={togglePlayPause}
            className="w-10 h-10 rounded-full bg-amber-400 hover:bg-amber-300 text-stone-950 flex items-center justify-center shrink-0 transition-colors"
            aria-label={audioState.isPlaying ? 'إيقاف مؤقت' : 'تشغيل التلاوة'}
          >
            {audioState.isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : audioState.isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>

          <button
            type="button"
            onClick={stopAudio}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 shrink-0"
            title={lang === 'ar' ? 'إيقاف التلاوة' : 'Stop'}
          >
            <Square className="w-4 h-4" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <Volume2 className="w-3.5 h-3.5 shrink-0" />
              <button
                type="button"
                onClick={() =>
                  navigateTo('quran', {
                    quranTab: 'mushaf',
                    surah: audioState.surahNumber,
                    ayah: audioState.ayahNumber,
                  })
                }
                className="font-semibold hover:underline truncate"
              >
                سورة {audioState.surahNameAr} · الآية {audioState.ayahNumber}
              </button>
            </div>
            <p className="font-quran-uthmani text-sm sm:text-base text-white truncate">
              {audioState.verseText}
            </p>
          </div>
        </div>

        {/* Controls: Reciter, Speed, Repeat, Auto-Advance, Sleep Timer */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end text-xs">
          <select
            aria-label="اختيار القارئ"
            value={selectedReciter}
            onChange={(e) => setSelectedReciter(e.target.value)}
            className="bg-black/25 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            {VERIFIED_RECITERS.map((r) => (
              <option key={r.id} value={r.id} className="text-stone-900">
                {r.nameAr}
              </option>
            ))}
          </select>

          <select
            aria-label="سرعة التلاوة"
            value={audioState.playbackRate}
            onChange={(e) => setPlaybackRate(Number(e.target.value))}
            className="bg-black/25 border border-white/15 rounded-lg px-2 py-1.5 text-xs text-white tabular-nums"
          >
            <option value={0.75} className="text-stone-900">0.75x</option>
            <option value={1} className="text-stone-900">1.0x</option>
            <option value={1.25} className="text-stone-900">1.25x</option>
            <option value={1.5} className="text-stone-900">1.5x</option>
          </select>

          <button
            type="button"
            onClick={() =>
              setRepeatMode(
                audioState.repeatMode === 'none'
                  ? 'ayah'
                  : audioState.repeatMode === 'ayah'
                    ? 'range'
                    : 'none'
              )
            }
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-colors ${
              audioState.repeatMode !== 'none'
                ? 'bg-amber-400 text-stone-950 border-amber-400 font-semibold'
                : 'bg-black/20 border-white/15 text-stone-200'
            }`}
            title="تكرار الآية أو النطاق للحفظ"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>
              {audioState.repeatMode === 'ayah'
                ? lang === 'ar'
                  ? 'تكرار الآية'
                  : 'Loop Ayah'
                : audioState.repeatMode === 'range'
                  ? lang === 'ar'
                    ? 'تكرار النطاق'
                    : 'Loop Range'
                  : lang === 'ar'
                    ? 'بدون تكرار'
                    : 'No Loop'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAutoAdvance(!audioState.autoAdvance)}
            className={`px-2.5 py-1.5 rounded-lg border transition-colors ${
              audioState.autoAdvance
                ? 'bg-emerald-700/80 border-emerald-400/50 text-white'
                : 'bg-black/20 border-white/15 text-stone-300'
            }`}
          >
            {lang === 'ar' ? 'انتقال تلقائي' : 'Auto-Next'}
          </button>

          <div className="inline-flex items-center gap-1 bg-black/25 border border-white/15 rounded-lg px-2 py-1">
            <Timer className="w-3.5 h-3.5 text-amber-300" />
            <select
              aria-label="مؤقت إيقاف التلاوة"
              value={audioState.sleepTimerMinutes ?? ''}
              onChange={(e) =>
                setSleepTimer(e.target.value ? Number(e.target.value) : null)
              }
              className="bg-transparent text-xs text-white focus:outline-none"
            >
              <option value="" className="text-stone-900">
                {lang === 'ar' ? 'مؤقت النوم' : 'Sleep Timer'}
              </option>
              <option value="15" className="text-stone-900">15 د</option>
              <option value="30" className="text-stone-900">30 د</option>
              <option value="45" className="text-stone-900">45 د</option>
              <option value="60" className="text-stone-900">60 د</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GlobalSearchModal: React.FC = () => {
  const {
    lang,
    isSearchModalOpen,
    setIsSearchModalOpen,
    navigateTo,
    playVerseAudio,
  } = useQuranApp();

  const [queryText, setQueryText] = useState('');
  const [activeTab, setActiveTab] = useState<
    'all' | 'quran' | 'tafsir' | 'surahs' | 'adhkar_library'
  >('all');
  const [quranMatches, setQuranMatches] = useState<SearchApiMatch[]>([]);
  const [tafsirMatches, setTafsirMatches] = useState<SearchApiMatch[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('qr_recent_searches');
      return raw ? JSON.parse(raw) : ['تطمئن القلوب', 'آية الكرسي', 'سورة الكهف', 'الصابرين'];
    } catch {
      return ['تطمئن القلوب', 'سورة الكهف'];
    }
  });

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isSearchModalOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isSearchModalOpen]);

  const saveRecentSearch = (term: string) => {
    const clean = term.trim();
    if (clean.length < 2) return;
    setRecentSearches((prev) => {
      const updated = [clean, ...prev.filter((x) => x !== clean)].slice(0, 8);
      localStorage.setItem('qr_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  // Debounced API search for Quranic verses & Tafsir/Translations
  useEffect(() => {
    if (!isSearchModalOpen) return;
    const clean = queryText.trim();
    if (clean.length < 2) {
      setQuranMatches([]);
      setTafsirMatches([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsSearchingApi(true);
      try {
        const [qRes, tRes] = await Promise.allSettled([
          fetch(`/api/quran/search?q=${encodeURIComponent(clean)}&scope=quran`),
          fetch(`/api/quran/search?q=${encodeURIComponent(clean)}&scope=tafsir`),
        ]);

        if (qRes.status === 'fulfilled' && qRes.value.ok) {
          const d = await qRes.value.json();
          setQuranMatches(Array.isArray(d.matches) ? d.matches.slice(0, 12) : []);
        }
        if (tRes.status === 'fulfilled' && tRes.value.ok) {
          const d = await tRes.value.json();
          setTafsirMatches(Array.isArray(d.matches) ? d.matches.slice(0, 8) : []);
        }
      } catch {
        // Offline local results remain available
      } finally {
        setIsSearchingApi(false);
      }
    }, 320);

    return () => window.clearTimeout(timer);
  }, [queryText, isSearchModalOpen]);

  // Direct Surah:Ayah parser (e.g. 2:255 or 18:10)
  const directVerseJump = useMemo(() => {
    const m = queryText.trim().match(/^(\d{1,3})\s*[:：]\s*(\d{1,3})$/);
    if (!m) return null;
    const s = Number(m[1]);
    const a = Number(m[2]);
    if (s >= 1 && s <= 114) {
      const meta = ALL_SURAHS[s - 1];
      if (a >= 1 && a <= meta.ayahCount) {
        return { surah: s, ayah: a, meta };
      }
    }
    return null;
  }, [queryText]);

  const localSurahHits = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    if (!q) return [];
    return ALL_SURAHS.filter(
      (s) =>
        s.nameAr.includes(q) ||
        s.nameEn.toLowerCase().includes(q) ||
        s.meaningEn.toLowerCase().includes(q) ||
        String(s.number) === q
    ).slice(0, 8);
  }, [queryText]);

  const localTopicHits = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    if (!q) return [];
    return QURAN_THEMATIC_TOPICS.filter(
      (t) =>
        t.titleAr.includes(q) ||
        t.titleEn.toLowerCase().includes(q) ||
        t.queryKeyword.includes(q)
    );
  }, [queryText]);

  const localAdhkarHits = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    if (!q) return [];
    return AUTHENTIC_ADHKAR.filter(
      (d) =>
        d.titleAr.includes(q) ||
        d.arabicText.includes(q) ||
        d.titleEn.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [queryText]);

  const localLibraryAndReciters = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    if (!q) return { books: [], reciters: [], tajweed: [] };
    return {
      books: ISLAMIC_LIBRARY_BOOKS.filter(
        (b) => b.titleAr.includes(q) || b.authorAr.includes(q) || b.summaryAr.includes(q)
      ).slice(0, 4),
      reciters: VERIFIED_RECITERS.filter(
        (r) => r.nameAr.includes(q) || r.nameEn.toLowerCase().includes(q)
      ).slice(0, 4),
      tajweed: TAJWEED_LESSONS.filter(
        (l) => l.titleAr.includes(q) || l.summaryAr.includes(q)
      ).slice(0, 4),
    };
  }, [queryText]);

  if (!isSearchModalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="البحث الشامل في اطمئنان القرآن"
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={() => setIsSearchModalOpen(false)}
    >
      <div
        className="w-full max-w-3xl rounded-2xl bg-[#FBF9F5] dark:bg-[#101C17] border border-stone-200 dark:border-emerald-900/90 shadow-2xl overflow-hidden my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="p-4 border-b border-stone-200 dark:border-emerald-950 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#0E4A3A] dark:text-amber-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder={
              lang === 'ar'
                ? 'ابحث بكلمة، جزء من آية، رقم (2:255)، موضوع، تفسير، ذكر، قارئ أو كتاب...'
                : 'Search verse, phrase, 2:255, topic, Tafsir, Adhkar, reciter, or book...'
            }
            className="w-full bg-transparent text-stone-900 dark:text-stone-100 placeholder-stone-400 text-sm sm:text-base focus:outline-none"
          />
          {queryText && (
            <button
              type="button"
              onClick={() => setQueryText('')}
              className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            >
              {lang === 'ar' ? 'مسح' : 'Clear'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsSearchModalOpen(false)}
            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200/60 dark:hover:bg-emerald-950"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-4 py-2 bg-stone-100/80 dark:bg-[#0B1410] border-b border-stone-200 dark:border-emerald-950 flex items-center gap-2 overflow-x-auto text-xs">
          {[
            { id: 'all', ar: 'جميع الأقسام', en: 'All' },
            { id: 'quran', ar: 'آيات القرآن', en: 'Quran Verses' },
            { id: 'tafsir', ar: 'التفاسير والمعاني', en: 'Tafsir' },
            { id: 'surahs', ar: 'السور والموضوعات', en: 'Surahs & Topics' },
            { id: 'adhkar_library', ar: 'الأذكار والقراء والمكتبة', en: 'Adhkar & Library' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#0E4A3A] text-white dark:bg-amber-500 dark:text-stone-950'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-emerald-950/60'
              }`}
            >
              {lang === 'ar' ? tab.ar : tab.en}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 max-h-[68vh] overflow-y-auto space-y-5">
          {!queryText.trim() ? (
            <div className="space-y-5">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-stone-500 dark:text-stone-400">
                      {lang === 'ar' ? 'عمليات البحث الأخيرة' : 'Recent Searches'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setRecentSearches([]);
                        localStorage.removeItem('qr_recent_searches');
                      }}
                      className="text-xs text-stone-500 hover:text-red-600"
                    >
                      {lang === 'ar' ? 'مسح السجل' : 'Clear History'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setQueryText(term)}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900/70 text-xs text-stone-800 dark:text-stone-200 hover:border-[#0E4A3A] dark:hover:border-amber-400"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Thematic Topics */}
              <div>
                <h4 className="text-xs font-bold text-stone-500 dark:text-stone-400 mb-2.5">
                  {lang === 'ar' ? 'موضوعات قرآنية سريعة' : 'Quranic Themes'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {QURAN_THEMATIC_TOPICS.map((topic) => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => setQueryText(topic.queryKeyword)}
                      className="p-3 rounded-xl bg-white dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900/70 text-start hover:border-[#0E4A3A] dark:hover:border-amber-400 transition-colors"
                    >
                      <div className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                        {lang === 'ar' ? topic.titleAr : topic.titleEn}
                      </div>
                      <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {topic.references.map((r) => `${r.surahAr}: ${r.ayah}`).join(' · ')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Direct Surah:Ayah Jump */}
              {directVerseJump && (
                <div className="p-3.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      انتقال مباشر: سورة {directVerseJump.meta.nameAr} · الآية {directVerseJump.ayah}
                    </div>
                    <div className="text-xs text-stone-600 dark:text-stone-300">
                      صفحة {directVerseJump.meta.startPage} · الجزء {directVerseJump.meta.startJuz}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      saveRecentSearch(queryText);
                      setIsSearchModalOpen(false);
                      navigateTo('quran', {
                        quranTab: 'mushaf',
                        surah: directVerseJump.surah,
                        ayah: directVerseJump.ayah,
                      });
                    }}
                    className="px-3.5 py-2 rounded-lg bg-[#0E4A3A] text-white text-xs font-semibold"
                  >
                    {lang === 'ar' ? 'فتح الآية' : 'Open Verse'}
                  </button>
                </div>
              )}

              {/* Surahs & Topics */}
              {(activeTab === 'all' || activeTab === 'surahs') &&
                (localSurahHits.length > 0 || localTopicHits.length > 0) && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-stone-500 dark:text-stone-400">
                      {lang === 'ar' ? 'السور والموضوعات المطابقة' : 'Matching Surahs & Topics'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {localSurahHits.map((s) => (
                        <button
                          key={s.number}
                          type="button"
                          onClick={() => {
                            saveRecentSearch(queryText);
                            setIsSearchModalOpen(false);
                            navigateTo('quran', { quranTab: 'mushaf', surah: s.number, ayah: 1 });
                          }}
                          className="p-3 rounded-xl bg-white dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900/70 text-start hover:border-[#0E4A3A] dark:hover:border-amber-400"
                        >
                          <div className="font-bold text-sm text-stone-900 dark:text-stone-100">
                            {s.number}. سورة {s.nameAr} ({s.nameEn})
                          </div>
                          <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                            {s.revelationType === 'Makki' ? 'مكية' : 'مدنية'} · {s.ayahCount} آية · صفحة {s.startPage}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* Live Quran Verse Matches */}
              {(activeTab === 'all' || activeTab === 'quran') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-stone-500 dark:text-stone-400">
                      {lang === 'ar' ? 'نتائج آيات القرآن الكريم' : 'Quranic Verse Matches'}
                    </h4>
                    {isSearchingApi && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-amber-300">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{MESSAGE_LIBRARY[lang].loading.search}</span>
                      </span>
                    )}
                  </div>
                  {quranMatches.length > 0 ? (
                    <div className="space-y-2">
                      {quranMatches.map((m) => (
                        <div
                          key={m.verseKey}
                          className="p-3.5 rounded-xl bg-white dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900/70"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5 text-xs text-stone-500 dark:text-stone-400">
                            <span className="font-semibold text-[#0E4A3A] dark:text-amber-300">
                              {m.surahNameAr} · الآية {m.ayahNumber} ({m.verseKey})
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  playVerseAudio({
                                    surahNumber: m.surahNumber,
                                    ayahNumber: m.ayahNumber,
                                    globalAyahNumber: 0,
                                    verseText: m.text,
                                  })
                                }
                                className="text-stone-600 dark:text-stone-300 hover:text-[#0E4A3A] dark:hover:text-amber-300"
                              >
                                {lang === 'ar' ? 'استماع' : 'Play'}
                              </button>
                              <span>·</span>
                              <button
                                type="button"
                                onClick={() => {
                                  saveRecentSearch(queryText);
                                  setIsSearchModalOpen(false);
                                  navigateTo('quran', {
                                    quranTab: 'mushaf',
                                    surah: m.surahNumber,
                                    ayah: m.ayahNumber,
                                  });
                                }}
                                className="font-semibold text-[#0E4A3A] dark:text-amber-300 hover:underline"
                              >
                                {lang === 'ar' ? 'فتح في المصحف' : 'Open in Mushaf'}
                              </button>
                            </div>
                          </div>
                          <p className="font-quran-uthmani text-lg text-stone-900 dark:text-stone-100 leading-loose">
                            {m.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    !isSearchingApi && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 py-2">
                        {MESSAGE_LIBRARY[lang].empty.searchResults}
                      </p>
                    )
                  )}
                </div>
              )}

              {/* Tafsir Matches */}
              {(activeTab === 'all' || activeTab === 'tafsir') && tafsirMatches.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-stone-500 dark:text-stone-400">
                    {lang === 'ar' ? 'نتائج التفسير الميسر والمعاني' : 'Tafsir Matches'}
                  </h4>
                  <div className="space-y-2">
                    {tafsirMatches.slice(0, 5).map((m) => (
                      <button
                        key={`tf_${m.verseKey}`}
                        type="button"
                        onClick={() => {
                          saveRecentSearch(queryText);
                          setIsSearchModalOpen(false);
                          navigateTo('quran', {
                            quranTab: 'tafsir',
                            surah: m.surahNumber,
                            ayah: m.ayahNumber,
                          });
                        }}
                        className="w-full text-start p-3 rounded-xl bg-white dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900/70 hover:border-[#0E4A3A]"
                      >
                        <div className="text-xs font-semibold text-[#0E4A3A] dark:text-amber-300 mb-1">
                          {m.surahNameAr} ({m.verseKey}) · {m.editionName}
                        </div>
                        <p className="text-xs text-stone-700 dark:text-stone-300 line-clamp-2 leading-relaxed">
                          {m.text}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Adhkar, Reciters & Library Books */}
              {(activeTab === 'all' || activeTab === 'adhkar_library') &&
                (localAdhkarHits.length > 0 ||
                  localLibraryAndReciters.books.length > 0 ||
                  localLibraryAndReciters.reciters.length > 0 ||
                  localLibraryAndReciters.tajweed.length > 0) && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-stone-500 dark:text-stone-400">
                      {lang === 'ar'
                        ? 'الأذكار، القراء، التجويد والمكتبة العلمية'
                        : 'Adhkar, Reciters & Library'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {localAdhkarHits.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            saveRecentSearch(queryText);
                            setIsSearchModalOpen(false);
                            navigateTo('adhkar');
                          }}
                          className="p-3 rounded-xl bg-white dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900/70 text-start"
                        >
                          <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                            ذكر: {d.titleAr}
                          </div>
                          <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                            {d.gradingAr}
                          </div>
                        </button>
                      ))}

                      {localLibraryAndReciters.reciters.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            saveRecentSearch(queryText);
                            setIsSearchModalOpen(false);
                            navigateTo('quran', { quranTab: 'recitations' });
                          }}
                          className="p-3 rounded-xl bg-white dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900/70 text-start"
                        >
                          <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                            القارئ: {r.nameAr}
                          </div>
                          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                            {r.riwayahAr} · {r.styleAr}
                          </div>
                        </button>
                      ))}

                      {localLibraryAndReciters.books.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            saveRecentSearch(queryText);
                            setIsSearchModalOpen(false);
                            navigateTo('library', {
                              libraryCategory: b.category,
                              libraryBookId: b.id,
                              libraryChapterIdx: 0,
                            });
                          }}
                          className="p-3 rounded-xl bg-white dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900/70 text-start"
                        >
                          <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                            كتاب: {b.titleAr}
                          </div>
                          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                            {b.authorAr}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const NotificationsDrawer: React.FC = () => {
  const {
    lang,
    isNotificationsOpen,
    setIsNotificationsOpen,
    inAppAlerts,
    markAllAlertsRead,
    navigateTo,
  } = useQuranApp();

  if (!isNotificationsOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex justify-end"
      onClick={() => setIsNotificationsOpen(false)}
    >
      <div
        className="w-full max-w-md h-full bg-[#FBF9F5] dark:bg-[#101C17] border-s border-stone-200 dark:border-emerald-900/80 p-5 flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-emerald-950">
          <div>
            <h3 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
              {lang === 'ar' ? 'التنبيهات والتذكيرات الإيمانية' : 'Notifications & Reminders'}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {lang === 'ar'
                ? 'تذكيرات الورد القرآني والأذكار والمناسبات الإسلامية'
                : 'Daily Wird, Adhkar, and Islamic occasion alerts'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(false)}
            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200/70 dark:hover:bg-emerald-950"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-2 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={markAllAlertsRead}
            className="text-[#0E4A3A] dark:text-amber-300 font-medium hover:underline"
          >
            {lang === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all as read'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsNotificationsOpen(false);
              navigateTo('account');
            }}
            className="text-stone-600 dark:text-stone-300 hover:underline"
          >
            {lang === 'ar' ? 'إعدادات التنبيهات وساعات الهدوء' : 'Alert Settings'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mt-2">
          {inAppAlerts.length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400 py-8 text-center">
              {MESSAGE_LIBRARY[lang].empty.notifications}
            </p>
          ) : (
            inAppAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border ${
                  alert.isRead
                    ? 'bg-white/70 dark:bg-[#13211B]/70 border-stone-200/80 dark:border-emerald-950'
                    : 'bg-white dark:bg-[#162820] border-amber-400/60 dark:border-amber-500/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    {lang === 'ar' ? alert.titleAr : alert.titleEn}
                  </span>
                  <span className="text-[11px] text-stone-400">
                    {new Date(alert.createdAtIso).toLocaleDateString(
                      lang === 'ar' ? 'ar-SA' : 'en-US'
                    )}
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {lang === 'ar' ? alert.messageAr : alert.messageEn}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export const ToastAndConfirmOverlays: React.FC = () => {
  const { lang, toasts, dismissToast, confirmDialog, closeConfirm } = useQuranApp();

  return (
    <>
      {/* Non-blocking Toast Stack */}
      <div
        aria-live="polite"
        className="fixed top-20 end-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] pointer-events-none"
      >
        {toasts.map((toast) => {
          const icon =
            toast.kind === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : toast.kind === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            );

          return (
            <div
              key={toast.id}
              className="pointer-events-auto p-3.5 rounded-xl bg-white dark:bg-[#13221B] border border-stone-200 dark:border-emerald-900 shadow-lg flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-800 dark:text-stone-100">
                {icon}
                <div>
                  <p className="leading-snug">{toast.message}</p>
                  {toast.refCode && (
                    <p className="text-[11px] font-mono text-stone-500 dark:text-stone-400 mt-1">
                      رمز المرجع: {toast.refCode}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Accessible Confirmation Modal (Replaces window.confirm) */}
      {confirmDialog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="max-w-md w-full rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-900 p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100 mb-2">
              {lang === 'ar' ? 'تأكيد الإجراء' : 'Confirm Action'}
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-5">
              {confirmDialog.message}
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={closeConfirm}
                className="px-4 py-2 rounded-lg border border-stone-300 dark:border-emerald-800 text-stone-700 dark:text-stone-200 text-sm font-medium"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const fn = confirmDialog.onConfirm;
                  closeConfirm();
                  fn();
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
              >
                {lang === 'ar' ? 'تأكيد المتابعة' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const InstitutionalFooter: React.FC = () => {
  const { lang, navigateTo } = useQuranApp();
  const t = UI_LABELS[lang];

  return (
    <footer className="mt-16 border-t border-stone-200/90 dark:border-emerald-950/80 bg-[#F4EFE6]/70 dark:bg-[#09120E] pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
        <div>
          <div className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
            {t.brandName}
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-0.5">
            {t.brandEnglish} · {t.slogan}
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed mt-3">
            {lang === 'ar'
              ? 'منصة قرآنية وعلمية عالمية تعتمد النص العثماني الموثق لمجمع الملك فهد لطباعة المصحف الشريف وأمهات كتب التفسير والحديث المعتمدة.'
              : 'Global Quranic platform built on verified Uthmani script from the King Fahd Glorious Quran Printing Complex and accredited scholarly Tafsir & Hadith collections.'}
          </p>
        </div>

        <div>
          <h4 className="font-bold text-stone-900 dark:text-stone-100 mb-3 text-xs uppercase tracking-wider">
            {lang === 'ar' ? 'الأقسام الرئيسية' : 'Core Sections'}
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-stone-600 dark:text-stone-300">
            <button type="button" onClick={() => navigateTo('quran', { quranTab: 'mushaf' })} className="text-start hover:text-[#0E4A3A] dark:hover:text-amber-300">
              {lang === 'ar' ? 'المصحف الشريف (604 صفحات)' : 'Noble Mushaf'}
            </button>
            <button type="button" onClick={() => navigateTo('quran', { quranTab: 'tafsir' })} className="text-start hover:text-[#0E4A3A] dark:hover:text-amber-300">
              {lang === 'ar' ? 'مكتبة التفاسير المعتمدة' : 'Tafsir Library'}
            </button>
            <button type="button" onClick={() => navigateTo('tools', { toolsTab: 'hifz' })} className="text-start hover:text-[#0E4A3A] dark:hover:text-amber-300">
              {lang === 'ar' ? 'خطة الحفظ والاختبارات' : 'Hifz & Quizzes'}
            </button>
            <button type="button" onClick={() => navigateTo('tools', { toolsTab: 'prayer' })} className="text-start hover:text-[#0E4A3A] dark:hover:text-amber-300">
              {lang === 'ar' ? 'مواقيت الصلاة والقبلة' : 'Prayer & Qibla'}
            </button>
            <button type="button" onClick={() => navigateTo('adhkar')} className="text-start hover:text-[#0E4A3A] dark:hover:text-amber-300">
              {lang === 'ar' ? 'الأذكار والمسبحة' : 'Adhkar & Tasbih'}
            </button>
            <button type="button" onClick={() => navigateTo('library')} className="text-start hover:text-[#0E4A3A] dark:hover:text-amber-300">
              {lang === 'ar' ? 'المكتبة الإسلامية' : 'Islamic Library'}
            </button>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-stone-900 dark:text-stone-100 mb-3 text-xs uppercase tracking-wider">
            {lang === 'ar' ? 'الضوابط الشرعية والمنهجية' : 'Scholarly Integrity'}
          </h4>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            {lang === 'ar'
              ? 'يُعرض النص القرآني بالرسم العثماني دون أي تعديل، وتُنسب التفاسير والترجمات والأحاديث إلى مصادرها العلمية. لا يُغني التطبيق عن مراجعة العلماء المتخصصين ودور الإفتاء الرسمية في المسائل الفقهية والنوازل.'
              : 'All Quranic verses are rendered verbatim in verified Uthmani script with full scholarly source attribution. Fatwa inquiries are always referred to qualified scholars.'}
          </p>
        </div>
      </div>
    </footer>
  );
};
