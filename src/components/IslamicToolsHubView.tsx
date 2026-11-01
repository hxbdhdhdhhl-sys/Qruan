import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Copy,
  Eye,
  EyeOff,
  GraduationCap,
  Landmark,
  Loader2,
  MapPin,
  Navigation,
  Pause,
  Play,
  RefreshCw,
  Shuffle,
  Volume2,
} from 'lucide-react';
import { useQuranApp } from '../context/QuranAppContext';
import { SANCTUARY_ASSETS, SanctuaryImage } from '../data/assets';
import {
  FAMOUS_MOSQUES,
  TAJWEED_LESSONS,
  TAJWEED_QUIZ_QUESTIONS,
  WORLD_ISLAMIC_CITIES,
} from '../data/adhkarAndLibrary';
import { MESSAGE_LIBRARY } from '../data/i18n';
import { ALL_SURAHS } from '../data/surahs';
import {
  CALCULATION_METHODS_META,
  calculateGeodesicDistanceKm,
  computeLocalPrayerTimes,
  formatCountdownHMS,
  formatTimeHHMM,
  getFormattedHijriToday,
  HIJRI_MONTHS_LIST,
  ISLAMIC_OCCASIONS,
} from '../lib/prayerUtils';
import type { CalcMethodId } from '../lib/prayerUtils';
import type { QuranAyah, ToolsSubTab } from '../types/quran';

interface MonthlyPrayerDay {
  gregorianDate: string;
  weekdayAr: string;
  hijriDay: string;
  hijriMonthAr: string;
  hijriYear: string;
  timings: {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
  };
}

