import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Download,
  Flag,
  Library,
  Loader2,
  Mic,
  MicOff,
  Play,
  Plus,
  Search,
  Send,
  Sparkles,
  Square,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import { useQuranApp } from '../context/QuranAppContext';
import { SANCTUARY_ASSETS, SanctuaryImage } from '../data/assets';
import { ISLAMIC_LIBRARY_BOOKS } from '../data/adhkarAndLibrary';
import { MESSAGE_LIBRARY } from '../data/i18n';
import { ALL_JUZ_INDEX, ALL_SURAHS, VERIFIED_RECITERS } from '../data/surahs';
import {
  clampStr,
  collection,
  db,
  doc,
  handleFirestoreError,
  onSnapshot,
  query,
  sanitizeDocId,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from '../lib/firebase';
import { saveOfflineRecord } from '../lib/offlineStorage';
import { OperationType } from '../types/quran';
import type { LibraryBook } from '../types/quran';

// ============================================================================
// 1. ISLAMIC LIBRARY VIEW (Section 14)
// ============================================================================
export const LibraryView: React.FC = () => {
  const {
    lang,
    libraryCategory,
    activeLibraryBookId,
    activeLibraryChapterIdx,
    navigateTo,
    savedBookIds,
    toggleSavedBook,
    playVerseAudio,
    pushToast,
  } = useQuranApp();

  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories: Array<{ id: string; ar: string; en: string }> = [
    { id: 'all', ar: 'جميع الكتب (9 تصنيفات)', en: 'All Books (9 Categories)' },
    { id: 'saved', ar: `القراءة لاحقاً (${savedBookIds.length})`, en: `Saved (${savedBookIds.length})` },
    { id: 'quran_sciences', ar: 'علوم القرآن', en: 'Quran Sciences' },
    { id: 'tafsir', ar: 'كتب التفسير', en: 'Tafsir Books' },
    { id: 'hadith', ar: 'الحديث الشريف', en: 'Hadith' },
    { id: 'seerah', ar: 'السيرة النبوية', en: 'Prophetic Seerah' },
    { id: 'prophets_stories', ar: 'قصص الأنبياء', en: 'Stories of Prophets' },
    { id: 'tajweed', ar: 'كتب التجويد', en: 'Tajweed Books' },
    { id: 'aqeedah', ar: 'العقيدة الصحيحة', en: 'Aqeedah' },
    { id: 'fiqh', ar: 'الفقه الميسر', en: 'Fiqh' },
    { id: 'adhkar_lectures', ar: 'الأذكار والدروس الصوتية', en: 'Adhkar & Lectures' },
  ];

  const activeBook = useMemo(
    () =>
      activeLibraryBookId
        ? ISLAMIC_LIBRARY_BOOKS.find((b) => b.id === activeLibraryBookId) || null
        : null,
    [activeLibraryBookId]
  );

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ISLAMIC_LIBRARY_BOOKS.filter((b) => {
      if (libraryCategory === 'saved' && !savedBookIds.includes(b.id)) return false;
      if (libraryCategory !== 'all' && libraryCategory !== 'saved' && b.category !== libraryCategory) {
        return false;
      }
      if (!q) return true;
      return (
        b.titleAr.includes(q) ||
        b.titleEn.toLowerCase().includes(q) ||
        b.authorAr.includes(q) ||
        b.summaryAr.includes(q)
      );
    });
  }, [libraryCategory, searchQuery, savedBookIds]);

  const relatedCategoryBooks = useMemo(() => {
    if (!activeBook) return [];
    return ISLAMIC_LIBRARY_BOOKS.filter(
      (b) => b.category === activeBook.category && b.id !== activeBook.id
    ).slice(0, 3);
  }, [activeBook]);

  const handleSaveOfflineBook = async (book: LibraryBook) => {
    await saveOfflineRecord('books', {
      id: book.id,
      book,
      savedAtIso: new Date().toISOString(),
    });
    pushToast(
      'success',
      lang === 'ar'
        ? `تم حفظ كتاب "${book.titleAr}" للقراءة دون إنترنت`
        : `Saved "${book.titleEn}" for offline reading`
    );
  };

  if (activeBook) {
    const isBookSaved = savedBookIds.includes(activeBook.id);
    const safeChapterIdx = Math.max(
      0,
      Math.min(activeBook.chapters.length - 1, activeLibraryChapterIdx)
    );
    const currentChapter = activeBook.chapters[safeChapterIdx] || activeBook.chapters[0];
    const activeCatMeta =
      categories.find((c) => c.id === activeBook.category) || categories[0];

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Book Detail Header Card */}
        <div className="rounded-2xl bg-[#08261E] text-[#FBF9F5] border border-amber-400/25 p-6 sm:p-8 space-y-4 islamic-pattern-subtle">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="text-xs text-amber-300 font-semibold">
                {lang === 'ar' ? activeCatMeta.ar : activeCatMeta.en} · {activeBook.authorAr} ·{' '}
                {activeBook.eraAr}
              </div>
              <h1 className="font-display text-2xl sm:text-4xl font-bold leading-snug">
                {activeBook.titleAr}
              </h1>
              <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
                {activeBook.summaryAr}
              </p>
              <p className="text-xs text-amber-200/90">
                النشر والتوثيق العلمي: {activeBook.publisherAr}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  navigateTo('library', {
                    libraryCategory: activeBook.category,
                    libraryBookId: null,
                    libraryChapterIdx: 0,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors"
              >
                {lang === 'ar' ? (
                  <ArrowRight className="w-4 h-4 text-amber-300" />
                ) : (
                  <ArrowLeft className="w-4 h-4 text-amber-300" />
                )}
                <span>
                  {lang === 'ar'
                    ? `عودة لقسم ${activeCatMeta.ar}`
                    : `Back to ${activeCatMeta.en}`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => toggleSavedBook(activeBook.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  isBookSaved
                    ? 'bg-amber-400 text-stone-950'
                    : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>{isBookSaved ? 'محفوظ في قائمتي' : 'حفظ للقراءة لاحقاً'}</span>
              </button>

              <button
                type="button"
                onClick={() => void handleSaveOfflineBook(activeBook)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors"
              >
                <Download className="w-4 h-4 text-amber-300" />
                <span>حفظ دون إنترنت</span>
              </button>

              {activeBook.audioLectureGlobalAyah && (
                <button
                  type="button"
                  onClick={() =>
                    playVerseAudio({
                      surahNumber: activeBook.audioLectureGlobalAyah === 262 ? 2 : 1,
                      ayahNumber: activeBook.audioLectureGlobalAyah === 262 ? 255 : 1,
                      globalAyahNumber: activeBook.audioLectureGlobalAyah!,
                      reciterId: 'ar.aymanswoaid',
                      verseText: `نموذج التلاوة التعليمية المرفق بكتاب: ${activeBook.titleAr}`,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>تشغيل النموذج الصوتي</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Asymmetric Reader Layout: Chapter Index + Main Reading Column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Chapter Index Sidebar */}
          <aside className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200/90 dark:border-emerald-950/80 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-emerald-950 pb-2.5">
              <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                فهرس أبواب وفصول الكتاب
              </h2>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                {activeBook.chapters.length} أبواب
              </span>
            </div>

            <div className="space-y-1.5">
              {activeBook.chapters.map((ch, idx) => {
                const isSelected = safeChapterIdx === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      navigateTo('library', {
                        libraryCategory: activeBook.category,
                        libraryBookId: activeBook.id,
                        libraryChapterIdx: idx,
                      })
                    }
                    className={`w-full text-start px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#0E4A3A] text-white dark:bg-amber-400 dark:text-stone-950'
                        : 'bg-stone-50 dark:bg-[#15251E] text-stone-700 dark:text-stone-300 hover:border-emerald-700 border border-transparent'
                    }`}
                  >
                    <span>
                      {idx + 1}. {ch.headingAr}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main Book Reading Canvas */}
          <article className="lg:col-span-8 rounded-2xl bg-[#FBF9F5] dark:bg-[#101C17] border border-stone-200/90 dark:border-emerald-950/80 p-6 sm:p-10 space-y-6 shadow-xs">
            <div className="border-b border-stone-200/80 dark:border-emerald-950 pb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs text-stone-500 dark:text-stone-400">
                  الباب {safeChapterIdx + 1} من {activeBook.chapters.length}
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0E4A3A] dark:text-amber-300 mt-1">
                  {currentChapter?.headingAr}
                </h2>
              </div>
            </div>

            <div className="max-w-prose text-base sm:text-xl text-stone-800 dark:text-stone-100 leading-[2.15] font-display">
              {currentChapter?.contentAr}
            </div>

            {/* Chapter Previous / Next & Return to Library Footer */}
            <div className="pt-5 border-t border-stone-200/80 dark:border-emerald-950 flex flex-wrap items-center justify-between gap-3 text-xs">
              <button
                type="button"
                disabled={safeChapterIdx <= 0}
                onClick={() =>
                  navigateTo('library', {
                    libraryCategory: activeBook.category,
                    libraryBookId: activeBook.id,
                    libraryChapterIdx: Math.max(0, safeChapterIdx - 1),
                  })
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-100 dark:bg-[#15251E] text-stone-800 dark:text-stone-200 disabled:opacity-40 font-semibold transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
                <span>الباب السابق</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigateTo('library', {
                    libraryCategory: 'all',
                    libraryBookId: null,
                    libraryChapterIdx: 0,
                  })
                }
                className="text-stone-600 dark:text-stone-300 hover:text-[#0E4A3A] dark:hover:text-amber-300 font-semibold underline underline-offset-4"
              >
                جميع كتب المكتبة الإسلامية
              </button>

              <button
                type="button"
                disabled={safeChapterIdx >= activeBook.chapters.length - 1}
                onClick={() =>
                  navigateTo('library', {
                    libraryCategory: activeBook.category,
                    libraryBookId: activeBook.id,
                    libraryChapterIdx: Math.min(activeBook.chapters.length - 1, safeChapterIdx + 1),
                  })
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E4A3A] text-white disabled:opacity-40 font-semibold transition-colors"
              >
                <span>الباب التالي</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </article>
        </div>

        {/* Related Books in the Same Discipline */}
        {relatedCategoryBooks.length > 0 && (
          <section className="space-y-3 pt-2">
            <h3 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
              مراجع أخرى في قسم {activeCatMeta.ar}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedCategoryBooks.map((rel) => (
                <button
                  key={rel.id}
                  type="button"
                  onClick={() =>
                    navigateTo('library', {
                      libraryCategory: rel.category,
                      libraryBookId: rel.id,
                      libraryChapterIdx: 0,
                    })
                  }
                  className="text-start rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200/90 dark:border-emerald-950/80 p-4 hover:border-[#0E4A3A] dark:hover:border-amber-400/70 transition-colors space-y-1.5"
                >
                  <div className="text-xs text-[#0E4A3A] dark:text-amber-300 font-semibold">
                    {rel.authorAr}
                  </div>
                  <div className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                    {rel.titleAr}
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2">
                    {rel.summaryAr}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Library Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-[#08261E] border border-stone-200 dark:border-emerald-900/70">
        <div className="absolute inset-0">
          <SanctuaryImage
            src={SANCTUARY_ASSETS.islamicLibrary}
            alt="المكتبة الإسلامية الموثقة"
            fallbackTitle="المكتبة الإسلامية"
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071F18] via-[#08261E]/85 to-transparent" />
        </div>
        <div className="relative z-10 p-6 sm:p-8 text-[#FBF9F5] space-y-2">
          <div className="text-xs text-amber-300 font-semibold">
            مصادر علمية محققة · قراءة مباشرة داخل التطبيق · حفظ دون إنترنت
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">
            المكتبة الإسلامية الموثقة وعلوم الوحيين
          </h1>
          <p className="text-xs sm:text-sm text-stone-200 max-w-2xl leading-relaxed">
            أمهات المراجع المحققة في علوم القرآن والتفسير والحديث الصحيح والسيرة النبوية وقصص الأنبياء والتجويد والفقه الميسر.
          </p>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute top-3.5 start-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث داخل المكتبة بعنوان الكتاب أو اسم الإمام المؤلف أو الموضوع..."
            className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() =>
                navigateTo('library', {
                  libraryCategory: cat.id,
                  libraryBookId: null,
                  libraryChapterIdx: 0,
                })
              }
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                libraryCategory === cat.id
                  ? 'bg-[#0E4A3A] text-white dark:bg-amber-400 dark:text-stone-950'
                  : 'bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 text-stone-700 dark:text-stone-300'
              }`}
            >
              {lang === 'ar' ? cat.ar : cat.en}
            </button>
          ))}
        </div>
      </div>

      {/* Books Grid */}
      {filteredBooks.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 text-center text-sm text-stone-500">
          {MESSAGE_LIBRARY[lang].empty.savedBooks}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBooks.map((book) => {
            const isSaved = savedBookIds.includes(book.id);
            return (
              <article
                key={book.id}
                className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200/90 dark:border-emerald-950/80 p-5 flex flex-col justify-between space-y-4 hover:border-[#0E4A3A] dark:hover:border-amber-400/60 transition-colors"
              >
                <div className="space-y-2">
                  <div className="text-xs text-[#0E4A3A] dark:text-amber-300 font-semibold">
                    {book.authorAr} · {book.eraAr}
                  </div>
                  <h3 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
                    {book.titleAr}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                    {book.summaryAr}
                  </p>
                  <p className="text-[11px] text-stone-500">النشر والتوثيق: {book.publisherAr}</p>
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-emerald-950 flex flex-wrap items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      navigateTo('library', {
                        libraryCategory: book.category,
                        libraryBookId: book.id,
                        libraryChapterIdx: 0,
                      })
                    }
                    className="flex-1 py-2 rounded-xl bg-[#0E4A3A] hover:bg-[#0B3B2E] text-white font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                    <span>قراءة الكتاب</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSavedBook(book.id)}
                    className={`p-2 rounded-xl border ${
                      isSaved
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-700 dark:text-amber-300'
                        : 'border-stone-200 dark:border-emerald-900 text-stone-600 dark:text-stone-300'
                    }`}
                    title="حفظ للقراءة لاحقاً"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleSaveOfflineBook(book)}
                    className="p-2 rounded-xl border border-stone-200 dark:border-emerald-900 text-stone-600 dark:text-stone-300"
                    title="تنزيل الكتاب للقراءة دون إنترنت"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {book.audioLectureGlobalAyah && (
                    <button
                      type="button"
                      onClick={() =>
                        playVerseAudio({
                          surahNumber: book.audioLectureGlobalAyah === 262 ? 2 : 1,
                          ayahNumber: book.audioLectureGlobalAyah === 262 ? 255 : 1,
                          globalAyahNumber: book.audioLectureGlobalAyah!,
                          reciterId: 'ar.aymanswoaid',
                          verseText: `نموذج التلاوة التعليمية المرفق بكتاب: ${book.titleAr}`,
                        })
                      }
                      className="p-2 rounded-xl bg-stone-100 dark:bg-[#15251E] text-[#0E4A3A] dark:text-amber-300"
                      title="تشغيل الدرس الصوتي المرفق"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. SMART QURANIC ASSISTANT VIEW (Section 8 — Grounded in Accredited Tafsirs)
// ============================================================================
interface AssistantResponseData {
  title: string;
  answer: string;
  tafsirDifferences: string;
  scholarlyReferral: string;
  sources: Array<{ book: string; scholar: string }>;
  verifiedVerses: Array<{
    surahNumber: number;
    ayahNumber: number;
    surahName: string;
    uthmaniText: string;
    page: number;
    juz: number;
    relevance: string;
  }>;
}

function normalizeArabicForSpeech(input: string): string {
  return input
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[؟?!.,،؛:"'()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const SmartAssistantView: React.FC = () => {
  const {
    lang,
    navigateTo,
    goBack,
    canGoBack,
    setIsSearchModalOpen,
    setSelectedReciter,
    setMushafThemeMode,
    playVerseAudio,
    reportDiagnosticsError,
    pushToast,
  } = useQuranApp();

  const [mode, setMode] = useState<'explain' | 'surah_summary' | 'thematic' | 'hifz_plan' | 'quiz'>('explain');
  const [promptInput, setPromptInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AssistantResponseData | null>(null);

  // Web Speech API Voice Interaction State
  const recognitionRef = useRef<any>(null);
  const [voiceIntentMode, setVoiceIntentMode] = useState<'auto' | 'question' | 'navigate'>('auto');
  const [voiceLang, setVoiceLang] = useState<'ar-SA' | 'en-US'>(() =>
    lang === 'en' ? 'en-US' : 'ar-SA'
  );
  const [autoSendVoice, setAutoSendVoice] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [lastVoiceFeedback, setLastVoiceFeedback] = useState<string>('');
  const [showVoiceGuide, setShowVoiceGuide] = useState<boolean>(false);
  const [isSpeakingAnswer, setIsSpeakingAnswer] = useState<boolean>(false);

  const isSpeechRecognitionSupported = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as {
      SpeechRecognition?: unknown;
      webkitSpeechRecognition?: unknown;
    };
    return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
  }, []);

  const isSpeechSynthesisSupported = useMemo(() => {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }, []);

  useEffect(() => {
    setVoiceLang(lang === 'en' ? 'en-US' : 'ar-SA');
  }, [lang]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        // Ignore cleanup errors
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const samplePrompts = [
    'اشرح لي معنى قوله تعالى: (ألا بذكر الله تطمئن القلوب) من تفسير ابن كثير والسعدي.',
    'لخّص لي المقاصد الكبرى لسورة الكهف والفتن الأربع الواردة فيها.',
    'ما أبرز الآيات القرآنية التي تتحدث عن الصبر الجميل والفرج بعد الضيق؟',
    'اقترح لي خطة عملية لحفظ سورة البقرة مع مراجعة المحفوظ أسبوعياً.',
  ];

  const handleAskAssistant = useCallback(
    async (
      overridePrompt?: string,
      overrideMode?: 'explain' | 'surah_summary' | 'thematic' | 'hifz_plan' | 'quiz'
    ) => {
      const q = (overridePrompt ?? promptInput).trim();
      const targetMode = overrideMode ?? mode;
      if (q.length < 3 || isLoading) return;
      setIsLoading(true);
      try {
        const res = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: q, mode: targetMode, lang }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'تعذر جلب البيان العلمي حالياً');
        }
        setResult(data as AssistantResponseData);
      } catch (err) {
        const refCode = await reportDiagnosticsError('assistant:ask', err);
        pushToast(
          'error',
          err instanceof Error ? err.message : MESSAGE_LIBRARY[lang].errors.unexpected,
          refCode
        );
      } finally {
        setIsLoading(false);
      }
    },
    [promptInput, mode, lang, isLoading, reportDiagnosticsError, pushToast]
  );

  // Voice Command & Question Router
  const executeVoiceCommandOrQuestion = useCallback(
    (rawSpeech: string) => {
      const cleaned = rawSpeech.trim();
      if (!cleaned) return;

      const norm = normalizeArabicForSpeech(cleaned);

      const hasQuestionIntent =
        /^(ما |ماذا |كيف |لماذا |كم |متي |اين |من هو |هل |اشرح|فسر|تفسير|وضح|بين |لخص|تلخيص|اقترح|اعطني|اذكر|استخرج|اختبرني|اسئله|سؤال|explain|what|how|why|summarize|suggest|meaning|verses about)/.test(
          norm
        ) || cleaned.includes('؟') || cleaned.includes('?');

      const hasExplicitNavVerb =
        /^(افتح|اذهب|انتقل|ودني|وريني|شغل|اعرض|فتح|رجوع|عد |العوده|open|go to|navigate|take me|show|switch to|back)/.test(
          norm
        );

      const tryMatchNavigation = (): { matched: boolean; summaryAr: string } => {
        // 1. Back command
        if ((norm === 'رجوع' || norm === 'السابق' || norm === 'العوده' || norm === 'go back') && canGoBack) {
          goBack();
          return { matched: true, summaryAr: 'تم الرجوع إلى الصفحة السابقة' };
        }

        // 2. Global search modal
        if (norm.includes('البحث الشامل') || norm === 'البحث' || norm === 'افتح البحث' || norm === 'open search') {
          setIsSearchModalOpen(true);
          return { matched: true, summaryAr: 'تم فتح نافذة البحث الشامل' };
        }

        // 3. Select Reciter by voice
        if (norm.includes('القارئ') || norm.includes('بصوت') || norm.includes('reciter')) {
          const matchedReciter = VERIFIED_RECITERS.find((r) => {
            const rNorm = normalizeArabicForSpeech(r.nameAr);
            const lastToken = rNorm.split(' ').slice(-1)[0] || rNorm;
            return (
              norm.includes(rNorm) ||
              (lastToken.length >= 4 && norm.includes(lastToken)) ||
              norm.includes(r.nameEn.toLowerCase())
            );
          });
          if (matchedReciter) {
            setSelectedReciter(matchedReciter.id);
            navigateTo('quran', { quranTab: 'recitations' });
            return {
              matched: true,
              summaryAr: `تم اختيار القارئ ${matchedReciter.nameAr} وفتح قسم التلاوات`,
            };
          }
        }

        // 3b. Mushaf Eye-Comfort (Paper) / Mushaf Night Mode voice toggle
        if (
          norm.includes('الراحه البصريه') ||
          norm.includes('الخلفيه الورقيه') ||
          norm.includes('المصحف الورقي') ||
          norm.includes('ورق شاموا') ||
          norm.includes('eye comfort') ||
          norm.includes('paper mode')
        ) {
          setMushafThemeMode('paper');
          navigateTo('quran', { quranTab: 'mushaf' });
          return {
            matched: true,
            summaryAr: 'تم تفعيل وضع الراحة البصرية (ورق الشاموا الدافئ) للمصحف الشريف',
          };
        }
        if (
          norm.includes('الوضع الليلي للمصحف') ||
          norm.includes('المصحف الليلي') ||
          norm.includes('mushaf night')
        ) {
          setMushafThemeMode('night');
          navigateTo('quran', { quranTab: 'mushaf' });
          return {
            matched: true,
            summaryAr: 'تم تفعيل الوضع الليلي الزمردي الهادئ للمصحف الشريف',
          };
        }

        // 4. Mushaf Page navigation (e.g., "صفحة 293" or "page 50")
        const pageMatch = norm.match(/(?:صفحه|صفحة|page)\s*(\d{1,3})/);
        if (pageMatch) {
          const pageNum = Number(pageMatch[1]);
          if (pageNum >= 1 && pageNum <= 604) {
            navigateTo('quran', { quranTab: 'mushaf', page: pageNum });
            return { matched: true, summaryAr: `تم الانتقال إلى صفحة المصحف رقم ${pageNum}` };
          }
        }

        // 5. Juz navigation (e.g., "جزء عم", "جزء تبارك", "الجزء 30", "juz 29")
        if (norm.includes('جزء عم') || norm.includes('الجزء الثلاثون') || norm.includes('الجزء 30') || norm.includes('juz 30')) {
          const j30 = ALL_JUZ_INDEX[29];
          navigateTo('quran', { quranTab: 'mushaf', surah: j30.startSurah, ayah: j30.startAyah, page: j30.startPage });
          return { matched: true, summaryAr: 'تم الانتقال إلى الجزء الثلاثون (جزء عمّ)' };
        }
        if (norm.includes('جزء تبارك') || norm.includes('الجزء التاسع والعشرون') || norm.includes('الجزء 29') || norm.includes('juz 29')) {
          const j29 = ALL_JUZ_INDEX[28];
          navigateTo('quran', { quranTab: 'mushaf', surah: j29.startSurah, ayah: j29.startAyah, page: j29.startPage });
          return { matched: true, summaryAr: 'تم الانتقال إلى الجزء التاسع والعشرون (تبارك)' };
        }
        const juzNumMatch = norm.match(/(?:الجزء|جزء|juz)\s*(\d{1,2})/);
        if (juzNumMatch) {
          const jNum = Number(juzNumMatch[1]);
          const juzEntry = ALL_JUZ_INDEX.find((j) => j.juz === jNum);
          if (juzEntry) {
            navigateTo('quran', {
              quranTab: 'mushaf',
              surah: juzEntry.startSurah,
              ayah: juzEntry.startAyah,
              page: juzEntry.startPage,
            });
            return { matched: true, summaryAr: `تم الانتقال إلى ${juzEntry.nameAr}` };
          }
        }

        // 6. Specific Surah (+ optional Ayah number, e.g., "افتح سورة الكهف" or "سورة البقرة آية 255")
        const matchedSurah = ALL_SURAHS.find((s) => {
          const sNorm = normalizeArabicForSpeech(s.nameAr);
          const sNoAl = sNorm.replace(/^ال/, '');
          const enLower = s.nameEn.toLowerCase().replace(/['-]/g, '');
          if (s.number === 36 && (norm.includes('ياسين') || norm.includes('سوره يس') || norm === 'يس')) {
            return true;
          }
          return (
            norm.includes(`سوره ${sNorm}`) ||
            norm.includes(`سوره ${sNoAl}`) ||
            norm === sNorm ||
            norm.includes(`surah ${enLower}`) ||
            (hasExplicitNavVerb && (norm.includes(sNorm) || norm.includes(enLower)))
          );
        });

        if (matchedSurah) {
          const ayahMatch = norm.match(/(?:ايه|آيه|ayah|verse)\s*(\d{1,3})/);
          const requestedAyah = ayahMatch
            ? Math.max(1, Math.min(matchedSurah.ayahCount, Number(ayahMatch[1])))
            : 1;
          navigateTo('quran', {
            quranTab: 'mushaf',
            surah: matchedSurah.number,
            ayah: requestedAyah,
          });
          return {
            matched: true,
            summaryAr:
              requestedAyah > 1
                ? `تم الانتقال إلى سورة ${matchedSurah.nameAr} — الآية ${requestedAyah}`
                : `تم الانتقال إلى سورة ${matchedSurah.nameAr}`,
          };
        }

        // 7. Main App Sections & Sub-tabs
        if (norm.includes('الرئيسيه') || norm === 'home' || norm.includes('الصفحه الرئيسيه') || norm.includes('go home')) {
          navigateTo('home');
          return { matched: true, summaryAr: 'تم الانتقال إلى الصفحة الرئيسية' };
        }
        if (norm.includes('مقارنه القراء') || norm.includes('compare reciters')) {
          navigateTo('quran', { quranTab: 'compare_reciters' });
          return { matched: true, summaryAr: 'تم الانتقال إلى مقارنة القراء' };
        }
        if (norm.includes('التلاوات') || norm.includes('قسم القراء') || norm.includes('مكتبه القراء') || norm.includes('recitations')) {
          navigateTo('quran', { quranTab: 'recitations' });
          return { matched: true, summaryAr: 'تم الانتقال إلى التلاوات الصوتية' };
        }
        if (norm.includes('مكتبه التفاسير') || norm.includes('اسباب النزول') || norm === 'التفسير' || norm === 'التفاسير' || (hasExplicitNavVerb && norm.includes('تفسير')) || norm.includes('tafsir')) {
          navigateTo('quran', { quranTab: 'tafsir' });
          return { matched: true, summaryAr: 'تم الانتقال إلى مكتبة التفاسير وأسباب النزول' };
        }
        if (norm.includes('فهرس السور') || norm.includes('قائمه السور') || norm.includes('surah index')) {
          navigateTo('quran', { quranTab: 'surahs' });
          return { matched: true, summaryAr: 'تم الانتقال إلى فهرس السور' };
        }
        if (norm.includes('الاجزاء والاحزاب') || norm === 'الاجزاء') {
          navigateTo('quran', { quranTab: 'juz' });
          return { matched: true, summaryAr: 'تم الانتقال إلى فهرس الأجزاء والأحزاب' };
        }
        if (norm.includes('المصحف') || norm === 'القران' || norm === 'القران الكريم' || norm.includes('mushaf')) {
          navigateTo('quran', { quranTab: 'mushaf' });
          return { matched: true, summaryAr: 'تم الانتقال إلى المصحف الشريف' };
        }
        if (
          norm.includes('اذكار') ||
          norm.includes('الاذكار') ||
          norm.includes('ادعيه') ||
          norm.includes('الادعيه') ||
          norm.includes('مسبحه') ||
          norm.includes('المسبحه') ||
          norm.includes('تسبيح') ||
          norm.includes('adhkar') ||
          norm.includes('tasbih')
        ) {
          navigateTo('adhkar');
          return { matched: true, summaryAr: 'تم الانتقال إلى الأذكار والأدعية والمسبحة' };
        }
        if (norm.includes('مواقيت') || norm.includes('الصلاه') || norm.includes('الاذان') || norm.includes('prayer')) {
          navigateTo('tools', { toolsTab: 'prayer' });
          return { matched: true, summaryAr: 'تم الانتقال إلى مواقيت الصلاة والأذان' };
        }
        if (norm.includes('القبله') || norm.includes('قبله') || norm.includes('بوصله') || norm.includes('qibla')) {
          navigateTo('tools', { toolsTab: 'qibla' });
          return { matched: true, summaryAr: 'تم الانتقال إلى بوصلة اتجاه القبلة' };
        }
        if (norm.includes('التقويم') || norm.includes('هجري') || norm.includes('المناسبات') || norm.includes('hijri')) {
          navigateTo('tools', { toolsTab: 'hijri' });
          return { matched: true, summaryAr: 'تم الانتقال إلى التقويم الهجري والميلادي' };
        }
        if (norm === 'الحفظ' || norm.includes('خطه الحفظ') || norm.includes('اختبار الحفظ') || (hasExplicitNavVerb && norm.includes('حفظ')) || norm.includes('hifz')) {
          navigateTo('tools', { toolsTab: 'hifz' });
          return { matched: true, summaryAr: 'تم الانتقال إلى خطة حفظ القرآن والاختبارات' };
        }
        if (norm.includes('التجويد') || norm.includes('احكام التجويد') || norm.includes('ركن الاطفال') || norm.includes('tajweed')) {
          navigateTo('tools', { toolsTab: 'tajweed' });
          return { matched: true, summaryAr: 'تم الانتقال إلى أكاديمية التجويد وركن الأطفال' };
        }
        if (norm.includes('الختمه') || norm.includes('ختمه القران') || norm.includes('khatmah')) {
          navigateTo('tools', { toolsTab: 'khatmah' });
          return { matched: true, summaryAr: 'تم الانتقال إلى منظم ختمة القرآن الكريم' };
        }
        if (norm.includes('الحرمين') || norm.includes('الحرمان') || norm.includes('المساجد') || norm.includes('haramain')) {
          navigateTo('tools', { toolsTab: 'haramain' });
          return { matched: true, summaryAr: 'تم الانتقال إلى الحرمين الشريفين والمساجد التاريخية' };
        }
        if (norm.includes('المكتبه') || norm.includes('الكتب الاسلاميه') || norm.includes('library')) {
          navigateTo('library');
          return { matched: true, summaryAr: 'تم الانتقال إلى المكتبة الإسلامية الموثقة' };
        }
        if (norm.includes('المجتمع') || norm.includes('الحلقات') || norm.includes('community')) {
          navigateTo('community');
          return { matched: true, summaryAr: 'تم الانتقال إلى مجتمع القرآن والحلقات الجماعية' };
        }
        if (norm.includes('حسابي') || norm.includes('الملف الشخصي') || norm.includes('المحفوظات') || norm.includes('الملاحظات') || norm.includes('account')) {
          navigateTo('account');
          return { matched: true, summaryAr: 'تم الانتقال إلى حسابي والمحفوظات' };
        }

        return { matched: false, summaryAr: '' };
      };

      // Route based on selected voiceIntentMode
      if (voiceIntentMode === 'navigate') {
        const navAttempt = tryMatchNavigation();
        if (navAttempt.matched) {
          setLastVoiceFeedback(`أمر صوتي منفذ: "${cleaned}" — ${navAttempt.summaryAr}`);
          pushToast('success', navAttempt.summaryAr);
        } else {
          setLastVoiceFeedback(
            `لم يتطابق الأمر "${cleaned}" مع قسم معروف. جرب قول: "افتح سورة الكهف" أو "مواقيت الصلاة" أو "الأذكار".`
          );
          pushToast(
            'info',
            lang === 'ar'
              ? 'لم يتم التعرف على اسم القسم، جرب: "سورة الكهف" أو "مواقيت الصلاة"'
              : 'Unrecognized navigation command'
          );
        }
        return;
      }

      if (voiceIntentMode === 'auto' && (!hasQuestionIntent || hasExplicitNavVerb)) {
        const navAttempt = tryMatchNavigation();
        if (navAttempt.matched) {
          setLastVoiceFeedback(`تنقل صوتي: "${cleaned}" — ${navAttempt.summaryAr}`);
          pushToast('success', navAttempt.summaryAr);
          return;
        }
      }

      // Otherwise treat as a Quranic study question for SmartAssistantView
      let detectedMode = mode;
      if (norm.includes('لخص') || norm.includes('تلخيص') || norm.includes('مقاصد سوره') || norm.includes('summarize')) {
        detectedMode = 'surah_summary';
        setMode('surah_summary');
      } else if (norm.includes('خطه حفظ') || norm.includes('جدول حفظ') || norm.includes('احفظ')) {
        detectedMode = 'hifz_plan';
        setMode('hifz_plan');
      } else if (norm.includes('الايات التي تتحدث') || norm.includes('ايات عن') || norm.includes('موضوع')) {
        detectedMode = 'thematic';
        setMode('thematic');
      } else if (norm.includes('اختبرني') || norm.includes('اسئله قرانيه') || norm.includes('quiz')) {
        detectedMode = 'quiz';
        setMode('quiz');
      } else if (norm.includes('اشرح') || norm.includes('تفسير') || norm.includes('معني')) {
        detectedMode = 'explain';
        setMode('explain');
      }

      setPromptInput(cleaned);
      setLastVoiceFeedback(
        autoSendVoice
          ? `تم التقاط سؤالك الصوتي وإرساله للبيان العلمي: "${cleaned}"`
          : `تمت كتابة سؤالك الصوتي في الحقل: "${cleaned}"`
      );

      if (autoSendVoice && cleaned.length >= 3) {
        void handleAskAssistant(cleaned, detectedMode);
      }
    },
    [
      voiceIntentMode,
      canGoBack,
      goBack,
      setIsSearchModalOpen,
      setSelectedReciter,
      navigateTo,
      pushToast,
      lang,
      mode,
      autoSendVoice,
      handleAskAssistant,
    ]
  );

  const toggleVoiceListening = () => {
    if (!isSpeechRecognitionSupported) {
      pushToast(
        'warning',
        lang === 'ar'
          ? 'واجهة التعرف على الكلام غير مدعومة في هذا المتصفح (يفضل Chrome أو Edge أو Safari الحديث)'
          : 'Web Speech API is not supported in this browser'
      );
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore stop errors
      }
      setIsListening(false);
      setInterimTranscript('');
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    try {
      // Stop speech synthesis if currently speaking so microphone doesn't capture app audio
      if (isSpeechSynthesisSupported) {
        window.speechSynthesis.cancel();
        setIsSpeakingAnswer(false);
      }

      const recognition = new SpeechRecognitionCtor();
      recognitionRef.current = recognition;
      recognition.lang = voiceLang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let finalCaptured = '';

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
        setLastVoiceFeedback('');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = String(event.results[i][0]?.transcript || '');
          if (event.results[i].isFinal) {
            finalText += piece;
          } else {
            interim += piece;
          }
        }
        if (interim) {
          setInterimTranscript(interim);
        }
        if (finalText.trim()) {
          finalCaptured = finalText.trim();
          setInterimTranscript('');
          executeVoiceCommandOrQuestion(finalCaptured);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setInterimTranscript('');
        const code = String(event?.error || '');
        if (code === 'aborted') return;
        const msgAr =
          code === 'not-allowed' || code === 'service-not-allowed'
            ? 'تم رفض إذن الميكروفون؛ يرجى السماح بالوصول إلى الميكروفون من إعدادات المتصفح.'
            : code === 'no-speech'
              ? 'لم يتم التقاط صوت واضح؛ يرجى التحدث بالقرب من الميكروفون والمحاولة مجدداً.'
              : 'تعذر إتمام التعرف الصوتي حالياً؛ يرجى التحقق من الميكروفون والاتصال.';
        setLastVoiceFeedback(msgAr);
        pushToast('warning', msgAr);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.start();
    } catch {
      setIsListening(false);
      pushToast(
        'error',
        lang === 'ar'
          ? 'تعذر بدء خدمة الميكروفون في المتصفح حالياً'
          : 'Could not start speech recognition'
      );
    }
  };

  const toggleSpeakScholarlyAnswer = () => {
    if (!isSpeechSynthesisSupported || !result) return;
    if (isSpeakingAnswer) {
      window.speechSynthesis.cancel();
      setIsSpeakingAnswer(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${result.title}. ${result.answer}`);
    utterance.lang = lang === 'en' ? 'en-US' : 'ar-SA';
    utterance.rate = 0.96;
    utterance.onend = () => setIsSpeakingAnswer(false);
    utterance.onerror = () => setIsSpeakingAnswer(false);
    setIsSpeakingAnswer(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="rounded-2xl bg-[#0E4A3A] dark:bg-[#0B2920] text-[#FBF9F5] p-6 border border-amber-400/30 space-y-2 islamic-pattern-subtle">
        <div className="inline-flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
          <Sparkles className="w-4 h-4" />
          <span>منضبط بأمهات التفاسير المعتمدة · يدعم السؤال الصوتي والتنقل بالأوامر الصوتية</span>
        </div>
        <h1 className="font-display text-3xl font-bold">
          المساعد القرآني الذكي للفهم والتدبر والتفاعل الصوتي
        </h1>
        <p className="text-xs sm:text-sm text-stone-200 leading-relaxed max-w-3xl">
          اطرح سؤالك كتابةً أو بصوتك لفهم معاني الآيات وتلخيص السور ومقارنة أقوال المفسرين المعتمدين، أو انتقل مباشرةً إلى أي سورة أو قسم في التطبيق بالأوامر الصوتية.
        </p>
      </div>

      {/* Mode Selector, Voice Control Panel & Input */}
      <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-5 space-y-4">
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { id: 'explain', label: 'تفسير آية وغريب الكلمات' },
            { id: 'surah_summary', label: 'تلخيص مقاصد سورة' },
            { id: 'thematic', label: 'البحث الموضوعي في القرآن' },
            { id: 'hifz_plan', label: 'اقتراح خطة حفظ ومراجعة' },
            { id: 'quiz', label: 'أسئلة قرآنية تعليمية' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id as typeof mode)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                mode === m.id
                  ? 'bg-[#0E4A3A] text-white dark:bg-amber-400 dark:text-stone-950'
                  : 'bg-stone-100 dark:bg-[#15251E] text-stone-700 dark:text-stone-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Web Speech API Interactive Voice Bar */}
        <div className="rounded-xl bg-[#FBF9F5] dark:bg-[#0B1511] border border-stone-200/90 dark:border-emerald-900/80 p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleVoiceListening}
                aria-pressed={isListening}
                aria-label={isListening ? 'إيقاف الاستماع الصوتي' : 'بدء التفاعل الصوتي'}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  isListening
                    ? 'bg-red-700 hover:bg-red-800 text-white'
                    : 'bg-[#0E4A3A] hover:bg-[#0B3B2E] text-white dark:bg-amber-400 dark:text-stone-950'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>إيقاف الاستماع الآن</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-amber-300 dark:text-stone-950" />
                    <span>تحدث الآن (سؤال أو تنقل)</span>
                  </>
                )}
              </button>

              {/* Segmented Voice Mode Control */}
              <div className="inline-flex items-center p-1 rounded-lg bg-stone-200/70 dark:bg-[#15251E] text-[11px]">
                {[
                  { id: 'auto', label: 'تلقائي ذكي' },
                  { id: 'question', label: 'سؤال للمساعد' },
                  { id: 'navigate', label: 'تنقل بين الأقسام' },
                ].map((vm) => (
                  <button
                    key={vm.id}
                    type="button"
                    onClick={() => setVoiceIntentMode(vm.id as typeof voiceIntentMode)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      voiceIntentMode === vm.id
                        ? 'bg-white dark:bg-[#0E4A3A] text-stone-900 dark:text-white shadow-2xs'
                        : 'text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {vm.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 dark:text-stone-300">
              <div className="inline-flex items-center p-0.5 rounded-lg bg-stone-200/70 dark:bg-[#15251E] text-[11px]">
                <button
                  type="button"
                  onClick={() => setVoiceLang('ar-SA')}
                  className={`px-2 py-1 rounded-md font-semibold ${
                    voiceLang === 'ar-SA'
                      ? 'bg-white dark:bg-[#0E4A3A] text-stone-900 dark:text-white'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  العربية
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceLang('en-US')}
                  className={`px-2 py-1 rounded-md font-semibold ${
                    voiceLang === 'en-US'
                      ? 'bg-white dark:bg-[#0E4A3A] text-stone-900 dark:text-white'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  EN
                </button>
              </div>

              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-[11px]">
                <input
                  type="checkbox"
                  checked={autoSendVoice}
                  onChange={(e) => setAutoSendVoice(e.target.checked)}
                  className="rounded border-stone-300 accent-[#0E4A3A]"
                />
                <span>إرسال تلقائي للسؤال</span>
              </label>

              <button
                type="button"
                onClick={() => setShowVoiceGuide((v) => !v)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0E4A3A] dark:text-amber-300 hover:underline"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>{showVoiceGuide ? 'إخفاء أمثلة الأوامر' : 'أمثلة الأوامر الصوتية'}</span>
              </button>
            </div>
          </div>

          {!isSpeechRecognitionSupported && (
            <p className="text-xs text-amber-800 dark:text-amber-300">
              ملاحظة: متصفحك الحالي لا يوفّر واجهة التعرف على الكلام (Web Speech API). يمكنك استخدام متصفح Chrome أو Edge أو Safari للتحدث صوتياً، أو كتابة سؤالك مباشرةً أدناه.
            </p>
          )}

          {isListening && (
            <div className="p-3 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-600/30 flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-[#0E4A3A] dark:text-amber-300">
                  جاري الاستماع الآن ({voiceLang === 'ar-SA' ? 'العربية' : 'English'})... تحدث بوضوح
                </div>
                <div className="text-stone-700 dark:text-stone-200">
                  {interimTranscript || 'مثال: "ما تفسير آية الكرسي؟" أو "افتح سورة الكهف" أو "اذهب إلى مواقيت الصلاة"'}
                </div>
              </div>
            </div>
          )}

          {!isListening && lastVoiceFeedback && (
            <div className="text-xs text-stone-700 dark:text-stone-300 flex items-center justify-between gap-2 pt-1 border-t border-stone-200/70 dark:border-emerald-950">
              <span>{lastVoiceFeedback}</span>
              <button
                type="button"
                onClick={() => setLastVoiceFeedback('')}
                className="text-stone-400 hover:text-stone-600"
                aria-label="مسح الإشعار الصوتي"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {showVoiceGuide && (
            <div className="pt-2 border-t border-stone-200/80 dark:border-emerald-950 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1.5">
                <div className="font-bold text-stone-900 dark:text-stone-100">
                  أوامر التنقل الصوتي السريع (اضغط للتجربة):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'افتح سورة الكهف',
                    'سورة البقرة آية 255',
                    'افتح صفحة 604',
                    'جزء عم',
                    'مواقيت الصلاة',
                    'اتجاه القبلة',
                    'أذكار الصباح',
                    'أكاديمية التجويد',
                    'اختر القارئ عبد الرحمن بن مسعد',
                  ].map((cmd) => (
                    <button
                      key={cmd}
                      type="button"
                      onClick={() => executeVoiceCommandOrQuestion(cmd)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 text-stone-700 dark:text-stone-200 hover:border-[#0E4A3A]"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="font-bold text-stone-900 dark:text-stone-100">
                  أمثلة الأسئلة الصوتية للمساعد القرآني:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'ما تفسير قوله تعالى ألا بذكر الله تطمئن القلوب؟',
                    'لخص مقاصد سورة يوسف',
                    'ما الآيات التي تتحدث عن بر الوالدين؟',
                    'اقترح خطة حفظ لجزء تبارك',
                  ].map((qEx) => (
                    <button
                      key={qEx}
                      type="button"
                      onClick={() => executeVoiceCommandOrQuestion(qEx)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 text-stone-700 dark:text-stone-200 hover:border-[#0E4A3A]"
                    >
                      {qEx}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          <textarea
            rows={3}
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="اكتب سؤالك التدبري أو اضغط زر (تحدث الآن) لطرح سؤالك أو الانتقال صوتياً بين أقسام التطبيق..."
            className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 p-3.5 text-sm focus:outline-none focus:border-[#0E4A3A]"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {samplePrompts.map((sp, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setPromptInput(sp);
                    void handleAskAssistant(sp);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-[#15251E] text-stone-600 dark:text-stone-300 hover:border-emerald-600 border border-transparent"
                >
                  {sp.slice(0, 38)}...
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={isLoading || promptInput.trim().length < 3}
              onClick={() => void handleAskAssistant()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0E4A3A] disabled:opacity-50 text-white text-xs font-bold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>{MESSAGE_LIBRARY[lang].loading.assistant}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-amber-300" />
                  <span>عرض البيان الموثق</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Grounded Result Display */}
      {result && (
        <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-6 space-y-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 dark:border-emerald-950 pb-3">
            <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
              {result.title}
            </h2>

            {isSpeechSynthesisSupported && (
              <button
                type="button"
                onClick={toggleSpeakScholarlyAnswer}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-[#15251E] text-stone-700 dark:text-stone-200 text-xs font-semibold hover:border-[#0E4A3A] border border-transparent"
              >
                {isSpeakingAnswer ? (
                  <>
                    <Square className="w-3.5 h-3.5 text-red-600" />
                    <span>إيقاف القراءة الصوتية</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-[#0E4A3A] dark:text-amber-300" />
                    <span>قراءة الشرح صوتياً</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="text-sm sm:text-base text-stone-800 dark:text-stone-200 leading-loose whitespace-pre-line">
            {result.answer}
          </div>

          {/* Verified Hydrated Uthmani Verses */}
          {result.verifiedVerses.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[#0E4A3A] dark:text-amber-300 uppercase">
                الشواهد القرآنية الموثقة من مصحف المدينة النبوية:
              </h3>
              {result.verifiedVerses.map((v) => (
                <div
                  key={`${v.surahNumber}:${v.ayahNumber}`}
                  className="p-4 rounded-xl bg-[#FBF9F5] dark:bg-[#0B1511] border border-amber-500/30 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span className="font-bold text-[#0E4A3A] dark:text-amber-300">
                      {v.surahName} ({v.surahNumber}:{v.ayahNumber}) · صفحة {v.page}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          playVerseAudio({
                            surahNumber: v.surahNumber,
                            ayahNumber: v.ayahNumber,
                            globalAyahNumber: 0,
                            verseText: v.uthmaniText,
                          })
                        }
                        className="hover:underline"
                      >
                        استماع
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() =>
                          navigateTo('quran', {
                            quranTab: 'mushaf',
                            surah: v.surahNumber,
                            ayah: v.ayahNumber,
                          })
                        }
                        className="font-semibold text-[#0E4A3A] dark:text-amber-300 hover:underline"
                      >
                        فتح في المصحف
                      </button>
                    </div>
                  </div>
                  <p dir="rtl" className="font-quran-uthmani text-2xl text-stone-900 dark:text-stone-50 leading-loose">
                    ﴿ {v.uthmaniText} ﴾
                  </p>
                  {v.relevance && (
                    <p className="text-xs text-stone-600 dark:text-stone-400">
                      وجه الدلالة: {v.relevance}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tafsir Differences if Present */}
          {result.tafsirDifferences && (
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 space-y-1 text-xs sm:text-sm">
              <div className="font-bold text-stone-900 dark:text-stone-100">
                أقوال أئمة التفسير المعتبرة:
              </div>
              <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                {result.tafsirDifferences}
              </p>
            </div>
          )}

          {/* Cited Scholarly Sources */}
          <div className="pt-3 border-t border-stone-100 dark:border-emerald-950 text-xs space-y-2">
            <div className="font-bold text-stone-700 dark:text-stone-300">
              المراجع والمصادر المعتمدة في هذا البيان:
            </div>
            <p className="text-stone-600 dark:text-stone-400">
              {result.sources.map((s) => `${s.book} (${s.scholar})`).join(' · ')}
            </p>
            <p className="text-[11px] text-amber-800 dark:text-amber-300/90 pt-1">
              {result.scholarlyReferral}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. QURAN COMMUNITY & COLLECTIVE KHATMAH VIEW (Section 16)
// ============================================================================
interface CommunityGroupItem {
  id: string;
  title: string;
  description: string;
  category: 'hifz' | 'revision' | 'khatmah' | 'tadabbur' | 'competition';
  targetGoal: string;
  completedUnits: number;
  creatorId: string;
  creatorName: string;
}

interface CommunityPostItem {
  id: string;
  groupId: string;
  authorId: string;
  authorName: string;
  postType: 'achievement' | 'juz_claim' | 'reflection';
  surahNumber: number;
  ayahNumber: number;
  juzNumber: number;
  body: string;
}

const DEFAULT_SCHOLARLY_CIRCLES: CommunityGroupItem[] = [
  {
    id: 'circle_global_khatmah',
    title: 'حلقة الختمة الجماعية الشهرية',
    description: 'نتعاون على تلاوة أجزاء المصحف الشريف الثلاثين بنية التعبد والمدارسة وتثبيت الورد اليومي.',
    category: 'khatmah',
    targetGoal: 'إتمام 30 جزءاً شهرياً',
    completedUnits: 18,
    creatorId: 'system_scholar',
    creatorName: 'إدارة الحلقات القرآنية',
  },
  {
    id: 'circle_kahf_friday',
    title: 'حلقة مدارسة سورة الكهف وتدبر مقاصدها',
    description: 'قراءة سورة الكهف أسبوعياً وتدبر قصصها الأربع واستخراج الهدايات العملية منها من تفسير السعدي وابن كثير.',
    category: 'tadabbur',
    targetGoal: '110 آيات مع التدبر',
    completedUnits: 42,
    creatorId: 'system_scholar',
    creatorName: 'إدارة الحلقات القرآنية',
  },
  {
    id: 'circle_juz_amma_hifz',
    title: 'حلقة تثبيت ومراجعة جزء عمّ وتبارك',
    description: 'تحدي إتقان الحفظ والتسميع المتبادل لقصار ومفصل السور مع ضبط أحكام التجويد.',
    category: 'hifz',
    targetGoal: 'إتقان الجزأين 29 و 30',
    completedUnits: 27,
    creatorId: 'system_scholar',
    creatorName: 'إدارة الحلقات القرآنية',
  },
];

export const CommunityView: React.FC = () => {
  const { user, profile, loginWithGoogle, pushToast } = useQuranApp();

  const [cloudGroups, setCloudGroups] = useState<CommunityGroupItem[]>([]);
  const [cloudPosts, setCloudPosts] = useState<CommunityPostItem[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupCategory, setGroupCategory] = useState<CommunityGroupItem['category']>('khatmah');
  const [groupGoal, setGroupGoal] = useState('إتمام 30 جزءاً');

  // New Post Form
  const [selectedGroupId, setSelectedGroupId] = useState<string>('circle_global_khatmah');
  const [postType, setPostType] = useState<CommunityPostItem['postType']>('juz_claim');
  const [postJuz, setPostJuz] = useState<number>(1);
  const [postBody, setPostBody] = useState('');

  // Content Report Modal (Moderation Safety)
  const [reportTarget, setReportTarget] = useState<{
    targetType: 'post' | 'group';
    targetId: string;
  } | null>(null);
  const [reportReason, setReportReason] = useState<
    'unverified_source' | 'inaccurate_attribution' | 'abuse' | 'spam'
  >('unverified_source');
  const [reportDetails, setReportDetails] = useState('');

  useEffect(() => {
    const gq = query(collection(db, 'community_groups'), where('status', '==', 'published'));
    const unsubG = onSnapshot(
      gq,
      (snap) => {
        const items: CommunityGroupItem[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: String(data.title || ''),
            description: String(data.description || ''),
            category: (data.category as CommunityGroupItem['category']) || 'khatmah',
            targetGoal: String(data.targetGoal || ''),
            completedUnits: Number(data.completedUnits || 0),
            creatorId: String(data.creatorId || ''),
            creatorName: String(data.creatorName || ''),
          };
        });
        setCloudGroups(items);
        if (items.length > 0 && selectedGroupId === 'circle_global_khatmah') {
          setSelectedGroupId(items[0].id);
        }
      },
      () => {}
    );

    const pq = query(collection(db, 'community_posts'), where('status', '==', 'published'));
    const unsubP = onSnapshot(
      pq,
      (snap) => {
        const items: CommunityPostItem[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            groupId: String(data.groupId || ''),
            authorId: String(data.authorId || ''),
            authorName: String(data.authorName || ''),
            postType: (data.postType as CommunityPostItem['postType']) || 'reflection',
            surahNumber: Number(data.surahNumber || 0),
            ayahNumber: Number(data.ayahNumber || 0),
            juzNumber: Number(data.juzNumber || 0),
            body: String(data.body || ''),
          };
        });
        setCloudPosts(items);
      },
      () => {}
    );

    return () => {
      unsubG();
      unsubP();
    };
  }, [selectedGroupId]);

  const allGroups = cloudGroups.length > 0 ? cloudGroups : DEFAULT_SCHOLARLY_CIRCLES;

  const handleCreateGroup = async () => {
    if (!user || !user.emailVerified) {
      await loginWithGoogle();
      return;
    }
    if (groupTitle.trim().length < 3 || groupDesc.trim().length < 5) {
      pushToast('warning', 'يرجى كتابة عنوان ووصف واضحين للحلقة القرآنية');
      return;
    }
    const groupId = sanitizeDocId(`grp_${Date.now()}`);
    try {
      await setDoc(doc(db, 'community_groups', groupId), {
        title: clampStr(groupTitle, 140, 'حلقة قرآنية'),
        description: clampStr(groupDesc, 600, 'حلقة تدارس وحفظ القرآن الكريم'),
        category: groupCategory,
        targetGoal: clampStr(groupGoal, 120, 'إتمام الورد'),
        completedUnits: 0,
        creatorId: sanitizeDocId(user.uid),
        creatorName: clampStr(profile?.displayName || user.displayName || 'قارئ القرآن', 80, 'قارئ'),
        status: 'published',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setShowCreateGroup(false);
      setGroupTitle('');
      setGroupDesc('');
      setSelectedGroupId(groupId);
      pushToast('success', 'تم إنشاء الحلقة القرآنية بنجاح');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `community_groups/${groupId}`);
    }
  };

  const handlePublishPost = async () => {
    if (!user || !user.emailVerified) {
      await loginWithGoogle();
      return;
    }
    const targetGroup = cloudGroups.find((g) => g.id === selectedGroupId);
    if (!targetGroup) {
      pushToast('info', 'أنشئ حلقة سحابية أولاً لتسجيل المشاركات المباشرة فيها');
      setShowCreateGroup(true);
      return;
    }
    if (postBody.trim().length < 3) {
      pushToast('warning', 'يرجى كتابة مشاركتك أو رقم الجزء الذي أتممته');
      return;
    }

    const postId = sanitizeDocId(`post_${Date.now()}`);
    try {
      await setDoc(doc(db, 'community_posts', postId), {
        groupId: sanitizeDocId(targetGroup.id),
        authorId: sanitizeDocId(user.uid),
        authorName: clampStr(profile?.displayName || user.displayName || 'قارئ القرآن', 80, 'قارئ'),
        postType,
        surahNumber: 1,
        ayahNumber: 1,
        juzNumber: postType === 'juz_claim' ? postJuz : 0,
        body: clampStr(postBody, 1000, 'أتممت وردي بحمد الله'),
        status: 'published',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'community_groups', targetGroup.id), {
        completedUnits: targetGroup.completedUnits + 1,
        updatedAt: serverTimestamp(),
      });

      setPostBody('');
      pushToast('success', 'تمت مشاركة إنجازك القرآني في الحلقة');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `community_posts/${postId}`);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportTarget) return;
    if (!user || !user.emailVerified) {
      await loginWithGoogle();
      return;
    }
    const reportId = sanitizeDocId(`rep_${Date.now()}`);
    try {
      await setDoc(doc(db, 'content_reports', reportId), {
        targetType: reportTarget.targetType,
        targetId: sanitizeDocId(reportTarget.targetId),
        reporterId: sanitizeDocId(user.uid),
        reason: reportReason,
        details: clampStr(reportDetails || 'مراجعة دقة التوثيق', 600, 'مراجعة دقة التوثيق'),
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setReportTarget(null);
      setReportDetails('');
      pushToast('success', 'تم إرسال البلاغ لفريق الإشراف العلمي لمراجعته');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `content_reports/${reportId}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="rounded-2xl bg-[#0E4A3A] text-white p-6 border border-amber-400/30 flex flex-wrap items-center justify-between gap-4 islamic-pattern-subtle">
        <div>
          <div className="text-xs text-amber-300 font-semibold">
            التعاون على البر والتقوى · ضوابط علمية وإشراف على المحتوى
          </div>
          <h1 className="font-display text-3xl font-bold mt-1">
            مجتمع القرآن وحلقات التدارس والختمات الجماعية
          </h1>
          <p className="text-xs sm:text-sm text-stone-200 mt-1">
            انضم إلى حلقات الحفظ والمراجعة والختمات المشتركة والتحديات القرآنية التعليمية.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateGroup(!showCreateGroup)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 text-stone-950 text-xs font-bold"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء حلقة قرآنية جديدة</span>
        </button>
      </div>

      {showCreateGroup && (
        <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-5 space-y-4">
          <h3 className="font-display text-xl font-bold">تأسيس حلقة حفظ أو ختمة جماعية</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <input
              type="text"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              placeholder="عنوان الحلقة (مثال: ختمة شهر رمضان)"
              className="rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5"
            />
            <select
              value={groupCategory}
              onChange={(e) => setGroupCategory(e.target.value as CommunityGroupItem['category'])}
              className="rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5"
            >
              <option value="khatmah">ختمة جماعية</option>
              <option value="hifz">حلقة حفظ</option>
              <option value="revision">مراجعة وتثبيت</option>
              <option value="tadabbur">مدارسة وتدبر</option>
              <option value="competition">مسابقة قرآنية تعليمية</option>
            </select>
            <input
              type="text"
              value={groupGoal}
              onChange={(e) => setGroupGoal(e.target.value)}
              placeholder="الهدف (مثال: 30 جزءاً)"
              className="rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5"
            />
          </div>
          <textarea
            rows={2}
            value={groupDesc}
            onChange={(e) => setGroupDesc(e.target.value)}
            placeholder="وصف الحلقة ومنهج المدارسة..."
            className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 p-3 text-xs"
          />
          <button
            type="button"
            onClick={() => void handleCreateGroup()}
            className="px-5 py-2 rounded-xl bg-[#0E4A3A] text-white text-xs font-bold"
          >
            نشر الحلقة
          </button>
        </div>
      )}

      {/* Groups Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {allGroups.map((g) => (
          <div
            key={g.id}
            className={`rounded-2xl p-5 border transition-colors flex flex-col justify-between gap-3 ${
              selectedGroupId === g.id
                ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-[#0E4A3A] dark:border-amber-400'
                : 'bg-white dark:bg-[#101C17] border-stone-200 dark:border-emerald-950'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>بإشراف: {g.creatorName}</span>
                <button
                  type="button"
                  onClick={() => setReportTarget({ targetType: 'group', targetId: g.id })}
                  className="text-stone-400 hover:text-red-600"
                  title="الإبلاغ عن محتوى غير موثق"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              </div>
              <h3 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                {g.title}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                {g.description}
              </p>
            </div>
            <div className="pt-3 border-t border-stone-100 dark:border-emerald-950 flex items-center justify-between text-xs">
              <span className="font-semibold text-[#0E4A3A] dark:text-amber-300">
                {g.targetGoal} · أُنجز ({g.completedUnits})
              </span>
              <button
                type="button"
                onClick={() => setSelectedGroupId(g.id)}
                className="px-3 py-1.5 rounded-lg bg-[#0E4A3A] text-white font-semibold"
              >
                المشاركة
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Share Achievement / Juz Completion Feed */}
      <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-5 space-y-4">
        <h3 className="font-display text-xl font-bold">
          تسجيل إنجاز أو حجز جزء في الختمة الجماعية
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <select
            value={postType}
            onChange={(e) => setPostType(e.target.value as CommunityPostItem['postType'])}
            className="rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5"
          >
            <option value="juz_claim">إتمام جزء في الختمة</option>
            <option value="achievement">إنجاز حفظ سورة / ورد</option>
            <option value="reflection">فائدة تدبرية موثقة المصدر</option>
          </select>

          {postType === 'juz_claim' && (
            <select
              value={postJuz}
              onChange={(e) => setPostJuz(Number(e.target.value))}
              className="rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5"
            >
              {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
                <option key={j} value={j}>
                  الجزء {j}
                </option>
              ))}
            </select>
          )}

          <input
            type="text"
            value={postBody}
            onChange={(e) => setPostBody(e.target.value)}
            placeholder="اكتب رسالتك التشجيعية أو مصدر الفائدة التفسيرية..."
            className="sm:col-span-2 rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5"
          />
        </div>
        <button
          type="button"
          onClick={() => void handlePublishPost()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E4A3A] text-white text-xs font-bold"
        >
          <CheckCircle2 className="w-4 h-4 text-amber-300" />
          <span>نشر المشاركة في الحلقة</span>
        </button>

        {cloudPosts.length > 0 && (
          <div className="space-y-2.5 pt-3 border-t border-stone-100 dark:border-emerald-950">
            {cloudPosts.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200/80 dark:border-emerald-900/60 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    {p.authorName}
                  </span>
                  {p.juzNumber > 0 && (
                    <span className="text-[#0E4A3A] dark:text-amber-300 font-semibold ms-2">
                      · أتم قراءة الجزء {p.juzNumber}
                    </span>
                  )}
                  <p className="text-stone-700 dark:text-stone-300 mt-1">{p.body}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setReportTarget({ targetType: 'post', targetId: p.id })}
                  className="text-stone-400 hover:text-red-600 shrink-0"
                  title="الإبلاغ عن مخالفة"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Content Modal */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>الإبلاغ لمراجعة الدقة العلمية والسلامة</span>
              </h3>
              <button type="button" onClick={() => setReportTarget(null)}>
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value as typeof reportReason)}
              className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2 text-xs"
            >
              <option value="unverified_source">نقل غير موثق المصدر</option>
              <option value="inaccurate_attribution">خطأ في نسبة تفسير أو حديث</option>
              <option value="spam">محتوى دعائي غير ملائم</option>
              <option value="abuse">مخالفة آداب الحوار الإسلامي</option>
            </select>
            <textarea
              rows={3}
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="توضيح سبب البلاغ للمشرفين..."
              className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 p-3 text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => void handleSubmitReport()}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
              >
                إرسال البلاغ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
