import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Copy,
  Heart,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useQuranApp } from '../context/QuranAppContext';
import { AUTHENTIC_ADHKAR } from '../data/adhkarAndLibrary';
import { MESSAGE_LIBRARY } from '../data/i18n';
import type { AdhkarTabId, DhikrItem } from '../types/quran';

const TASBIH_PHRASES = [
  {
    id: 'subhanallah_wabihamdihi',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
    virtueAr: 'كلمتان خفيفتان على اللسان، ثقيلتان في الميزان، حبيبتان إلى الرحمن (متفق عليه).',
  },
  {
    id: 'astaghfirullah',
    arabic: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ',
    virtueAr: 'كان النبي ﷺ يستغفر الله ويتوب إليه في اليوم أكثر من سبعين مرة (رواه البخاري).',
  },
  {
    id: 'tahlil',
    arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    virtueAr: 'أفضل الذكر لا إله إلا الله، ومن قالها مائة مرة في يوم كانت له عدل عشر رقاب وحرزاً يومه (متفق عليه).',
  },
  {
    id: 'salawat',
    arabic: 'اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَىٰ نَبِيِّنَا مُحَمَّدٍ',
    virtueAr: 'من صلى عليّ صلاةً واحدة صلى الله عليه بها عشراً (رواه مسلم).',
  },
  {
    id: 'hawqalah',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    virtueAr: 'كنز من كنوز الجنة (متفق عليه).',
  },
];