export const IslamicToolsHubView: React.FC = () => {
  const {
    lang,
    toolsTab,
    navigateTo,
    selectedCityId,
    setSelectedCityId,
    userCoords,
    setUserCoords,
    calcMethod,
    setCalcMethod,
    madhab,
    setMadhab,
    hifzPlans,
    upsertHifzPlan,
    khatmahPlans,
    upsertKhatmahPlan,
    playVerseAudio,
    user,
    pushToast,
  } = useQuranApp();

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const prayerSchedule = useMemo(
    () =>
      computeLocalPrayerTimes(
        userCoords.lat,
        userCoords.lng,
        calcMethod,
        madhab,
        new Date(nowMs)
      ),
    [userCoords.lat, userCoords.lng, calcMethod, madhab, nowMs]
  );

  // Adhan Audio Player
  const adhanAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isAdhanPlaying, setIsAdhanPlaying] = useState(false);

  // Monthly Timetable State
  const [monthlyDays, setMonthlyDays] = useState<MonthlyPrayerDay[]>([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  // Device Compass Heading (if supported on mobile)
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);

  // Hijri Converter State
  const [convDirection, setConvDirection] = useState<'gToH' | 'hToG'>('gToH');
  const [convDay, setConvDay] = useState('01');
  const [convMonth, setConvMonth] = useState('09');
  const [convYear, setConvYear] = useState('2026');
  const [convResult, setConvResult] = useState<{
    hijriText: string;
    gregText: string;
    source: string;
  } | null>(null);
  const [convLoading, setConvLoading] = useState(false);

  // Hifz Planner Form & Interactive Quiz State
  const [hifzScope, setHifzScope] = useState<'juz30' | 'juz29' | 'baqarah' | 'full'>('juz30');
  const [hifzDailyAyahs, setHifzDailyAyahs] = useState<number>(10);
  const [hifzReminder, setHifzReminder] = useState<string>('06:00');
  const [quizSurah, setQuizSurah] = useState<number>(112);
  const [quizAyahs, setQuizAyahs] = useState<QuranAyah[]>([]);
  const [quizLoading, setQuizLoading] = useState<boolean>(false);
  const [hifzTestMode, setHifzTestMode] = useState<'hide_words' | 'complete_next'>('hide_words');
  const [revealedAyahNums, setRevealedAyahNums] = useState<number[]>([]);
  const [mcQuestionIdx, setMcQuestionIdx] = useState<number>(0);
  const [mcSelectedAyah, setMcSelectedAyah] = useState<number | null>(null);
  const [mcScore, setMcScore] = useState<{ right: number; total: number }>({ right: 0, total: 0 });
  const [randomRevisionRef, setRandomRevisionRef] = useState<{
    surah: number;
    surahAr: string;
    ayah: number;
  }>({ surah: 78, surahAr: 'النبأ', ayah: 1 });

  // Tajweed Filter & Quiz State
  const [tajweedLevel, setTajweedLevel] = useState<'all' | 'beginner' | 'advanced' | 'kids'>('all');
  const [tjAnswers, setTjAnswers] = useState<Record<string, number>>({});

  // Khatmah Form State
  const [khatmahTitle, setKhatmahTitle] = useState('ختمة القرآن المباركة');
  const [khatmahDays, setKhatmahDays] = useState<number>(30);
  const [khatmahShareConsent, setKhatmahShareConsent] = useState<boolean>(false);

  // Fetch Monthly Prayer Timetable
  const loadMonthlyTimetable = useCallback(async () => {
    setLoadingMonthly(true);
    try {
      const methodObj =
        CALCULATION_METHODS_META.find((m) => m.id === calcMethod) || CALCULATION_METHODS_META[0];
      const school = madhab === 'hanafi' ? 1 : 0;
      const res = await fetch(
        `/api/prayer/calendar?lat=${userCoords.lat}&lng=${userCoords.lng}&method=${methodObj.aladhanCode}&school=${school}`
      );
      if (res.ok) {
        const d = await res.json();
        setMonthlyDays(Array.isArray(d.days) ? d.days : []);
      }
    } catch {
      // Local adhan computation remains active
    } finally {
      setLoadingMonthly(false);
    }
  }, [userCoords.lat, userCoords.lng, calcMethod, madhab]);

  useEffect(() => {
    if (toolsTab === 'prayer') {
      void loadMonthlyTimetable();
    }
  }, [toolsTab, loadMonthlyTimetable]);

  // Listen to DeviceOrientation on Qibla tab when available
  useEffect(() => {
    if (toolsTab !== 'qibla') return;
    const handler = (e: DeviceOrientationEvent) => {
      const webkitHeading = (e as unknown as { webkitCompassHeading?: number })
        .webkitCompassHeading;
      if (typeof webkitHeading === 'number') {
        setDeviceHeading(Math.round(webkitHeading));
      } else if (typeof e.alpha === 'number') {
        setDeviceHeading(Math.round(360 - e.alpha));
      }
    };
    window.addEventListener('deviceorientation', handler);
    return () => window.removeEventListener('deviceorientation', handler);
  }, [toolsTab]);

  // Load Surah Verses for Interactive Hifz Test
  useEffect(() => {
    if (toolsTab !== 'hifz') return;
    let cancelled = false;
    const loadQuizSurah = async () => {
      setQuizLoading(true);
      setRevealedAyahNums([]);
      setMcQuestionIdx(0);
      setMcSelectedAyah(null);
      try {
        const res = await fetch(`/api/quran/surah/${quizSurah}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && Array.isArray(data.ayahs)) {
            setQuizAyahs(data.ayahs);
          }
        }
      } catch {
        // Offline safe
      } finally {
        if (!cancelled) setQuizLoading(false);
      }
    };
    void loadQuizSurah();
    return () => {
      cancelled = true;
    };
  }, [toolsTab, quizSurah]);

  const handleRequestBrowserLocation = () => {
    if (!('geolocation' in navigator)) {
      pushToast('warning', MESSAGE_LIBRARY[lang].errors.geolocationFailed);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: Number(pos.coords.latitude.toFixed(4)),
          lng: Number(pos.coords.longitude.toFixed(4)),
          labelAr: 'موقعي الحالي المحدد',
        });
        pushToast('success', MESSAGE_LIBRARY[lang].success.prayerUpdated);
      },
      () => {
        pushToast('warning', MESSAGE_LIBRARY[lang].errors.geolocationFailed);
      },
      { timeout: 8000 }
    );
  };

  const toggleAdhanSound = () => {
    if (!adhanAudioRef.current) {
      adhanAudioRef.current = new Audio();
      adhanAudioRef.current.preload = 'none';
      adhanAudioRef.current.onended = () => setIsAdhanPlaying(false);
    }
    const el = adhanAudioRef.current;
    if (isAdhanPlaying) {
      el.pause();
      el.currentTime = 0;
      setIsAdhanPlaying(false);
    } else {
      el.src = '/api/prayer/adhan-audio';
      el.load();
      el.play()
        .then(() => setIsAdhanPlaying(true))
        .catch((err) => {
          if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') return;
          setIsAdhanPlaying(false);
          pushToast('error', MESSAGE_LIBRARY[lang].errors.audioFailed);
        });
    }
  };

  const handleHijriConvert = async () => {
    setConvLoading(true);
    try {
      const dd = convDay.padStart(2, '0');
      const mm = convMonth.padStart(2, '0');
      const res = await fetch(
        `/api/hijri/convert?date=${dd}-${mm}-${convYear}&direction=${convDirection}`
      );
      if (res.ok) {
        const d = await res.json();
        setConvResult({
          hijriText: `${d.hijri.weekdayAr} ${d.hijri.day} ${d.hijri.monthAr} ${d.hijri.year} هـ`,
          gregText: `${d.gregorian.weekdayEn}, ${d.gregorian.day} ${d.gregorian.monthEn} ${d.gregorian.year} م`,
          source: d.source,
        });
      }
    } catch {
      pushToast('error', MESSAGE_LIBRARY[lang].errors.serverUnreachable);
    } finally {
      setConvLoading(false);
    }
  };

  const handleCreateHifzPlan = () => {
    const scopeMap = {
      juz30: { title: 'حفظ جزء عمّ كاملاً', scope: 'الجزء الثلاثون (عمّ)', total: 564, startSurah: 78 },
      juz29: { title: 'حفظ جزء تبارك', scope: 'الجزء التاسع والعشرون (تبارك)', total: 431, startSurah: 67 },
      baqarah: { title: 'حفظ سورة البقرة المباركة', scope: 'سورة البقرة كاملة', total: 286, startSurah: 2 },
      full: { title: 'ختمة حفظ القرآن الكريم كاملاً', scope: 'المصحف الشريف كاملاً (114 سورة)', total: 6236, startSurah: 1 },
    }[hifzScope];

    const durationDays = Math.max(1, Math.ceil(scopeMap.total / Math.max(1, hifzDailyAyahs)));

    void upsertHifzPlan({
      id: `hifz_${hifzScope}_${user?.uid || 'guest'}`,
      userId: user?.uid || 'guest',
      title: scopeMap.title,
      targetScope: scopeMap.scope,
      dailyAyahs: hifzDailyAyahs,
      durationDays,
      memorizedAyahsCount: 0,
      totalTargetAyahs: scopeMap.total,
      currentSurah: scopeMap.startSurah,
      currentAyah: 1,
      reminderTime: hifzReminder,
      status: 'active',
      updatedAtIso: new Date().toISOString(),
    });
  };

  const handleCreateKhatmah = () => {
    const days = Math.max(1, Math.min(365, khatmahDays));
    const dailyPages = Math.max(1, Math.ceil(604 / days));
    void upsertKhatmahPlan({
      id: `khatmah_${Date.now()}`,
      userId: user?.uid || 'guest',
      title: khatmahTitle.trim() || 'ختمة القرآن الكريم',
      durationDays: days,
      dailyPages,
      completedPages: 0,
      currentJuz: 1,
      reminderTime: '20:00',
      shareConsent: khatmahShareConsent,
      status: 'active',
      updatedAtIso: new Date().toISOString(),
    });
  };

  const subTabs: Array<{ id: ToolsSubTab; ar: string; en: string; icon: React.ReactNode }> = [
    { id: 'prayer', ar: 'مواقيت الصلاة والأذان', en: 'Prayer Times', icon: <Clock className="w-4 h-4" /> },
    { id: 'qibla', ar: 'اتجاه القبلة', en: 'Qibla Compass', icon: <Compass className="w-4 h-4" /> },
    { id: 'hijri', ar: 'التقويم الهجري', en: 'Hijri Calendar', icon: <Calendar className="w-4 h-4" /> },
    { id: 'hifz', ar: 'حفظ القرآن والاختبارات', en: 'Hifz & Quizzes', icon: <Award className="w-4 h-4" /> },
    { id: 'tajweed', ar: 'تعليم التجويد والأطفال', en: 'Tajweed & Kids', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'khatmah', ar: 'ختمة القرآن', en: 'Khatmah Planner', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'haramain', ar: 'الحرمان والمساجد الشهيرة', en: 'Haramain Atlas', icon: <Landmark className="w-4 h-4" /> },
  ];

  const hijriToday = getFormattedHijriToday(new Date(nowMs));
  const activeKhatmah = khatmahPlans.find((k) => k.status === 'active') || khatmahPlans[0] || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200 dark:border-emerald-950">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => navigateTo('tools', { toolsTab: tab.id })}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
              toolsTab === tab.id
                ? 'bg-[#0E4A3A] text-white dark:bg-amber-400 dark:text-stone-950'
                : 'bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 text-stone-700 dark:text-stone-300 hover:border-emerald-700'
            }`}
          >
            {tab.icon}
            <span>{lang === 'ar' ? tab.ar : tab.en}</span>
          </button>
        ))}
      </div>

      {/* =====================================================================
          1. PRAYER TIMES & ADHAN (Section 9)
         ===================================================================== */}
      {toolsTab === 'prayer' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
                  مواقيت الصلاة الدقيقة · {userCoords.labelAr}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {hijriToday.ar} · الصلاة القادمة: {prayerSchedule.nextPrayerNameAr} بعد{' '}
                  <span className="font-mono font-bold text-[#0E4A3A] dark:text-amber-300">
                    {formatCountdownHMS(prayerSchedule.nextPrayerTime, nowMs)}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRequestBrowserLocation}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0E4A3A] text-white text-xs font-semibold"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-300" />
                  <span>تحديد موقعي تلقائياً</span>
                </button>

                <button
                  type="button"
                  onClick={toggleAdhanSound}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                >
                  {isAdhanPlaying ? <Pause className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isAdhanPlaying ? 'إيقاف الصوت' : 'معاينة صوت التذكير'}</span>
                </button>
              </div>
            </div>

            {/* City, Calculation Method & Madhab Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-stone-100 dark:border-emerald-950 text-xs">
              <div>
                <label className="block font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  اختيار المدينة يدوياً:
                </label>
                <select
                  value={selectedCityId}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                  className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5"
                >
                  {WORLD_ISLAMIC_CITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr} — {c.countryAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  طريقة الحساب الفلكي المعتمدة:
                </label>
                <select
                  value={calcMethod}
                  onChange={(e) => setCalcMethod(e.target.value as CalcMethodId)}
                  className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5"
                >
                  {CALCULATION_METHODS_META.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  حساب وقت صلاة العصر:
                </label>
                <select
                  value={madhab}
                  onChange={(e) => setMadhab(e.target.value as 'shafi' | 'hanafi')}
                  className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5"
                >
                  <option value="shafi">جمهور الفقهاء (الشافعي، المالكي، الحنبلي)</option>
                  <option value="hanafi">المذهب الحنفي (ظل المثلين)</option>
                </select>
              </div>
            </div>

            {/* Today's 6 Timings Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              {[
                { key: 'fajr', ar: 'الفجر', time: prayerSchedule.fajr },
                { key: 'sunrise', ar: 'الشروق', time: prayerSchedule.sunrise },
                { key: 'dhuhr', ar: 'الظهر', time: prayerSchedule.dhuhr },
                { key: 'asr', ar: 'العصر', time: prayerSchedule.asr },
                { key: 'maghrib', ar: 'المغرب', time: prayerSchedule.maghrib },
                { key: 'isha', ar: 'العشاء', time: prayerSchedule.isha },
              ].map((item) => {
                const active = prayerSchedule.nextPrayerKey === item.key;
                return (
                  <div
                    key={item.key}
                    className={`p-4 rounded-xl border text-center ${
                      active
                        ? 'bg-[#0E4A3A] text-white border-amber-400 shadow-sm'
                        : 'bg-stone-50 dark:bg-[#15251E] border-stone-200 dark:border-emerald-900 text-stone-900 dark:text-stone-100'
                    }`}
                  >
                    <div className={`text-xs font-bold ${active ? 'text-amber-300' : 'text-stone-500'}`}>
                      {item.ar}
                    </div>
                    <div className="font-mono text-lg font-bold tabular-nums mt-1">
                      {formatTimeHHMM(item.time, lang)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Timetable */}
          <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
                جدول مواقيت الصلاة الشهري والتقويم المقابل
              </h3>
              {loadingMonthly && <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />}
            </div>

            {monthlyDays.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 dark:border-emerald-900 text-stone-500">
                      <th className="py-2.5 px-2 text-start">اليوم والتاريخ الهجري</th>
                      <th className="py-2.5 px-2 text-start">الميلادي</th>
                      <th className="py-2.5 px-2">الفجر</th>
                      <th className="py-2.5 px-2">الشروق</th>
                      <th className="py-2.5 px-2">الظهر</th>
                      <th className="py-2.5 px-2">العصر</th>
                      <th className="py-2.5 px-2">المغرب</th>
                      <th className="py-2.5 px-2">العشاء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-emerald-950/70 tabular-nums">
                    {monthlyDays.slice(0, 15).map((d, idx) => (
                      <tr key={idx} className="hover:bg-stone-50 dark:hover:bg-[#15251E]">
                        <td className="py-2 px-2 font-semibold">
                          {d.weekdayAr} {d.hijriDay} {d.hijriMonthAr}
                        </td>
                        <td className="py-2 px-2 text-stone-500">{d.gregorianDate}</td>
                        <td className="py-2 px-2 text-center">{d.timings.Fajr}</td>
                        <td className="py-2 px-2 text-center">{d.timings.Sunrise}</td>
                        <td className="py-2 px-2 text-center">{d.timings.Dhuhr}</td>
                        <td className="py-2 px-2 text-center">{d.timings.Asr}</td>
                        <td className="py-2 px-2 text-center">{d.timings.Maghrib}</td>
                        <td className="py-2 px-2 text-center">{d.timings.Isha}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          2. INTERACTIVE QIBLA COMPASS (Section 10)
         ===================================================================== */}
      {toolsTab === 'qibla' && (
        <div className="max-w-2xl mx-auto rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-6 sm:p-8 text-center space-y-6 islamic-pattern-subtle">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
              بوصلة اتجاه القبلة المشرفة
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1">
              الموقع المحدد: {userCoords.labelAr} ({userCoords.lat.toFixed(2)}°, {userCoords.lng.toFixed(2)}°)
            </p>
          </div>

          {/* Visual SVG Compass Dial */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto flex items-center justify-center">
            <div
              className="w-full h-full rounded-full border-4 border-[#0E4A3A] dark:border-amber-400/70 bg-[#FBF9F5] dark:bg-[#0B1511] shadow-xl relative flex items-center justify-center transition-transform duration-300"
              style={{
                transform:
                  deviceHeading !== null ? `rotate(${-deviceHeading}deg)` : 'rotate(0deg)',
              }}
            >
              <span className="absolute top-3 font-bold text-xs text-stone-700 dark:text-stone-300">
                شمال (N)
              </span>
              <span className="absolute bottom-3 text-xs text-stone-400">جنوب (S)</span>
              <span className="absolute end-3 text-xs text-stone-400">شرق (E)</span>
              <span className="absolute start-3 text-xs text-stone-400">غرب (W)</span>

              {/* Rotating Qibla Needle Pointing to Kaaba Bearing */}
              <div
                className="w-full h-full absolute inset-0 flex items-center justify-center"
                style={{ transform: `rotate(${prayerSchedule.qiblaDegrees}deg)` }}
              >
                <div className="flex flex-col items-center -translate-y-14">
                  <div className="w-9 h-9 rounded-lg bg-stone-950 border-2 border-amber-400 flex items-center justify-center shadow-md">
                    <Navigation className="w-4 h-4 text-amber-400 fill-current" />
                  </div>
                  <div className="w-1 h-16 bg-gradient-to-b from-amber-500 to-[#0E4A3A] rounded-full" />
                </div>
              </div>

              <div className="w-4 h-4 rounded-full bg-[#0E4A3A] dark:bg-amber-400 z-10" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900">
              <div className="text-xs text-stone-500">زاوية القبلة من الشمال الحقيقي</div>
              <div className="font-mono text-2xl font-bold text-[#0E4A3A] dark:text-amber-300 mt-1">
                {prayerSchedule.qiblaDegrees}°
              </div>
            </div>
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900">
              <div className="text-xs text-stone-500">المسافة الجيوديسية إلى الكعبة</div>
              <div className="font-mono text-2xl font-bold text-[#0E4A3A] dark:text-amber-300 mt-1">
                {prayerSchedule.distanceToKaabaKm.toLocaleString()} كم
              </div>
            </div>
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400">
            {deviceHeading !== null
              ? `قراءة مستشعر البوصلة الحالية: ${deviceHeading}°`
              : 'ضع هاتفك بشكل أفقي بعيداً عن المعادن المغناطيسية، أو وجّه سهم الكعبة الذهبي بمقدار الزاوية الموضحة من اتجاه الشمال.'}
          </p>
        </div>
      )}

      {/* =====================================================================
          3. HIJRI CALENDAR & DATE CONVERTER (Section 10)
         ===================================================================== */}
      {toolsTab === 'hijri' && (
        <div className="space-y-6">
          {/* Today Banner & Converter */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl bg-[#0E4A3A] text-white p-6 space-y-3 islamic-pattern-subtle">
              <div className="text-xs text-amber-300 font-semibold">التاريخ الهجري والميلادي اليوم</div>
              <h2 className="font-display text-3xl font-bold">{hijriToday.ar}</h2>
              <p className="text-sm text-stone-200">
                الموافق ميلادياً: {new Date(nowMs).toLocaleDateString('ar-SA-u-nu-latn', { dateStyle: 'full' })}
              </p>
              <p className="text-xs text-amber-200/90 pt-2 border-t border-white/15 leading-relaxed">
                منهجية التقويم: يُعتمد تقويم أم القرى الفلكي في الحساب والتنسيق، مع التذكير بأن دخول الشهور التعبدية كرمضان والعيدين وذي الحجة يثبت بالرؤية الشرعية المعتمدة للهلال في كل بلد.
              </p>
            </div>

            <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-6 space-y-4">
              <h3 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
                محوّل التاريخ بين الهجري والميلادي
              </h3>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setConvDirection('gToH');
                    setConvYear('2026');
                  }}
                  className={`flex-1 py-2 rounded-lg font-semibold ${
                    convDirection === 'gToH'
                      ? 'bg-[#0E4A3A] text-white'
                      : 'bg-stone-100 dark:bg-[#15251E]'
                  }`}
                >
                  من ميلادي إلى هجري
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConvDirection('hToG');
                    setConvYear('1448');
                  }}
                  className={`flex-1 py-2 rounded-lg font-semibold ${
                    convDirection === 'hToG'
                      ? 'bg-[#0E4A3A] text-white'
                      : 'bg-stone-100 dark:bg-[#15251E]'
                  }`}
                >
                  من هجري إلى ميلادي
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={convDay}
                  onChange={(e) => setConvDay(e.target.value)}
                  placeholder="اليوم (DD)"
                  className="rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2 text-center font-mono"
                />
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={convMonth}
                  onChange={(e) => setConvMonth(e.target.value)}
                  placeholder="الشهر (MM)"
                  className="rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2 text-center font-mono"
                />
                <input
                  type="number"
                  value={convYear}
                  onChange={(e) => setConvYear(e.target.value)}
                  placeholder="السنة (YYYY)"
                  className="rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2 text-center font-mono"
                />
              </div>

              <button
                type="button"
                onClick={() => void handleHijriConvert()}
                className="w-full py-2.5 rounded-xl bg-[#0E4A3A] text-white text-xs font-bold"
              >
                {convLoading ? 'جارٍ التحويل...' : 'تحويل التاريخ الآن'}
              </button>

              {convResult && (
                <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-xs space-y-1">
                  <div className="font-bold text-stone-900 dark:text-stone-100">
                    الهجري: {convResult.hijriText}
                  </div>
                  <div className="text-stone-700 dark:text-stone-300">
                    الميلادي: {convResult.gregText}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Islamic Occasions & 12 Hijri Months */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-5 space-y-3">
              <h3 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
                المناسبات والمواسم الإسلامية الكبرى
              </h3>
              <div className="space-y-2.5">
                {ISLAMIC_OCCASIONS.map((occ) => (
                  <div
                    key={occ.id}
                    className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200/80 dark:border-emerald-900/60"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-[#0E4A3A] dark:text-amber-300">
                      <span>{occ.titleAr}</span>
                      <span>{occ.hijriDateAr}</span>
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-1">
                      {occ.descriptionAr}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-5 space-y-3">
              <h3 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
                شهور السنة الهجرية القمرية الاثنا عشر
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {HIJRI_MONTHS_LIST.map((m) => (
                  <div
                    key={m.number}
                    className="p-3 rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200/80 dark:border-emerald-900/60"
                  >
                    <div className="font-bold text-xs text-stone-900 dark:text-stone-100">
                      {m.number}. {m.ar} ({m.en})
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      {m.noteAr}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          4. QURAN MEMORIZATION (HIFZ) & INTERACTIVE TESTS (Section 5)
         ===================================================================== */}
      {toolsTab === 'hifz' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Create Personal Hifz Plan */}
            <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-5 space-y-4">
              <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
                إنشاء خطة حفظ شخصية وجدول زمني
              </h2>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">النطاق القرآني المطلوب حفظه:</label>
                  <select
                    value={hifzScope}
                    onChange={(e) => setHifzScope(e.target.value as typeof hifzScope)}
                    className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5"
                  >
                    <option value="juz30">الجزء الثلاثون (عمّ) — 564 آية</option>
                    <option value="juz29">الجزء التاسع والعشرون (تبارك) — 431 آية</option>
                    <option value="baqarah">سورة البقرة كاملة — 286 آية</option>
                    <option value="full">ختمة حفظ المصحف كاملاً — 6,236 آية</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">الورد اليومي (عدد الآيات):</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={hifzDailyAyahs}
                      onChange={(e) => setHifzDailyAyahs(Math.max(1, Number(e.target.value) || 5))}
                      className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">وقت تذكير الحفظ:</label>
                    <input
                      type="time"
                      value={hifzReminder}
                      onChange={(e) => setHifzReminder(e.target.value)}
                      className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2 font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#15251E] text-stone-700 dark:text-stone-300 space-y-1">
                  <div>الجدول الأسبوعي: {hifzDailyAyahs * 6} آيات حفظ + يوم للمراجعة المركزة</div>
                  <div>الجدول الشهري المتوقع: {hifzDailyAyahs * 26} آية محفوظة بإتقان</div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateHifzPlan}
                  className="w-full py-2.5 rounded-xl bg-[#0E4A3A] text-white font-bold"
                >
                  اعتماد وحفظ خطة الحفظ
                </button>
              </div>

              {/* Active Plans List */}
              {hifzPlans.length > 0 && (
                <div className="pt-4 border-t border-stone-200 dark:border-emerald-950 space-y-3">
                  {hifzPlans.map((plan) => {
                    const pct = Math.min(
                      100,
                      Math.round((plan.memorizedAyahsCount / Math.max(1, plan.totalTargetAyahs)) * 100)
                    );
                    return (
                      <div
                        key={plan.id}
                        className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-300/70 dark:border-emerald-800 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>{plan.title}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="text-stone-600 dark:text-stone-300">
                          أنجزت {plan.memorizedAyahsCount} من {plan.totalTargetAyahs} آية · المدة المقدرة {plan.durationDays} يوم
                        </div>
                        <div className="w-full h-2 rounded-full bg-stone-200 dark:bg-emerald-950 overflow-hidden">
                          <div className="h-full bg-[#0E4A3A] dark:bg-amber-400" style={{ width: `${pct}%` }} />
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            void upsertHifzPlan({
                              ...plan,
                              memorizedAyahsCount: Math.min(
                                plan.totalTargetAyahs,
                                plan.memorizedAyahsCount + plan.dailyAyahs
                              ),
                              updatedAtIso: new Date().toISOString(),
                            })
                          }
                          className="w-full py-2 rounded-lg bg-[#0E4A3A] text-white font-semibold"
                        >
                          + تسجيل إتمام حفظ ورد اليوم ({plan.dailyAyahs} آيات)
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Random Revision System */}
              <div className="pt-3 border-t border-stone-200 dark:border-emerald-950 flex items-center justify-between gap-2 text-xs">
                <div>
                  <div className="font-bold">نظام المراجعة العشوائية:</div>
                  <div className="text-stone-500">
                    سورة {randomRevisionRef.surahAr} · الآية {randomRevisionRef.ayah}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const randomIdx = Math.floor(Math.random() * ALL_SURAHS.length);
                      const s = ALL_SURAHS[randomIdx];
                      const a = Math.max(1, Math.floor(Math.random() * s.ayahCount));
                      setRandomRevisionRef({ surah: s.number, surahAr: s.nameAr, ayah: a });
                    }}
                    className="p-2 rounded-lg bg-stone-100 dark:bg-[#15251E]"
                    title="اختيار موضع مراجعة عشوائي"
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      navigateTo('quran', {
                        quranTab: 'mushaf',
                        surah: randomRevisionRef.surah,
                        ayah: randomRevisionRef.ayah,
                      })
                    }
                    className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-semibold"
                  >
                    سمّع الآن
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Hifz Tests: Hide Words & Complete the Verse */}
            <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
                    اختبارات التسميع وتثبيت الحفظ التفاعلية
                  </h2>
                  <p className="text-xs text-stone-500">
                    اختر السورة ونوع الاختبار لتقوية الحفظ واسترجاع أواخر الآيات
                  </p>
                </div>

                <select
                  value={quizSurah}
                  onChange={(e) => setQuizSurah(Number(e.target.value))}
                  className="rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2 text-xs font-semibold"
                >
                  {ALL_SURAHS.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number}. سورة {s.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setHifzTestMode('hide_words')}
                  className={`flex-1 py-2 rounded-xl font-semibold inline-flex items-center justify-center gap-1.5 ${
                    hifzTestMode === 'hide_words'
                      ? 'bg-[#0E4A3A] text-white'
                      : 'bg-stone-100 dark:bg-[#15251E]'
                  }`}
                >
                  <EyeOff className="w-4 h-4" />
                  <span>إخفاء الكلمات ومحاولة إكمالها</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHifzTestMode('complete_next')}
                  className={`flex-1 py-2 rounded-xl font-semibold inline-flex items-center justify-center gap-1.5 ${
                    hifzTestMode === 'complete_next'
                      ? 'bg-[#0E4A3A] text-white'
                      : 'bg-stone-100 dark:bg-[#15251E]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>اختبار إكمال الآية التالية</span>
                </button>
              </div>

              {quizLoading ? (
                <div className="py-12 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جارٍ تجهيز آيات الاختبار الموثقة...</span>
                </div>
              ) : hifzTestMode === 'hide_words' ? (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pe-1">
                  {quizAyahs.slice(0, 15).map((ayah) => {
                    const isRevealed = revealedAyahNums.includes(ayah.numberInSurah);
                    const words = ayah.textUthmani.split(' ');
                    return (
                      <div
                        key={ayah.number}
                        className="p-4 rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900/60 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs text-stone-500">
                          <span>الآية {ayah.numberInSurah}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setRevealedAyahNums((prev) =>
                                isRevealed
                                  ? prev.filter((n) => n !== ayah.numberInSurah)
                                  : [...prev, ayah.numberInSurah]
                              )
                            }
                            className="inline-flex items-center gap-1 text-[#0E4A3A] dark:text-amber-300 font-semibold"
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{isRevealed ? 'إخفاء للتسميع' : 'إظهار الآية للتحقق'}</span>
                          </button>
                        </div>
                        <p dir="rtl" className="font-quran-uthmani text-2xl leading-loose text-stone-900 dark:text-stone-100">
                          {words.map((w, idx) => {
                            const mask = !isRevealed && idx % 2 === 1;
                            return (
                              <span key={idx} className="inline-block mx-1">
                                {mask ? '•••••' : w}
                              </span>
                            );
                          })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : quizAyahs.length >= 2 ? (
                <div className="space-y-4">
                  {(() => {
                    const safeIdx = Math.min(mcQuestionIdx, quizAyahs.length - 2);
                    const promptAyah = quizAyahs[safeIdx];
                    const correctNext = quizAyahs[safeIdx + 1];
                    const distractors = quizAyahs
                      .filter((a) => a.numberInSurah !== correctNext.numberInSurah && a.numberInSurah !== promptAyah.numberInSurah)
                      .slice(0, 3);
                    const options = [correctNext, ...distractors].sort(
                      (a, b) => a.numberInSurah - b.numberInSurah
                    );

                    return (
                      <>
                        <div className="flex items-center justify-between text-xs text-stone-500">
                          <span>اختر الآية التالية مباشرة لهذه الآية الكريمة:</span>
                          <span className="font-bold text-[#0E4A3A] dark:text-amber-300">
                            النتيجة: {mcScore.right} / {mcScore.total}
                          </span>
                        </div>

                        <div className="p-5 rounded-xl bg-[#FBF9F5] dark:bg-[#0B1511] border border-amber-500/30 text-center">
                          <p className="font-quran-uthmani text-2xl text-stone-900 dark:text-stone-100 leading-loose">
                            ﴿ {promptAyah.textUthmani} ﴾
                          </p>
                        </div>

                        <div className="space-y-2">
                          {options.map((opt) => {
                            const chosen = mcSelectedAyah === opt.numberInSurah;
                            const isCorrect = opt.numberInSurah === correctNext.numberInSurah;
                            return (
                              <button
                                key={opt.number}
                                type="button"
                                disabled={mcSelectedAyah !== null}
                                onClick={() => {
                                  setMcSelectedAyah(opt.numberInSurah);
                                  setMcScore((s) => ({
                                    right: s.right + (isCorrect ? 1 : 0),
                                    total: s.total + 1,
                                  }));
                                }}
                                className={`w-full text-right p-3.5 rounded-xl border font-quran-uthmani text-xl leading-loose transition-colors ${
                                  mcSelectedAyah !== null && isCorrect
                                    ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-500 text-emerald-950 dark:text-emerald-100'
                                    : chosen && !isCorrect
                                      ? 'bg-red-50 dark:bg-red-950/50 border-red-400'
                                      : 'bg-stone-50 dark:bg-[#15251E] border-stone-200 dark:border-emerald-900 hover:border-[#0E4A3A]'
                                }`}
                              >
                                {opt.textUthmani}
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setMcSelectedAyah(null);
                              setMcQuestionIdx((prev) =>
                                prev + 1 < quizAyahs.length - 1 ? prev + 1 : 0
                              );
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E4A3A] text-white text-xs font-semibold"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>السؤال التالي</span>
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          5. TAJWEED ACADEMY & KIDS LEARNING (Sections 6 & 23)
         ===================================================================== */}
      {toolsTab === 'tajweed' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
                أكاديمية التجويد التطبيقي ومخارج الحروف وركن الطفل القرآني
              </h2>
              <p className="text-xs text-stone-500">
                دروس منهجية مع أمثلة صوتية بصوت الشيخ د. أيمن رشدي سويد واختبار تفاعلي
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {[
                { id: 'all', ar: 'جميع الدروس' },
                { id: 'beginner', ar: 'المستوى التأسيسي' },
                { id: 'advanced', ar: 'المخارج والمدود' },
                { id: 'kids', ar: 'ركن الطفل القرآني' },
              ].map((lv) => (
                <button
                  key={lv.id}
                  type="button"
                  onClick={() => setTajweedLevel(lv.id as typeof tajweedLevel)}
                  className={`px-3 py-1.5 rounded-lg font-semibold ${
                    tajweedLevel === lv.id
                      ? 'bg-[#0E4A3A] text-white dark:bg-amber-400 dark:text-stone-950'
                      : 'bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950'
                  }`}
                >
                  {lv.ar}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {TAJWEED_LESSONS.filter(
              (l) => tajweedLevel === 'all' || l.level === tajweedLevel
            ).map((lesson) => (
              <div
                key={lesson.id}
                className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200/90 dark:border-emerald-950/80 p-5 space-y-3"
              >
                <div className="text-xs font-bold text-[#0E4A3A] dark:text-amber-300">
                  {lesson.lettersAr}
                </div>
                <h3 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
                  {lesson.titleAr}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  {lesson.summaryAr}
                </p>
                <ul className="space-y-1.5 text-xs text-stone-700 dark:text-stone-200">
                  {lesson.stepsAr.map((st, idx) => (
                    <li key={idx} className="leading-relaxed">
                      • {st}
                    </li>
                  ))}
                </ul>

                <div className="p-3.5 rounded-xl bg-[#FBF9F5] dark:bg-[#0B1511] border border-amber-500/25 space-y-2">
                  <p className="font-quran-uthmani text-xl text-stone-900 dark:text-stone-100">
                    ﴿ {lesson.exampleVerseAr} ﴾
                  </p>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-stone-500">{lesson.exampleRefAr}</span>
                    <button
                      type="button"
                      onClick={() =>
                        playVerseAudio({
                          surahNumber: 1,
                          ayahNumber: 1,
                          globalAyahNumber: lesson.globalAyahAudioId,
                          reciterId: 'ar.aymanswoaid',
                          verseText: lesson.exampleVerseAr,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E4A3A] text-white font-semibold shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 text-amber-300" />
                      <span>مثال صوتي تعليمي</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Tajweed Quiz */}
          <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-6 space-y-4">
            <h3 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
              الاختبار التطبيقي في أحكام التجويد
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TAJWEED_QUIZ_QUESTIONS.map((q) => {
                const userAns = tjAnswers[q.id];
                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900/60 space-y-2.5 text-xs"
                  >
                    <div className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {q.questionAr}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {q.optionsAr.map((opt, idx) => {
                        const isSelected = userAns === idx;
                        const isCorrect = idx === q.correctIndex;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setTjAnswers((prev) => ({ ...prev, [q.id]: idx }))}
                            className={`p-2 rounded-lg border text-start font-medium ${
                              userAns !== undefined && isCorrect
                                ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-500 font-bold'
                                : isSelected && !isCorrect
                                  ? 'bg-red-100 dark:bg-red-950/60 border-red-400'
                                  : 'bg-white dark:bg-[#101C17] border-stone-200 dark:border-emerald-900'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {userAns !== undefined && (
                      <p className="text-emerald-800 dark:text-amber-300 pt-1">
                        البيان العلمي: {q.explanationAr}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          6. KHATMAH PLANNER (Section 12)
         ===================================================================== */}
      {toolsTab === 'khatmah' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-6 space-y-4">
            <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
              إنشاء ختمة قرآنية جديدة
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">اسم الختمة:</label>
                <input
                  type="text"
                  value={khatmahTitle}
                  onChange={(e) => setKhatmahTitle(e.target.value)}
                  className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">المدة بالأيام:</label>
                <div className="flex gap-2 mb-2">
                  {[15, 30, 60, 90].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setKhatmahDays(d)}
                      className={`flex-1 py-1.5 rounded-lg font-mono font-bold ${
                        khatmahDays === d
                          ? 'bg-[#0E4A3A] text-white'
                          : 'bg-stone-100 dark:bg-[#15251E]'
                      }`}
                    >
                      {d} يوم
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={3}
                  max={365}
                  value={khatmahDays}
                  onChange={(e) => setKhatmahDays(Math.max(1, Number(e.target.value) || 30))}
                  className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2 font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#15251E] text-stone-700 dark:text-stone-300">
                الورد اليومي المحسوب: <strong>{Math.ceil(604 / Math.max(1, khatmahDays))} صفحة</strong> يومياً من مصحف المدينة (604 صفحات).
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={khatmahShareConsent}
                  onChange={(e) => setKhatmahShareConsent(e.target.checked)}
                  className="rounded accent-[#0E4A3A]"
                />
                <span>أرغب بمشاركة نسبة إنجاز الختمة اختيارياً لتحفيز الأصدقاء</span>
              </label>

              <button
                type="button"
                onClick={handleCreateKhatmah}
                className="w-full py-2.5 rounded-xl bg-[#0E4A3A] text-white font-bold"
              >
                بدء الختمة الآن
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-6 space-y-5">
            <h3 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
              متابعة الختمة الحالية وسجل الختمات
            </h3>
            {!activeKhatmah ? (
              <p className="text-sm text-stone-500 py-8 text-center">
                {MESSAGE_LIBRARY[lang].empty.khatmah}
              </p>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const startPage = Math.min(604, activeKhatmah.completedPages + 1);
                  const endPage = Math.min(604, activeKhatmah.completedPages + activeKhatmah.dailyPages);
                  const pct = Math.min(100, Math.round((activeKhatmah.completedPages / 604) * 100));

                  return (
                    <div className="p-5 rounded-2xl bg-[#FBF9F5] dark:bg-[#0B1511] border border-amber-500/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
                            {activeKhatmah.title}
                          </h4>
                          <p className="text-xs text-stone-500">
                            أنجزت {activeKhatmah.completedPages} من 604 صفحات · الجزء {activeKhatmah.currentJuz}
                          </p>
                        </div>
                        <span className="font-mono text-2xl font-bold text-[#0E4A3A] dark:text-amber-300">
                          {pct}%
                        </span>
                      </div>

                      <div className="w-full h-3 rounded-full bg-stone-200 dark:bg-emerald-950 overflow-hidden">
                        <div className="h-full bg-[#0E4A3A] dark:bg-amber-400" style={{ width: `${pct}%` }} />
                      </div>

                      <div className="p-3.5 rounded-xl bg-white dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <span>
                          ورد اليوم المقرر: <strong>من صفحة {startPage} إلى صفحة {endPage}</strong>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigateTo('quran', { quranTab: 'mushaf', page: startPage })}
                            className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-emerald-800 font-semibold"
                          >
                            قراءة الورد في المصحف
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const nextCompleted = Math.min(
                                604,
                                activeKhatmah.completedPages + activeKhatmah.dailyPages
                              );
                              void upsertKhatmahPlan({
                                ...activeKhatmah,
                                completedPages: nextCompleted,
                                currentJuz: Math.min(30, Math.max(1, Math.ceil((nextCompleted / 604) * 30))),
                                status: nextCompleted >= 604 ? 'completed' : 'active',
                                updatedAtIso: new Date().toISOString(),
                              });
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-[#0E4A3A] text-white font-bold"
                          >
                            إتمام ورد اليوم
                          </button>
                        </div>
                      </div>

                      {activeKhatmah.shareConsent && (
                        <button
                          type="button"
                          onClick={async () => {
                            const msg = `بحمد الله أنجزت ${pct}% (${activeKhatmah.completedPages}/604 صفحة) من "${activeKhatmah.title}" عبر تطبيق اطمئنان القرآن.`;
                            await navigator.clipboard.writeText(msg).catch(() => {});
                            pushToast('success', 'تم نسخ بطاقة التقدم لمشاركتها مع عائلتك أو حلقتك');
                          }}
                          className="inline-flex items-center gap-1.5 text-xs text-[#0E4A3A] dark:text-amber-300 font-semibold hover:underline"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ ملخص التقدم للمشاركة الاختيارية</span>
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          7. MAKKAH, MADINAH & FAMOUS MOSQUES ATLAS (Section 23)
         ===================================================================== */}
      {toolsTab === 'haramain' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-2xl overflow-hidden bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 shadow-xs">
              <div className="h-56 relative">
                <SanctuaryImage
                  src={SANCTUARY_ASSETS.makkahHaram}
                  alt="المسجد الحرام والكعبة المشرفة بمكة المكرمة"
                  fallbackTitle="المسجد الحرام"
                />
              </div>
              <div className="p-5 space-y-2">
                <h3 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
                  المسجد الحرام — مكة المكرمة
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  أول بيت وُضع للناس مباركاً وهدى للعالمين، ومهوى أفئدة المسلمين وقبلتهم الجامعة في صلواتهم الخمس.
                </p>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 shadow-xs">
              <div className="h-56 relative">
                <SanctuaryImage
                  src={SANCTUARY_ASSETS.madinahMosque}
                  alt="المسجد النبوي الشريف بالمدينة المنورة"
                  fallbackTitle="المسجد النبوي الشريف"
                />
              </div>
              <div className="p-5 space-y-2">
                <h3 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
                  المسجد النبوي الشريف — المدينة المنورة
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  ثاني الحرمين الشريفين ومنطلق تعليم القرآن الكريم والسنة المطهرة وبناء الأمة الإسلامية.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FAMOUS_MOSQUES.map((m) => {
              const distKm = Math.round(
                calculateGeodesicDistanceKm(userCoords.lat, userCoords.lng, m.lat, m.lng)
              );
              return (
                <div
                  key={m.id}
                  className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200/90 dark:border-emerald-950/80 p-5 space-y-2.5"
                >
                  <div className="text-xs font-bold text-[#0E4A3A] dark:text-amber-300">
                    {m.cityAr} · {m.countryAr} · يبعد عنك {distKm.toLocaleString()} كم
                  </div>
                  <h4 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
                    {m.nameAr}
                  </h4>
                  <p className="text-xs text-stone-500">{m.establishedAr}</p>
                  <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                    {m.significanceAr}
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-100 dark:border-emerald-950">
                    المعالم المعمارية: {m.architectureAr}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
