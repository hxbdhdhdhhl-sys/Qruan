import React, { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Copy,
  Download,
  GraduationCap,
  HeartHandshake,
  Image as ImageIcon,
  Library,
  Play,
  Sparkles,
  Sun,
  Moon,
  Users,
  Volume2,
} from 'lucide-react';
import { useQuranApp } from '../context/QuranAppContext';
import { SANCTUARY_ASSETS, SanctuaryImage } from '../data/assets';
import { MESSAGE_LIBRARY, UI_LABELS } from '../data/i18n';
import { ALL_SURAHS, VERSE_OF_THE_DAY_POOL } from '../data/surahs';
import {
  computeLocalPrayerTimes,
  formatCountdownHMS,
  formatTimeHHMM,
  getFormattedHijriToday,
} from '../lib/prayerUtils';

export const HomeDashboardView: React.FC = () => {
  const {
    lang,
    quranFont,
    lastRead,
    navigateTo,
    playVerseAudio,
    toggleOrSaveBookmark,
    userCoords,
    calcMethod,
    madhab,
    hifzPlans,
    khatmahPlans,
    upsertKhatmahPlan,
    listeningHistory,
    pushToast,
  } = useQuranApp();

  const t = UI_LABELS[lang];
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [selectedVodIndex, setSelectedVodIndex] = useState<number>(() => {
    const dayOfYear = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    return dayOfYear % VERSE_OF_THE_DAY_POOL.length;
  });
  const [cardAspect, setCardAspect] = useState<'landscape' | 'portrait'>('landscape');
  const [wirdDoneToday, setWirdDoneToday] = useState<boolean>(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    return localStorage.getItem('qr_wird_done_date') === todayKey;
  });

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const prayerSchedule = useMemo(
    () => computeLocalPrayerTimes(userCoords.lat, userCoords.lng, calcMethod, madhab, new Date(nowMs)),
    [userCoords.lat, userCoords.lng, calcMethod, madhab, nowMs]
  );

  const hijriToday = useMemo(() => getFormattedHijriToday(new Date(nowMs)), [nowMs]);
  const lastReadSurah = ALL_SURAHS[(lastRead.surah || 1) - 1] || ALL_SURAHS[0];
  const activeVod = VERSE_OF_THE_DAY_POOL[selectedVodIndex] || VERSE_OF_THE_DAY_POOL[0];

  const activeHifz = hifzPlans.find((p) => p.status === 'active') || hifzPlans[0] || null;
  const activeKhatmah = khatmahPlans.find((p) => p.status === 'active') || khatmahPlans[0] || null;

  const fontClass =
    quranFont === 'scheherazade'
      ? 'font-quran-scheherazade'
      : quranFont === 'naskh'
        ? 'font-quran-naskh'
        : 'font-quran-uthmani';

  const handleCopyVerseOfDay = async () => {
    const formatted = `﴿ ${activeVod.uthmaniText} ﴾\n[${activeVod.surahNameAr}: الآية ${activeVod.ayahNumber}]\n— اطمئنان القرآن`;
    try {
      await navigator.clipboard.writeText(formatted);
      pushToast('success', MESSAGE_LIBRARY[lang].success.copied);
    } catch {
      pushToast('info', formatted);
    }
  };

  // HTML5 Canvas Downloadable Quranic Card & Phone Wallpaper Generator (Section 15)
  const handleDownloadVerseCard = () => {
    const canvas = document.createElement('canvas');
    const isPortrait = cardAspect === 'portrait';
    canvas.width = isPortrait ? 1080 : 1280;
    canvas.height = isPortrait ? 1920 : 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Deep Emerald Sanctuary Gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#07261E');
    grad.addColorStop(0.5, '#0E4A3A');
    grad.addColorStop(1, '#082019');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Double Illuminated Gold Frame
    ctx.strokeStyle = 'rgba(212, 168, 83, 0.72)';
    ctx.lineWidth = 4;
    ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);
    ctx.strokeStyle = 'rgba(212, 168, 83, 0.30)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);

    // Header Title
    ctx.fillStyle = '#E6C27A';
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';
    ctx.font = 'bold 34px "Amiri", serif';
    ctx.fillText('اطمئنان القرآن — اطمئن بذكر الله', canvas.width / 2, isPortrait ? 150 : 115);

    // Verse Wrapping Helper
    ctx.fillStyle = '#FBF9F5';
    ctx.font = isPortrait ? '46px "Amiri Quran", "Amiri", serif' : '40px "Amiri Quran", "Amiri", serif';
    const words = `﴿ ${activeVod.uthmaniText} ﴾`.split(' ');
    const maxWidth = canvas.width - 180;
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = isPortrait ? 86 : 72;
    const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, i) => {
      ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
    });

    // Citation & Tafsir Attribution Footer
    ctx.fillStyle = '#D4A853';
    ctx.font = 'bold 28px "IBM Plex Sans Arabic", sans-serif';
    ctx.fillText(
      `${activeVod.surahNameAr} · الآية ${activeVod.ayahNumber} · ${activeVod.themeAr}`,
      canvas.width / 2,
      canvas.height - (isPortrait ? 160 : 105)
    );

    ctx.fillStyle = 'rgba(251, 249, 245, 0.75)';
    ctx.font = '20px "IBM Plex Sans Arabic", sans-serif';
    ctx.fillText(
      'النص القرآني بالرسم العثماني الموثق — Quran Reassurance',
      canvas.width / 2,
      canvas.height - (isPortrait ? 110 : 68)
    );

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `quran-reassurance-${activeVod.surahNumber}-${activeVod.ayahNumber}-${cardAspect}.png`;
    link.href = dataUrl;
    link.click();

    pushToast(
      'success',
      lang === 'ar'
        ? 'تم تصميم وتنزيل البطاقة القرآنية بجودة عالية بنجاح'
        : 'High-resolution Quranic card downloaded'
    );
  };

  const handleMarkDailyWirdComplete = () => {
    const todayKey = new Date().toISOString().slice(0, 10);
    localStorage.setItem('qr_wird_done_date', todayKey);
    setWirdDoneToday(true);
    if (activeKhatmah) {
      const nextCompleted = Math.min(604, activeKhatmah.completedPages + activeKhatmah.dailyPages);
      void upsertKhatmahPlan({
        ...activeKhatmah,
        completedPages: nextCompleted,
        currentJuz: Math.min(30, Math.max(1, Math.ceil((nextCompleted / 604) * 30))),
        status: nextCompleted >= 604 ? 'completed' : 'active',
        updatedAtIso: new Date().toISOString(),
      });
    } else {
      pushToast('success', MESSAGE_LIBRARY[lang].success.wirdCompleted);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* 1. Sanctuary Hero Section */}
      <section className="relative rounded-2xl overflow-hidden border border-stone-200/90 dark:border-emerald-900/70 shadow-lg bg-[#08261E]">
        <div className="absolute inset-0">
          <SanctuaryImage
            src={SANCTUARY_ASSETS.heroMushaf}
            alt="المصحف الشريف في رحاب السكينة"
            fallbackTitle="اطمئنان القرآن"
            className="w-full h-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#061D16] via-[#08261E]/85 to-[#08261E]/60" />
        </div>

        <div className="relative z-10 p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-7 space-y-4 text-[#FBF9F5]">
            <p className="text-xs sm:text-sm text-amber-300 font-medium tracking-wide">
              {lang === 'ar' ? hijriToday.ar : hijriToday.en} · {userCoords.labelAr}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-white">
              {lang === 'ar'
                ? 'اطمئنان القرآن — مرجعك الشامل لكتاب الله تلاوةً وتدبراً وحفظاً'
                : 'Quran Reassurance — Complete Sanctuary for Recitation, Tafsir & Hifz'}
            </h1>
            <p className="text-sm sm:text-base text-stone-200 max-w-2xl leading-relaxed">
              {MESSAGE_LIBRARY[lang].welcome[0]}
            </p>

            {/* Primary Hero CTAs */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  navigateTo('quran', {
                    quranTab: 'mushaf',
                    surah: lastRead.surah,
                    ayah: lastRead.ayah,
                    page: lastRead.page,
                  })
                }
                className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-sm transition-colors shadow-sm"
              >
                <BookOpen className="w-4 h-4" />
                <span>
                  {t.continueReading}: سورة {lastReadSurah.nameAr} · آية {lastRead.ayah} · ص {lastRead.page}
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('quran', { quranTab: 'recitations' })}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/12 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-colors"
              >
                <Volume2 className="w-4 h-4 text-amber-300" />
                <span>{lang === 'ar' ? 'المكتبة الصوتية للقراء' : 'Audio Recitations'}</span>
              </button>
            </div>
          </div>

          {/* Live Next Prayer & Qibla Sanctuary Card */}
          <div className="lg:col-span-5 rounded-xl bg-black/40 backdrop-blur-md border border-amber-400/30 p-5 text-[#FBF9F5] space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs text-amber-300 font-medium">{t.nextPrayer}</div>
                <div className="font-display text-2xl font-bold mt-0.5">
                  {lang === 'ar'
                    ? prayerSchedule.nextPrayerNameAr
                    : prayerSchedule.nextPrayerNameEn}{' '}
                  · {formatTimeHHMM(prayerSchedule.nextPrayerTime, lang)}
                </div>
              </div>
              <div className="text-end">
                <div className="text-xs text-stone-300">
                  {lang === 'ar' ? 'الوقت المتبقي' : 'Remaining'}
                </div>
                <div className="font-mono text-xl font-bold text-amber-300 tabular-nums mt-0.5">
                  {formatCountdownHMS(prayerSchedule.nextPrayerTime, nowMs)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-white/15 text-center text-xs">
              {[
                { key: 'fajr', ar: 'الفجر', time: prayerSchedule.fajr },
                { key: 'dhuhr', ar: 'الظهر', time: prayerSchedule.dhuhr },
                { key: 'asr', ar: 'العصر', time: prayerSchedule.asr },
                { key: 'maghrib', ar: 'المغرب', time: prayerSchedule.maghrib },
                { key: 'isha', ar: 'العشاء', time: prayerSchedule.isha },
              ].map((p) => {
                const isNext = prayerSchedule.nextPrayerKey === p.key;
                return (
                  <div
                    key={p.key}
                    className={`p-2 rounded-lg ${
                      isNext ? 'bg-amber-400/25 border border-amber-300/50 font-bold' : 'bg-white/5'
                    }`}
                  >
                    <div className="text-[11px] text-stone-300">{p.ar}</div>
                    <div className="tabular-nums text-white mt-0.5">
                      {formatTimeHHMM(p.time, lang)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-stone-300 pt-1">
              <span>
                اتجاه القبلة: {prayerSchedule.qiblaDegrees}° · البعد عن الكعبة: {prayerSchedule.distanceToKaabaKm} كم
              </span>
              <button
                type="button"
                onClick={() => navigateTo('tools', { toolsTab: 'prayer' })}
                className="text-amber-300 font-semibold hover:underline"
              >
                {lang === 'ar' ? 'التفاصيل والأذان' : 'Full Schedule'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Verse of the Day & Shareable Card Studio (Section 15) */}
      <section className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200/90 dark:border-emerald-950/80 p-6 sm:p-8 shadow-xs space-y-5 islamic-pattern-subtle">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200/80 dark:border-emerald-950 pb-4">
          <div>
            <div className="text-xs font-bold text-[#0E4A3A] dark:text-amber-400 uppercase tracking-wider">
              {t.verseOfDay}
            </div>
            <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100 mt-0.5">
              {activeVod.themeAr} · {activeVod.surahNameAr} (الآية {activeVod.ayahNumber})
            </h2>
          </div>

          {/* Theme Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            {VERSE_OF_THE_DAY_POOL.map((v, idx) => (
              <button
                key={`${v.surahNumber}:${v.ayahNumber}`}
                type="button"
                onClick={() => setSelectedVodIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedVodIndex === idx
                    ? 'bg-[#0E4A3A] text-white dark:bg-amber-400 dark:text-stone-950'
                    : 'bg-stone-100 dark:bg-[#162720] text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-emerald-900/50'
                }`}
              >
                {v.themeAr}
              </button>
            ))}
          </div>
        </div>

        {/* Canonical Uthmani Verse Display */}
        <div className="py-4 px-4 sm:px-8 rounded-xl bg-[#FBF9F5] dark:bg-[#0B1511] border border-amber-500/25 text-center">
          <p
            className={`${fontClass} text-2xl sm:text-3xl lg:text-4xl text-stone-900 dark:text-stone-50 leading-[2.35]`}
          >
            ﴿ {activeVod.uthmaniText} ﴾
          </p>
        </div>

        {/* Concise Attributed Tafsir */}
        <div className="space-y-1.5">
          <p className="text-sm sm:text-base text-stone-700 dark:text-stone-200 leading-relaxed">
            {activeVod.tafsirShortAr}
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            المصدر العلمي: {activeVod.tafsirSourceAr}
          </p>
        </div>

        {/* Verse Actions + Card & Wallpaper Generator */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/80 dark:border-emerald-950">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                playVerseAudio({
                  surahNumber: activeVod.surahNumber,
                  ayahNumber: activeVod.ayahNumber,
                  globalAyahNumber: activeVod.globalAyahNumber,
                  verseText: activeVod.uthmaniText,
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0E4A3A] hover:bg-[#0B3B2E] text-white text-xs font-semibold transition-colors"
            >
              <Play className="w-3.5 h-3.5 text-amber-300" />
              <span>{lang === 'ar' ? 'استماع للآية' : 'Listen'}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                void toggleOrSaveBookmark({
                  surahNumber: activeVod.surahNumber,
                  ayahNumber: activeVod.ayahNumber,
                  pageNumber: ALL_SURAHS[activeVod.surahNumber - 1]?.startPage || 1,
                  surahName: activeVod.surahNameAr,
                  verseExcerpt: activeVod.uthmaniText,
                  collectionTag: 'آية اليوم',
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-stone-100 dark:bg-[#162720] hover:bg-stone-200 dark:hover:bg-emerald-900/60 text-stone-800 dark:text-stone-200 text-xs font-medium"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'حفظ في المفضلة' : 'Bookmark'}</span>
            </button>

            <button
              type="button"
              onClick={() => void handleCopyVerseOfDay()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-stone-100 dark:bg-[#162720] hover:bg-stone-200 dark:hover:bg-emerald-900/60 text-stone-800 dark:text-stone-200 text-xs font-medium"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'نسخ مع التوثيق' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                navigateTo('quran', {
                  quranTab: 'tafsir',
                  surah: activeVod.surahNumber,
                  ayah: activeVod.ayahNumber,
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-stone-100 dark:bg-[#162720] text-stone-800 dark:text-stone-200 text-xs font-medium hover:underline"
            >
              <span>{lang === 'ar' ? 'مقارنة التفاسير السبعة' : 'Compare Tafsirs'}</span>
            </button>
          </div>

          {/* Card / Wallpaper Export */}
          <div className="flex items-center gap-2">
            <select
              aria-label="مقاس البطاقة القرآنية"
              value={cardAspect}
              onChange={(e) => setCardAspect(e.target.value as 'landscape' | 'portrait')}
              className="rounded-lg bg-stone-100 dark:bg-[#162720] border border-stone-200 dark:border-emerald-900 px-2.5 py-1.5 text-xs text-stone-800 dark:text-stone-200"
            >
              <option value="landscape">
                {lang === 'ar' ? 'بطاقة مشاركة (16:9)' : 'Share Card (16:9)'}
              </option>
              <option value="portrait">
                {lang === 'ar' ? 'خلفية هاتف (9:16)' : 'Phone Wallpaper (9:16)'}
              </option>
            </select>
            <button
              type="button"
              onClick={handleDownloadVerseCard}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <Download className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'تنزيل بطاقة الآية' : 'Download Card'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Daily Worship & Progress Grid: Daily Wird, Morning/Evening Adhkar, Hifz & Khatmah */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Daily Quranic Wird & Khatmah */}
        <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200/90 dark:border-emerald-950/80 p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
              <span>{t.dailyWird}</span>
              <span>
                {activeKhatmah
                  ? `${activeKhatmah.completedPages} / 604 صفحة`
                  : lang === 'ar'
                    ? 'ورد يومي مستمر'
                    : 'Daily Portion'}
              </span>
            </div>
            <h3 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
              {activeKhatmah ? activeKhatmah.title : 'ختمة الثلاثين يوماً المباركة'}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
              {activeKhatmah
                ? `وردك اليومي: ${activeKhatmah.dailyPages} صفحة · الجزء الحالي: ${activeKhatmah.currentJuz}`
                : 'قراءة جزء واحد يومياً (20 صفحة) تختم لك المصحف الشريف كاملاً في شهر واحد.'}
            </p>
            {activeKhatmah && (
              <div className="mt-3 w-full h-2 rounded-full bg-stone-200 dark:bg-emerald-950 overflow-hidden">
                <div
                  className="h-full bg-[#0E4A3A] dark:bg-amber-400 transition-all"
                  style={{
                    width: `${Math.min(100, Math.round((activeKhatmah.completedPages / 604) * 100))}%`,
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleMarkDailyWirdComplete}
              disabled={wirdDoneToday}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                wirdDoneToday
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                  : 'bg-[#0E4A3A] hover:bg-[#0B3B2E] text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {wirdDoneToday
                  ? lang === 'ar'
                    ? 'أتممت ورد اليوم بحمد الله'
                    : 'Today’s Wird Completed'
                  : lang === 'ar'
                    ? 'تسجيل إتمام ورد اليوم'
                    : 'Mark Wird Complete'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo('tools', { toolsTab: 'khatmah' })}
              className="px-3 py-2 rounded-lg border border-stone-200 dark:border-emerald-900 text-xs font-medium text-stone-700 dark:text-stone-200"
            >
              {lang === 'ar' ? 'الختمة' : 'Plan'}
            </button>
          </div>
        </div>

        {/* Morning & Evening Authenticated Adhkar Quick Launch */}
        <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200/90 dark:border-emerald-950/80 p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="text-xs text-stone-500 dark:text-stone-400 mb-1">
              {lang === 'ar' ? 'حصن المسلم اليومي الموثق' : 'Daily Prophetic Remembrance'}
            </div>
            <h3 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
              {lang === 'ar' ? 'أذكار الصباح والمساء والمسبحة' : 'Morning & Evening Adhkar'}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
              {lang === 'ar'
                ? 'أذكار ثابتة من القرآن الكريم والصحيحين مع عداد التكرار التفاعلي وتخريج كل ذكر.'
                : 'Authenticated supplications with repetition counters and exact Hadith sources.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigateTo('adhkar')}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs font-semibold"
            >
              <Sun className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'أذكار الصباح' : 'Morning'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo('adhkar')}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-stone-100 dark:bg-[#162720] border border-stone-200 dark:border-emerald-900 text-stone-800 dark:text-stone-200 text-xs font-semibold"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'أذكار المساء' : 'Evening'}</span>
            </button>
          </div>
        </div>

        {/* Hifz Memorization Progress */}
        <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200/90 dark:border-emerald-950/80 p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
              <span>{lang === 'ar' ? 'مشروع حفظ القرآن الكريم' : 'Quran Memorization'}</span>
              {activeHifz && (
                <span>
                  {Math.round(
                    (activeHifz.memorizedAyahsCount / Math.max(1, activeHifz.totalTargetAyahs)) * 100
                  )}
                  %
                </span>
              )}
            </div>
            <h3 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
              {activeHifz ? activeHifz.title : 'ابدأ خطة حفظك الشخصية'}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
              {activeHifz
                ? `النطاق: ${activeHifz.targetScope} · الورد اليومي: ${activeHifz.dailyAyahs} آيات · المحفوظ: ${activeHifz.memorizedAyahsCount} آية`
                : 'حدد عدد الآيات اليومية مع جدول مراجعة واختبار إخفاء الكلمات وإكمال الآيات.'}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigateTo('tools', { toolsTab: 'hifz' })}
              className="flex-1 py-2 rounded-lg bg-[#0E4A3A] hover:bg-[#0B3B2E] text-white text-xs font-semibold"
            >
              {lang === 'ar' ? 'متابعة الحفظ والاختبار التفاعلي' : 'Open Hifz & Quiz'}
            </button>
          </div>
        </div>
      </section>

      {/* 4. Comprehensive Platform Sections Directory & Recent Recitations */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
            {lang === 'ar' ? 'أبواب اطمئنان القرآن وعلومه' : 'Explore Quranic Sciences & Services'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[
              {
                titleAr: 'تعليم التجويد ومخارج الحروف والأطفال',
                descAr: 'دروس النون والميم والمدود والقلقلة بأمثلة صوتية واختبار تفاعلي وركن الطفل القرآني.',
                icon: <GraduationCap className="w-5 h-5 text-[#0E4A3A] dark:text-amber-300" />,
                onClick: () => navigateTo('tools', { toolsTab: 'tajweed' }),
              },
              {
                titleAr: 'المساعد القرآني الذكي (تفسير وتدبر)',
                descAr: 'شرح الآيات وتلخيص السور ومقارنة أقوال المفسرين المعتمدين مع عرض النص العثماني الموثق.',
                icon: <Sparkles className="w-5 h-5 text-[#0E4A3A] dark:text-amber-300" />,
                onClick: () => navigateTo('assistant'),
              },
              {
                titleAr: 'المكتبة الإسلامية الموثقة (9 تصنيفات)',
                descAr: 'علوم القرآن، التفسير، الحديث، السيرة، قصص الأنبياء، التجويد، العقيدة، والفقه الميسر.',
                icon: <Library className="w-5 h-5 text-[#0E4A3A] dark:text-amber-300" />,
                onClick: () => navigateTo('library'),
              },
              {
                titleAr: 'الحرمان الشريفان وأطلس المساجد التاريخية',
                descAr: 'جولة معرفية ومعمارية في المسجد الحرام والمسجد النبوي والمسجد الأقصى وحساب المسافات.',
                icon: <Compass className="w-5 h-5 text-[#0E4A3A] dark:text-amber-300" />,
                onClick: () => navigateTo('tools', { toolsTab: 'haramain' }),
              },
              {
                titleAr: 'التقويم الهجري والمناسبات الإسلامية',
                descAr: 'التاريخ الهجري والميلادي اليومي، تحويل التواريخ، والتنبيه بمواسم الخير والعبادة.',
                icon: <Calendar className="w-5 h-5 text-[#0E4A3A] dark:text-amber-300" />,
                onClick: () => navigateTo('tools', { toolsTab: 'hijri' }),
              },
              {
                titleAr: 'مجتمع القرآن وحلقات الختمات الجماعية',
                descAr: 'مجموعات تدارس وحفظ وتحديات علمية قرآنية هادفة بإشراف وضوابط علمية.',
                icon: <Users className="w-5 h-5 text-[#0E4A3A] dark:text-amber-300" />,
                onClick: () => navigateTo('community'),
              },
            ].map((card) => (
              <button
                key={card.titleAr}
                type="button"
                onClick={card.onClick}
                className="p-4 rounded-xl bg-white dark:bg-[#101C17] border border-stone-200/90 dark:border-emerald-950/80 hover:border-[#0E4A3A] dark:hover:border-amber-400/70 text-start transition-colors flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-[#162820] flex items-center justify-center shrink-0">
                  {card.icon}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    {card.titleAr}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                    {card.descAr}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Recitations Listened To */}
        <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200/90 dark:border-emerald-950/80 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0E4A3A] dark:text-amber-400" />
                <span>{lang === 'ar' ? 'آخر التلاوات المستمع إليها' : 'Recent Recitations'}</span>
              </h3>
              <button
                type="button"
                onClick={() => navigateTo('quran', { quranTab: 'recitations' })}
                className="text-xs text-[#0E4A3A] dark:text-amber-300 font-semibold hover:underline"
              >
                {lang === 'ar' ? 'كل القراء' : 'All'}
              </button>
            </div>

            {listeningHistory.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {lang === 'ar'
                    ? 'ابدأ بالاستماع إلى تلاوة آية الكرسي أو سورة الفاتحة بصوت قارئك المفضل.'
                    : 'Play any verse to build your recitation history.'}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    playVerseAudio({
                      surahNumber: 1,
                      ayahNumber: 1,
                      globalAyahNumber: 1,
                      verseText: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0E4A3A] text-white text-xs font-semibold"
                >
                  <Play className="w-3.5 h-3.5 text-amber-300" />
                  <span>{lang === 'ar' ? 'تشغيل سورة الفاتحة' : 'Play Al-Fatihah'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {listeningHistory.slice(0, 5).map((item, i) => (
                  <div
                    key={`${item.surahNumber}_${item.ayahNumber}_${i}`}
                    className="p-3 rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200/80 dark:border-emerald-900/60 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                        سورة {item.surahNameAr} · الآية {item.ayahNumber}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                        {item.reciterNameAr}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        playVerseAudio({
                          surahNumber: item.surahNumber,
                          ayahNumber: item.ayahNumber,
                          globalAyahNumber: 0,
                          reciterId: item.reciterId,
                          verseText: `سورة ${item.surahNameAr} · الآية ${item.ayahNumber}`,
                        })
                      }
                      className="p-2 rounded-lg bg-[#0E4A3A] text-amber-300 hover:bg-[#0B3B2E] shrink-0"
                      aria-label="إعادة الاستماع"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-stone-200 dark:border-emerald-950 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span className="inline-flex items-center gap-1">
              <HeartHandshake className="w-3.5 h-3.5 text-[#0E4A3A] dark:text-amber-400" />
              <span>اطمئن بذكر الله</span>
            </span>
            <button
              type="button"
              onClick={() => navigateTo('account')}
              className="hover:underline text-stone-700 dark:text-stone-300"
            >
              {lang === 'ar' ? 'المفضلة والملاحظات' : 'Bookmarks & Notes'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