export const AdhkarAndTasbihView: React.FC = () => {
  const {
    lang,
    quranFont,
    adhkarCategory: selectedCategory,
    favoriteDhikrIds,
    toggleFavoriteDhikr,
    navigateTo,
    pushToast,
  } = useQuranApp();

  const [countsMap, setCountsMap] = useState<Record<string, number>>({});

  // Electronic Tasbih State
  const [selectedPhraseIdx, setSelectedPhraseIdx] = useState<number>(0);
  const [tasbihTarget, setTasbihTarget] = useState<number>(33);
  const [tasbihCurrent, setTasbihCurrent] = useState<number>(0);
  const [tasbihLifetime, setTasbihLifetime] = useState<number>(() => {
    const raw = localStorage.getItem('qr_tasbih_lifetime');
    return raw ? Number(raw) || 0 : 0;
  });

  const categories: Array<{ id: AdhkarTabId; ar: string; en: string }> = [
    { id: 'all', ar: 'جميع الأذكار', en: 'All Adhkar' },
    { id: 'morning', ar: 'أذكار الصباح', en: 'Morning' },
    { id: 'evening', ar: 'أذكار المساء', en: 'Evening' },
    { id: 'after_prayer', ar: 'بعد الصلاة', en: 'After Prayer' },
    { id: 'prayer', ar: 'أذكار الصلاة', en: 'In Prayer' },
    { id: 'sleep', ar: 'النوم والاستيقاظ', en: 'Sleep & Wake' },
    { id: 'travel', ar: 'دعاء السفر', en: 'Travel' },
    { id: 'quranic_duas', ar: 'أدعية قرآنية', en: 'Quranic Duas' },
    { id: 'prophetic_duas', ar: 'أدعية نبوية', en: 'Prophetic Duas' },
    { id: 'prophets_duas', ar: 'أدعية الأنبياء', en: 'Prophets’ Duas' },
    { id: 'favorites', ar: `مفضلتي (${favoriteDhikrIds.length})`, en: 'Favorites' },
    { id: 'tasbih', ar: 'المسبحة الإلكترونية', en: 'Electronic Tasbih' },
  ];

  const displayedAdhkar = useMemo(() => {
    if (selectedCategory === 'tasbih') return [];
    if (selectedCategory === 'all') return AUTHENTIC_ADHKAR;
    if (selectedCategory === 'favorites') {
      return AUTHENTIC_ADHKAR.filter((d) => favoriteDhikrIds.includes(d.id));
    }
    return AUTHENTIC_ADHKAR.filter((d) => d.category === selectedCategory);
  }, [selectedCategory, favoriteDhikrIds]);

  const fontClass =
    quranFont === 'scheherazade'
      ? 'font-quran-scheherazade'
      : quranFont === 'naskh'
        ? 'font-quran-naskh'
        : 'font-quran-uthmani';

  const handleDhikrTap = (dhikr: DhikrItem) => {
    const current = countsMap[dhikr.id] || 0;
    if (current >= dhikr.repeatCount) return;
    const next = current + 1;
    setCountsMap((prev) => ({ ...prev, [dhikr.id]: next }));
    if (next === dhikr.repeatCount) {
      pushToast(
        'success',
        lang === 'ar'
          ? `تقبل الله — أتممت تكرار "${dhikr.titleAr}"`
          : `Completed "${dhikr.titleEn}"`
      );
    }
  };

  const incrementTasbih = () => {
    const nextCurrent = tasbihCurrent + 1;
    const nextTotal = tasbihLifetime + 1;
    setTasbihLifetime(nextTotal);
    localStorage.setItem('qr_tasbih_lifetime', String(nextTotal));

    if (tasbihTarget > 0 && nextCurrent >= tasbihTarget) {
      setTasbihCurrent(0);
      pushToast(
        'success',
        lang === 'ar'
          ? `أتممت دورة تسبيح (${tasbihTarget} مرة) — تقبل الله ذكرك`
          : `Completed ${tasbihTarget} Tasbih cycle`
      );
    } else {
      setTasbihCurrent(nextCurrent);
    }
  };

  const activePhrase = TASBIH_PHRASES[selectedPhraseIdx] || TASBIH_PHRASES[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-[#0E4A3A] dark:bg-[#0B2920] text-[#FBF9F5] p-6 border border-amber-400/30 islamic-pattern-subtle">
        <div className="text-xs text-amber-300 font-medium">
          حصن المسلم اليومي · نصوص محققة مع التخريج ودرجة الحديث
        </div>
        <h1 className="font-display text-3xl font-bold mt-1">
          {lang === 'ar'
            ? 'الأذكار النبوية والأدعية القرآنية والمسبحة الإلكترونية'
            : 'Authenticated Adhkar, Quranic Duas & Electronic Tasbih'}
        </h1>
        <p className="text-xs sm:text-sm text-stone-200 mt-1.5 max-w-3xl">
          اضغط على بطاقة الذكر لحساب عدد المرات المطلوبة، مع توثيق المصدر ودرجة الصحة لكل حديث وعدم خلط الأحاديث الضعيفة بالصحيحة.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200 dark:border-emerald-950">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => navigateTo('adhkar', { adhkarCategory: cat.id })}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-[#0E4A3A] text-white dark:bg-amber-400 dark:text-stone-950'
                : 'bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 text-stone-700 dark:text-stone-300 hover:border-emerald-700'
            }`}
          >
            {lang === 'ar' ? cat.ar : cat.en}
          </button>
        ))}
      </div>

      {/* Electronic Tasbih Dedicated Mode */}
      {selectedCategory === 'tasbih' ? (
        <div className="max-w-2xl mx-auto rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-6 sm:p-8 text-center space-y-6 shadow-sm islamic-pattern-subtle">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-500 dark:text-stone-400">
              اختر صيغة الذكر والتسبيح:
            </label>
            <div className="flex flex-wrap justify-center gap-2">
              {TASBIH_PHRASES.map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPhraseIdx(idx);
                    setTasbihCurrent(0);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedPhraseIdx === idx
                      ? 'bg-[#0E4A3A] text-white dark:bg-amber-400 dark:text-stone-950'
                      : 'bg-stone-100 dark:bg-[#15251E] text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {p.arabic.split(' ').slice(0, 3).join(' ')}...
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#FBF9F5] dark:bg-[#0B1511] border border-amber-500/30 space-y-2">
            <p className={`${fontClass} text-2xl sm:text-3xl text-stone-900 dark:text-stone-50 leading-loose`}>
              {activePhrase.arabic}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">{activePhrase.virtueAr}</p>
          </div>

          {/* Interactive Large Counter Ring */}
          <div className="py-2">
            <button
              type="button"
              onClick={incrementTasbih}
              className="w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-gradient-to-b from-[#0E4A3A] to-[#082B21] hover:from-[#115946] hover:to-[#0A3629] text-white border-4 border-amber-400/70 shadow-xl flex flex-col items-center justify-center mx-auto active:scale-95 transition-transform focus:outline-none"
            >
              <Sparkles className="w-5 h-5 text-amber-300 mb-1" />
              <span className="font-mono text-5xl font-bold tabular-nums">{tasbihCurrent}</span>
              <span className="text-xs text-amber-200 mt-1">
                {tasbihTarget > 0 ? `من ${tasbihTarget}` : 'عداد مفتوح'} · اضغط للتسبيح
              </span>
            </button>
          </div>

          {/* Target & Reset Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-200 dark:border-emerald-950 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500">الهدف:</span>
              {[33, 100, 1000, 0].map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => {
                    setTasbihTarget(target);
                    setTasbihCurrent(0);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-mono font-semibold ${
                    tasbihTarget === target
                      ? 'bg-[#0E4A3A] text-white dark:bg-amber-400 dark:text-stone-950'
                      : 'bg-stone-100 dark:bg-[#15251E] text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {target === 0 ? 'مفتوح' : target}
                </button>
              ))}
            </div>

            <div className="text-stone-600 dark:text-stone-300 font-semibold tabular-nums">
              مجموع تسبيحاتك الكلي: {tasbihLifetime}
            </div>

            <button
              type="button"
              onClick={() => setTasbihCurrent(0)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-emerald-800 text-stone-700 dark:text-stone-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تصفير الدورة</span>
            </button>
          </div>
        </div>
      ) : displayedAdhkar.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-10 text-center text-sm text-stone-500">
          لا توجد أذكار محفوظة في هذا القسم حالياً. اضغط على أيقونة القلب لحفظ أذكارك المفضلة.
        </div>
      ) : (
        <div className="space-y-4">
          {displayedAdhkar.map((dhikr) => {
            const currentCount = countsMap[dhikr.id] || 0;
            const isCompleted = currentCount >= dhikr.repeatCount;
            const isFav = favoriteDhikrIds.includes(dhikr.id);

            return (
              <article
                key={dhikr.id}
                className={`rounded-2xl p-5 sm:p-6 border transition-colors ${
                  isCompleted
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500/50'
                    : 'bg-white dark:bg-[#101C17] border-stone-200/90 dark:border-emerald-950/80'
                }`}
              >
                {/* Header & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-stone-100 dark:border-emerald-950 text-xs">
                  <div>
                    <h3 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
                      {lang === 'ar' ? dhikr.titleAr : dhikr.titleEn}
                    </h3>
                    <p className="text-stone-500 dark:text-stone-400 mt-0.5">
                      {dhikr.sourceAr} · <strong className="text-[#0E4A3A] dark:text-amber-300">{dhikr.gradingAr}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleFavoriteDhikr(dhikr.id)}
                      className={`p-2 rounded-lg border transition-colors ${
                        isFav
                          ? 'bg-red-50 dark:bg-red-950/50 border-red-300 text-red-600'
                          : 'border-stone-200 dark:border-emerald-900 text-stone-500'
                      }`}
                      aria-label="حفظ الذكر في المفضلة"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>

                    {dhikr.surahRef && (
                      <button
                        type="button"
                        onClick={() =>
                          navigateTo('quran', {
                            quranTab: 'mushaf',
                            surah: dhikr.surahRef!.surah,
                            ayah: dhikr.surahRef!.ayah,
                          })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-[#15251E] text-stone-700 dark:text-stone-200 font-medium"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>في المصحف</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard
                          .writeText(`${dhikr.arabicText}\n[${dhikr.sourceAr}]`)
                          .catch(() => {});
                        pushToast('success', MESSAGE_LIBRARY[lang].success.copied);
                      }}
                      className="p-2 rounded-lg bg-stone-100 dark:bg-[#15251E] text-stone-600 dark:text-stone-300"
                      title="نسخ الذكر مع التخريج"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Arabic Dhikr Text */}
                <p
                  dir="rtl"
                  onClick={() => handleDhikrTap(dhikr)}
                  className={`${fontClass} text-2xl sm:text-3xl text-stone-900 dark:text-stone-50 leading-[2.25] cursor-pointer select-none py-2`}
                >
                  {dhikr.arabicText}
                </p>

                {lang === 'en' && (
                  <p className="text-sm text-stone-600 dark:text-stone-300 mt-2 leading-relaxed">
                    {dhikr.translationEn}
                  </p>
                )}

                {/* Virtue & Interactive Repetition Counter */}
                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                    <span className="font-bold text-[#0E4A3A] dark:text-amber-300">الفضل والأثر: </span>
                    {dhikr.VirtueAr}
                  </p>

                  <div className="flex items-center gap-2 shrink-0">
                    {currentCount > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setCountsMap((prev) => ({ ...prev, [dhikr.id]: 0 }))
                        }
                        className="p-2 rounded-lg border border-stone-200 dark:border-emerald-900 text-stone-500 hover:text-stone-800"
                        title="إعادة العداد"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDhikrTap(dhikr)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tabular-nums transition-colors ${
                        isCompleted
                          ? 'bg-emerald-700 text-white'
                          : 'bg-[#0E4A3A] hover:bg-[#0B3B2E] text-white'
                      }`}
                    >
                      {isCompleted && <CheckCircle2 className="w-4 h-4 text-amber-300" />}
                      <span>
                        {isCompleted
                          ? `اكتمل (${dhikr.repeatCount}/${dhikr.repeatCount})`
                          : `التكرار: ${currentCount} من ${dhikr.repeatCount}`}
                      </span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
