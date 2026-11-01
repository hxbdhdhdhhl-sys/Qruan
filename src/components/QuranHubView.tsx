import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bookmark,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Headphones,
  Layers,
  ListMusic,
  Loader2,
  Minus,
  Monitor,
  Moon,
  Play,
  Plus,
  RefreshCw,
  Search,
  SplitSquareHorizontal,
  Sun,
  Volume2,
  X,
} from 'lucide-react';
import { useQuranApp } from '../context/QuranAppContext';
import { MESSAGE_LIBRARY, UI_LABELS } from '../data/i18n';
import {
  ALL_JUZ_INDEX,
  ALL_SURAHS,
  ASBAB_AL_NUZUL_RECORDS,
  GLOBAL_TRANSLATIONS,
  QURAN_THEMATIC_TOPICS,
  VERIFIED_RECITERS,
} from '../data/surahs';
import {
  downloadSurahForOffline,
  getOfflineRecord,
  saveOfflineRecord,
} from '../lib/offlineStorage';
import type {
  QuranAyah,
  QuranFontStyle,
  QuranSubTab,
  TafsirEntry,
  WordMeaning,
} from '../types/quran';

interface SurahApiResponse {
  surahNumber: number;
  nameAr: string;
  nameEn: string;
  revelationType: string;
  numberOfAyahs: number;
  riwayah: string;
  translationMeta: {
    identifier: string;
    name: string;
    englishName: string;
  };
  tafsirMeta: {
    name: string;
    author: string;
  };
  ayahs: QuranAyah[];
}

interface PageApiResponse {
  pageNumber: number;
  juz: number;
  hizbQuarter: number;
  surahsOnPage: string[];
  sourceAttribution: string;
  ayahs: QuranAyah[];
}

export const QuranHubView: React.FC = () => {
  const {
    lang,
    quranTab,
    activeSurah,
    activeAyah,
    activePage,
    navigateTo,
    goBack,
    canGoBack,
    mushafDisplayMode,
    setMushafDisplayMode,
    mushafThemeMode,
    setMushafThemeMode,
    resolvedMushafSurface,
    quranFont,
    setQuranFont,
    quranFontSize,
    setQuranFontSize,
    selectedTranslation,
    setSelectedTranslation,
    selectedReciter,
    setSelectedReciter,
    audioState,
    playVerseAudio,
    bookmarks,
    toggleOrSaveBookmark,
    saveReadingPosition,
    playlists,
    addVerseToPlaylist,
    listeningHistory,
    pushToast,
    reportDiagnosticsError,
  } = useQuranApp();

  const t = UI_LABELS[lang];

  const [riwayah, setRiwayah] = useState<'hafs' | 'warsh'>('hafs');
  const [showTranslation, setShowTranslation] = useState<boolean>(true);
  const [showInlineTafsir, setShowInlineTafsir] = useState<boolean>(false);
  const [showWaqfGuide, setShowWaqfGuide] = useState<boolean>(false);
  const [autoAdvancePage, setAutoAdvancePage] = useState<boolean>(false);

  // Explicit Mushaf surface tokens decoupled from global <html class="dark"> to prevent split-brain contrast issues
  const mushafTokens = useMemo(() => {
    if (resolvedMushafSurface === 'night') {
      return {
        loadingBox: 'bg-[#0B1712] border-emerald-500/20 text-[#E5C170]',
        loadingSkeletonPrimary: 'bg-emerald-950/80',
        loadingSkeletonSecondary: 'bg-[#12261E]',
        waqfGuideBox: 'bg-[#0B1712] border-emerald-500/25 text-[#D0DBD5]',
        waqfGuideTitle: 'text-[#EDE8DC]',
        pageContainer:
          'bg-[#0B1712] text-[#EDE8DC] border-2 border-emerald-500/20 shadow-lg transition-colors duration-200',
        pageHeader: 'text-[#A8B8B0] border-emerald-500/20',
        pageHeaderTitle: 'text-[#EDE8DC]',
        scriptureText: 'text-[#EDE8DC] tracking-[0.005em]',
        basmalahBanner: 'bg-[#11231B] border border-[#D4A853]/30 text-[#E5C170]',
        ayahPlayingSpan: 'bg-[#163328] text-[#FAF6EE] ring-1 ring-[#D4A853]/60',
        ayahIdleSpan: 'hover:bg-emerald-900/45',
        ayahMedal: 'text-[#D4A853]',
        sajdahMark: 'text-[#E5C170]',
        divider: 'border-emerald-500/20',
        subtleHeading: 'text-[#A8B8B0]',
        translationText: 'text-[#C8D3CD]',
        translationRef: 'text-[#D4A853]',
        footerLabel: 'text-[#A8B8B0]',
        pageNavBtn: 'bg-[#143529] hover:bg-[#1B4636] text-[#F5F1E8] border border-emerald-500/25',
        surahReaderWrapper:
          'rounded-3xl bg-[#08120E] border border-emerald-500/20 p-3 sm:p-5 space-y-4 transition-colors duration-200',
        surahHeroBanner: 'bg-[#0D261D] text-[#F5F1E8] border-[#D4A853]/30',
        ayahCardPlaying: 'bg-[#163328] border-[#D4A853]/75 text-[#FAF6EE] shadow-sm',
        ayahCardIdle: 'bg-[#0F1F18] border-emerald-500/18 text-[#EDE8DC]',
        ayahTopBar: 'border-emerald-500/15 text-[#9BB0A6]',
        ayahActionBtn:
          'bg-[#162B22] hover:bg-[#D4A853] hover:text-[#0B1712] text-[#DCE5E0]',
        ayahActionAccentBtn:
          'bg-[#162B22] hover:bg-[#D4A853] hover:text-[#0B1712] text-[#E5C170]',
        ayahBookmarkSavedBtn:
          'bg-[#D4A853]/20 text-[#F0CF85] border border-[#D4A853]/40',
        inlineTafsirBox: 'bg-[#0B1712] border-emerald-500/20 text-[#D0DBD5]',
        inlineTafsirLabel: 'text-[#D4A853]',
        noteBox: 'bg-[#1C2A1E] border-[#D4A853]/35 text-[#EFE7D6]',
        prevSurahBtn:
          'bg-[#0F1F18] border-emerald-500/25 text-[#EDE8DC] hover:bg-[#162B22]',
      };
    }

    // Eye-Comfort Warm Chamois Paper ('paper')
    return {
      loadingBox: 'bg-[#F6EFE2] border-[#B48232]/30 text-[#0E4A3A]',
      loadingSkeletonPrimary: 'bg-[#E5D9C3]',
      loadingSkeletonSecondary: 'bg-[#ECE2CE]',
      waqfGuideBox: 'bg-[#F6EFE2] border-[#B48232]/35 text-[#2E2924]',
      waqfGuideTitle: 'text-[#1C1917]',
      pageContainer:
        'bg-[#F6EFE2] text-[#1C1917] border-2 border-[#B48232]/35 shadow-md transition-colors duration-200',
      pageHeader: 'text-[#574C3F] border-[#B48232]/25',
      pageHeaderTitle: 'text-[#1C1917]',
      scriptureText: 'text-[#1C1917]',
      basmalahBanner: 'bg-[#EFE5D2] border border-[#B48232]/30 text-[#0E4A3A]',
      ayahPlayingSpan: 'bg-[#EBD9B4] text-[#14110F] ring-1 ring-[#B48232]/45',
      ayahIdleSpan: 'hover:bg-[#EBD9B4]/55',
      ayahMedal: 'text-[#0E4A3A]',
      sajdahMark: 'text-[#9A5B13]',
      divider: 'border-[#B48232]/25',
      subtleHeading: 'text-[#574C3F]',
      translationText: 'text-[#3A332C]',
      translationRef: 'text-[#0E4A3A]',
      footerLabel: 'text-[#574C3F]',
      pageNavBtn: 'bg-[#0E4A3A] hover:bg-[#0B3B2E] text-white',
      surahReaderWrapper:
        'rounded-3xl bg-[#EFE6D5]/80 border border-[#B48232]/25 p-3 sm:p-5 space-y-4 transition-colors duration-200',
      surahHeroBanner: 'bg-[#0E4A3A] text-[#FBF9F5] border-[#D4A853]/35',
      ayahCardPlaying: 'bg-[#EFE2C6] border-[#B48232] text-[#14110F] shadow-sm',
      ayahCardIdle: 'bg-[#F6EFE2] border-[#B48232]/28 text-[#1C1917] shadow-2xs',
      ayahTopBar: 'border-[#B48232]/20 text-[#5C5143]',
      ayahActionBtn:
        'bg-[#EBE0CC] hover:bg-[#0E4A3A] hover:text-white text-[#292524]',
      ayahActionAccentBtn:
        'bg-[#EBE0CC] hover:bg-[#0E4A3A] hover:text-white text-[#0E4A3A]',
      ayahBookmarkSavedBtn:
        'bg-[#E5CFA1] text-[#6E440E] border border-[#B48232]/35',
      inlineTafsirBox: 'bg-[#EFE5D2] border-[#B48232]/28 text-[#2E2924]',
      inlineTafsirLabel: 'text-[#0E4A3A]',
      noteBox: 'bg-[#EBD9B4]/70 border-[#B48232]/40 text-[#292524]',
      prevSurahBtn:
        'bg-[#F6EFE2] border-[#B48232]/35 text-[#1C1917] hover:bg-[#EFE5D2]',
    };
  }, [resolvedMushafSurface]);

  // Surah & Page Data States
  const [surahData, setSurahData] = useState<SurahApiResponse | null>(null);
  const [pageData, setPageData] = useState<PageApiResponse | null>(null);
  const [isLoadingMushaf, setIsLoadingMushaf] = useState<boolean>(false);
  const [mushafError, setMushafError] = useState<{ message: string; refCode?: string } | null>(null);

  // Offline Download Progress
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [includeAudioOffline, setIncludeAudioOffline] = useState<boolean>(true);

  // Bookmark & Reflection Note Modal
  const [noteModalVerse, setNoteModalVerse] = useState<{
    surahNumber: number;
    ayahNumber: number;
    pageNumber: number;
    surahName: string;
    verseExcerpt: string;
    note: string;
    collectionTag: string;
  } | null>(null);

  // Playlist Add Modal
  const [playlistModalVerse, setPlaylistModalVerse] = useState<{
    surahNumber: number;
    ayahNumber: number;
    globalAyahNumber: number;
    surahNameAr: string;
    verseExcerpt: string;
  } | null>(null);
  const [customPlaylistName, setCustomPlaylistName] = useState('آيات السكينة والطمأنينة');

  // Surah Index Filter State
  const [surahFilterText, setSurahFilterText] = useState('');
  const [surahPlaceFilter, setSurahPlaceFilter] = useState<'all' | 'Makki' | 'Madani'>('all');

  // Recitations Studio Custom Range State
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(7);

  // Multi-Tafsir Workstation State
  const [tafsirSurah, setTafsirSurah] = useState<number>(activeSurah || 1);
  const [tafsirAyah, setTafsirAyah] = useState<number>(activeAyah || 1);
  const [tafsirLoading, setTafsirLoading] = useState<boolean>(false);
  const [tafsirError, setTafsirError] = useState<string | null>(null);
  const [tafsirVerseText, setTafsirVerseText] = useState<string>('');
  const [tafsirList, setTafsirList] = useState<TafsirEntry[]>([]);
  const [wordMeanings, setWordMeanings] = useState<WordMeaning[]>([]);
  const [enabledTafsirIds, setEnabledTafsirIds] = useState<string[]>([
    'muyassar',
    'saadi',
    'ibn_kathir',
  ]);

  // Reciter A/B Comparison State
  const [reciterA, setReciterA] = useState<string>('ar.husary');
  const [reciterB, setReciterB] = useState<string>('ar.alafasy');
  const [compareSurah, setCompareSurah] = useState<number>(1);
  const [compareAyah, setCompareAyah] = useState<number>(1);

  // Thematic & Dedicated Quran Search Tab State
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchScope, setSearchScope] = useState<'quran' | 'tafsir' | 'translation'>('quran');
  const [searchResults, setSearchResults] = useState<
    Array<{
      verseKey: string;
      surahNumber: number;
      ayahNumber: number;
      surahNameAr: string;
      text: string;
      editionName: string;
    }>
  >([]);
  const [isSearchingTab, setIsSearchingTab] = useState<boolean>(false);

  const currentSurahMeta = ALL_SURAHS[(activeSurah || 1) - 1] || ALL_SURAHS[0];
  const currentTranslationMeta =
    GLOBAL_TRANSLATIONS.find((tr) => tr.id === selectedTranslation) || GLOBAL_TRANSLATIONS[0];

  const fontClass =
    quranFont === 'scheherazade'
      ? 'font-quran-scheherazade'
      : quranFont === 'naskh'
        ? 'font-quran-naskh'
        : 'font-quran-uthmani';

  // Sync Tafsir selectors when navigating from an Ayah
  useEffect(() => {
    setTafsirSurah(activeSurah);
    setTafsirAyah(activeAyah);
    setRangeStart(1);
    setRangeEnd(Math.min(10, currentSurahMeta.ayahCount));
  }, [activeSurah, activeAyah, currentSurahMeta.ayahCount]);

  // Load Surah Data (with Offline IndexedDB Fallback)
  const fetchSurahContent = useCallback(async () => {
    setIsLoadingMushaf(true);
    setMushafError(null);
    try {
      const res = await fetch(
        `/api/quran/surah/${activeSurah}?riwayah=${riwayah}&translation=${encodeURIComponent(
          selectedTranslation
        )}&reciter=${encodeURIComponent(selectedReciter)}`
      );
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || MESSAGE_LIBRARY[lang].errors.mushafLoadFailed);
      }
      const data = (await res.json()) as SurahApiResponse;
      setSurahData(data);
      saveReadingPosition(activeSurah, activeAyah, data.ayahs[0]?.page || currentSurahMeta.startPage, true);

      // Opportunistically cache Surah in IndexedDB for seamless offline fallback
      void saveOfflineRecord('surahs', {
        key: `surah_${activeSurah}_${selectedTranslation}`,
        surahNumber: activeSurah,
        translationId: selectedTranslation,
        payload: data,
        savedAtIso: new Date().toISOString(),
      });
    } catch (err) {
      // Try offline IndexedDB cache automatically before showing error
      const cachedExact = await getOfflineRecord<{ payload: SurahApiResponse }>(
        'surahs',
        `surah_${activeSurah}_${selectedTranslation}`
      );
      const cachedDefault =
        cachedExact ||
        (await getOfflineRecord<{ payload: SurahApiResponse }>(
          'surahs',
          `surah_${activeSurah}_default`
        ));

      if (cachedDefault?.payload) {
        setSurahData(cachedDefault.payload);
        pushToast(
          'info',
          lang === 'ar'
            ? 'تم فتح السورة من الذاكرة المحلية المحفوظة دون إنترنت'
            : 'Loaded Surah from local offline storage'
        );
      } else {
        const refCode = await reportDiagnosticsError(`surah:${activeSurah}`, err);
        setMushafError({
          message: MESSAGE_LIBRARY[lang].errors.mushafLoadFailed,
          refCode,
        });
      }
    } finally {
      setIsLoadingMushaf(false);
    }
  }, [
    activeSurah,
    activeAyah,
    riwayah,
    selectedTranslation,
    selectedReciter,
    lang,
    currentSurahMeta.startPage,
    saveReadingPosition,
    pushToast,
    reportDiagnosticsError,
  ]);

  // Load Paper-Like Mushaf Page (1..604)
  const fetchPageContent = useCallback(async () => {
    setIsLoadingMushaf(true);
    setMushafError(null);
    try {
      const res = await fetch(
        `/api/quran/page/${activePage}?translation=${encodeURIComponent(
          selectedTranslation
        )}&reciter=${encodeURIComponent(selectedReciter)}`
      );
      if (!res.ok) {
        throw new Error(MESSAGE_LIBRARY[lang].errors.mushafLoadFailed);
      }
      const data = (await res.json()) as PageApiResponse;
      setPageData(data);
      const firstAyah = data.ayahs[0];
      if (firstAyah) {
        saveReadingPosition(
          firstAyah.surahNumber || activeSurah,
          firstAyah.numberInSurah,
          activePage,
          true
        );
      }
      void saveOfflineRecord('pages', {
        key: `page_${activePage}`,
        payload: data,
      });
    } catch (err) {
      const cachedPage = await getOfflineRecord<{ payload: PageApiResponse }>(
        'pages',
        `page_${activePage}`
      );
      if (cachedPage?.payload) {
        setPageData(cachedPage.payload);
      } else {
        const refCode = await reportDiagnosticsError(`page:${activePage}`, err);
        setMushafError({
          message: MESSAGE_LIBRARY[lang].errors.mushafLoadFailed,
          refCode,
        });
      }
    } finally {
      setIsLoadingMushaf(false);
    }
  }, [
    activePage,
    activeSurah,
    selectedTranslation,
    selectedReciter,
    lang,
    saveReadingPosition,
    reportDiagnosticsError,
  ]);

  useEffect(() => {
    if (quranTab !== 'mushaf') return;
    if (mushafDisplayMode === 'surah') {
      void fetchSurahContent();
    } else {
      void fetchPageContent();
    }
  }, [quranTab, mushafDisplayMode, fetchSurahContent, fetchPageContent]);

  // Auto-advance to next Mushaf page when enabled and audio reaches last ayah on page
  useEffect(() => {
    if (!autoAdvancePage || mushafDisplayMode !== 'page' || !pageData) return;
    const lastAyahOnPage = pageData.ayahs[pageData.ayahs.length - 1];
    if (
      lastAyahOnPage &&
      audioState.isPlaying &&
      audioState.globalAyahNumber === lastAyahOnPage.number &&
      activePage < 604
    ) {
      const timer = window.setTimeout(() => {
        navigateTo('quran', { quranTab: 'mushaf', page: activePage + 1 });
      }, 9000);
      return () => window.clearTimeout(timer);
    }
  }, [autoAdvancePage, mushafDisplayMode, pageData, audioState, activePage, navigateTo]);

  // Load Multi-Tafsir & Word Meanings when on 'tafsir' tab
  const fetchMultiTafsir = useCallback(async () => {
    setTafsirLoading(true);
    setTafsirError(null);
    try {
      const res = await fetch(`/api/quran/tafsir/${tafsirSurah}/${tafsirAyah}`);
      if (!res.ok) throw new Error(MESSAGE_LIBRARY[lang].errors.tafsirFailed);
      const data = await res.json();
      setTafsirVerseText(String(data.ayahText || ''));
      setTafsirList(Array.isArray(data.tafsirs) ? data.tafsirs : []);
      setWordMeanings(Array.isArray(data.words) ? data.words : []);
      void saveOfflineRecord('tafsirs', {
        key: `tafsir_${tafsirSurah}_${tafsirAyah}`,
        payload: data,
      });
    } catch {
      const cached = await getOfflineRecord<{
        payload: { ayahText: string; tafsirs: TafsirEntry[]; words: WordMeaning[] };
      }>('tafsirs', `tafsir_${tafsirSurah}_${tafsirAyah}`);
      if (cached?.payload) {
        setTafsirVerseText(cached.payload.ayahText);
        setTafsirList(cached.payload.tafsirs);
        setWordMeanings(cached.payload.words);
      } else {
        setTafsirError(MESSAGE_LIBRARY[lang].errors.tafsirFailed);
      }
    } finally {
      setTafsirLoading(false);
    }
  }, [tafsirSurah, tafsirAyah, lang]);

  useEffect(() => {
    if (quranTab === 'tafsir') {
      void fetchMultiTafsir();
    }
  }, [quranTab, fetchMultiTafsir]);

  const handleDownloadOffline = async () => {
    if (downloadProgress !== null) return;
    try {
      setDownloadProgress(5);
      await downloadSurahForOffline(
        activeSurah,
        currentSurahMeta.nameAr,
        selectedTranslation,
        selectedReciter,
        includeAudioOffline,
        (pct) => setDownloadProgress(pct)
      );
      pushToast('success', MESSAGE_LIBRARY[lang].success.recitationDownloaded);
    } catch (err) {
      const refCode = await reportDiagnosticsError('offline:download', err);
      pushToast('error', MESSAGE_LIBRARY[lang].errors.serverUnreachable, refCode);
    } finally {
      window.setTimeout(() => setDownloadProgress(null), 1200);
    }
  };

  const runTabSearch = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? searchInput).trim();
    if (q.length < 2) return;
    setIsSearchingTab(true);
    try {
      const res = await fetch(
        `/api/quran/search?q=${encodeURIComponent(q)}&scope=${searchScope}`
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(Array.isArray(data.matches) ? data.matches : []);
      }
    } catch {
      pushToast('error', MESSAGE_LIBRARY[lang].errors.serverUnreachable);
    } finally {
      setIsSearchingTab(false);
    }
  };

  const filteredSurahs = useMemo(() => {
    const q = surahFilterText.trim().toLowerCase();
    return ALL_SURAHS.filter((s) => {
      if (surahPlaceFilter !== 'all' && s.revelationType !== surahPlaceFilter) return false;
      if (!q) return true;
      return (
        s.nameAr.includes(q) ||
        s.nameEn.toLowerCase().includes(q) ||
        s.meaningEn.toLowerCase().includes(q) ||
        String(s.number) === q
      );
    });
  }, [surahFilterText, surahPlaceFilter]);

  const quranSubTabs: Array<{ id: QuranSubTab; ar: string; en: string; icon: React.ReactNode }> = [
    { id: 'mushaf', ar: 'المصحف الشريف', en: 'Noble Mushaf', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'surahs', ar: 'فهرس السور (114)', en: 'Surahs (114)', icon: <Layers className="w-4 h-4" /> },
    { id: 'juz', ar: 'الأجزاء والأحزاب (30)', en: 'Juz & Hizb', icon: <FileText className="w-4 h-4" /> },
    { id: 'recitations', ar: 'التلاوات والقوائم', en: 'Recitations', icon: <Headphones className="w-4 h-4" /> },
    { id: 'tafsir', ar: 'التفاسير وأسباب النزول', en: 'Tafsir & Asbab', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'compare_reciters', ar: 'مقارنة القراء', en: 'Compare Reciters', icon: <SplitSquareHorizontal className="w-4 h-4" /> },
    { id: 'search', ar: 'البحث القرآني الموضوعي', en: 'Quranic Search', icon: <Search className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200 dark:border-emerald-950">
        {quranSubTabs.map((tab) => {
          const active = quranTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigateTo('quran', { quranTab: tab.id })}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                active
                  ? 'bg-[#0E4A3A] text-white dark:bg-amber-400 dark:text-stone-950 shadow-xs'
                  : 'bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 text-stone-700 dark:text-stone-300 hover:border-emerald-700'
              }`}
            >
              {tab.icon}
              <span>{lang === 'ar' ? tab.ar : tab.en}</span>
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          1. MUSHAF & SURAH READER TAB
         ===================================================================== */}
      {quranTab === 'mushaf' && (
        <div className="space-y-5">
          {/* Mushaf Control Ribbon */}
          <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200/90 dark:border-emerald-950/80 p-4 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Mode Switcher: Full Surah vs Paper Mushaf Page 1..604 */}
              <div className="inline-flex rounded-xl bg-stone-100 dark:bg-[#0B1511] p-1 border border-stone-200 dark:border-emerald-950">
                <button
                  type="button"
                  onClick={() => setMushafDisplayMode('surah')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    mushafDisplayMode === 'surah'
                      ? 'bg-[#0E4A3A] text-white dark:bg-amber-400 dark:text-stone-950'
                      : 'text-stone-600 dark:text-stone-300'
                  }`}
                >
                  {lang === 'ar' ? 'قراءة السورة بالآيات' : 'Surah View'}
                </button>
                <button
                  type="button"
                  onClick={() => setMushafDisplayMode('page')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    mushafDisplayMode === 'page'
                      ? 'bg-[#0E4A3A] text-white dark:bg-amber-400 dark:text-stone-950'
                      : 'text-stone-600 dark:text-stone-300'
                  }`}
                >
                  {lang === 'ar' ? 'صفحات المصحف الورقي (1–604)' : 'Mushaf Pages (1–604)'}
                </button>
              </div>

              {/* Quick Jump Selectors: Surah, Page, Juz */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  aria-label="اختيار السورة"
                  value={activeSurah}
                  onChange={(e) => {
                    const sNum = Number(e.target.value);
                    const meta = ALL_SURAHS[sNum - 1];
                    navigateTo('quran', {
                      quranTab: 'mushaf',
                      surah: sNum,
                      ayah: 1,
                      page: meta?.startPage || 1,
                    });
                  }}
                  className="rounded-lg bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-2.5 py-1.5 font-semibold text-stone-900 dark:text-stone-100"
                >
                  {ALL_SURAHS.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number}. سورة {s.nameAr} ({s.ayahCount} آية)
                    </option>
                  ))}
                </select>

                <div className="inline-flex items-center gap-1 bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 rounded-lg px-2 py-1">
                  <span className="text-stone-500 dark:text-stone-400">صفحة:</span>
                  <input
                    type="number"
                    min={1}
                    max={604}
                    value={activePage}
                    onChange={(e) => {
                      const p = Math.max(1, Math.min(604, Number(e.target.value) || 1));
                      setMushafDisplayMode('page');
                      navigateTo('quran', { quranTab: 'mushaf', page: p });
                    }}
                    className="w-14 bg-transparent text-center font-mono font-semibold text-stone-900 dark:text-stone-100 focus:outline-none"
                  />
                </div>

                <select
                  aria-label="الانتقال إلى الجزء"
                  value={
                    ALL_JUZ_INDEX.slice()
                      .reverse()
                      .find((j) => activePage >= j.startPage)?.juz || 1
                  }
                  onChange={(e) => {
                    const j = ALL_JUZ_INDEX.find((x) => x.juz === Number(e.target.value));
                    if (j) {
                      navigateTo('quran', {
                        quranTab: 'mushaf',
                        surah: j.startSurah,
                        ayah: j.startAyah,
                        page: j.startPage,
                      });
                    }
                  }}
                  className="rounded-lg bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-2.5 py-1.5 text-stone-800 dark:text-stone-200"
                >
                  {ALL_JUZ_INDEX.map((j) => (
                    <option key={j.juz} value={j.juz}>
                      {j.nameAr} (ص {j.startPage})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Second Row: Mushaf Display Theme, Typography, Riwayah, Translation, Inline Tafsir, Offline Download */}
            <div className="pt-3 border-t border-stone-200/80 dark:border-emerald-950 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                {/* Dedicated Mushaf Display Theme Switcher: Eye-Comfort Chamois Paper | Mushaf Night | Match App */}
                <div
                  role="group"
                  aria-label={lang === 'ar' ? 'مظهر عرض المصحف الشريف' : 'Mushaf Display Theme'}
                  className="inline-flex items-center gap-1 rounded-xl bg-stone-100 dark:bg-[#0B1511] p-1 border border-stone-200 dark:border-emerald-950"
                >
                  <button
                    type="button"
                    aria-pressed={mushafThemeMode === 'paper'}
                    onClick={() => setMushafThemeMode('paper')}
                    title={
                      lang === 'ar'
                        ? 'وضع الراحة البصرية — خلفية ورق شاموا دافئ مريحة للعين'
                        : 'Eye-Comfort Mode — Warm Chamois Paper'
                    }
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                      mushafThemeMode === 'paper'
                        ? 'bg-[#EFE5D2] text-[#1C1917] border border-[#B48232]/40 shadow-2xs'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                    }`}
                  >
                    <Sun
                      className={`w-3.5 h-3.5 shrink-0 ${
                        mushafThemeMode === 'paper'
                          ? 'text-[#8C520A]'
                          : 'text-amber-600 dark:text-amber-300'
                      }`}
                    />
                    <span>{lang === 'ar' ? 'الراحة البصرية (ورقي)' : 'Eye Comfort (Paper)'}</span>
                  </button>

                  <button
                    type="button"
                    aria-pressed={mushafThemeMode === 'night'}
                    onClick={() => setMushafThemeMode('night')}
                    title={
                      lang === 'ar'
                        ? 'الوضع الليلي المخصص للمصحف — زمردي هادئ للعين'
                        : 'Mushaf Night Mode — Calm Emerald Dark Surface'
                    }
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                      mushafThemeMode === 'night'
                        ? 'bg-[#0F241C] text-[#EDE8DC] border border-emerald-500/40 shadow-2xs'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                    }`}
                  >
                    <Moon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        mushafThemeMode === 'night'
                          ? 'text-[#D4A853]'
                          : 'text-emerald-700 dark:text-emerald-300'
                      }`}
                    />
                    <span>{lang === 'ar' ? 'الوضع الليلي للمصحف' : 'Mushaf Night'}</span>
                  </button>

                  <button
                    type="button"
                    aria-pressed={mushafThemeMode === 'auto'}
                    onClick={() => setMushafThemeMode('auto')}
                    title={
                      lang === 'ar'
                        ? 'مطابقة مظهر المصحف تلقائياً مع مظهر التطبيق العام'
                        : 'Match global application theme'
                    }
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                      mushafThemeMode === 'auto'
                        ? 'bg-[#0E4A3A] text-white dark:bg-amber-400 dark:text-stone-950 shadow-2xs'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5 shrink-0" />
                    <span>{lang === 'ar' ? 'تلقائي' : 'Match App'}</span>
                  </button>
                </div>

                {/* Font Family */}
                <select
                  aria-label="نوع الخط القرآني"
                  value={quranFont}
                  onChange={(e) => setQuranFont(e.target.value as QuranFontStyle)}
                  className="rounded-lg bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-2.5 py-1.5 text-stone-800 dark:text-stone-200"
                >
                  <option value="uthmani">خط مصحف المدينة (Amiri Quran)</option>
                  <option value="scheherazade">خط شهرزاد القرآني الواضح</option>
                  <option value="naskh">النسخ العربي الميسر</option>
                </select>

                {/* Font Size -/+ */}
                <div className="inline-flex items-center gap-1 rounded-lg bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-2 py-1">
                  <button
                    type="button"
                    onClick={() => setQuranFontSize(Math.max(20, quranFontSize - 2))}
                    className="p-1 hover:text-[#0E4A3A] dark:hover:text-amber-300"
                    aria-label="تصغير الخط"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono px-1.5 text-stone-800 dark:text-stone-200 tabular-nums">
                    {quranFontSize}px
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuranFontSize(Math.min(46, quranFontSize + 2))}
                    className="p-1 hover:text-[#0E4A3A] dark:hover:text-amber-300"
                    aria-label="تكبير الخط"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Riwayah / Script */}
                <select
                  aria-label="رواية العرض"
                  value={riwayah}
                  onChange={(e) => setRiwayah(e.target.value as 'hafs' | 'warsh')}
                  className="rounded-lg bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-2.5 py-1.5 text-stone-800 dark:text-stone-200"
                >
                  <option value="hafs">رواية حفص عن عاصم (الرسم العثماني)</option>
                  <option value="warsh">الخط المغربي / الهندي الموثق</option>
                </select>

                {/* Translation Language Selector */}
                <select
                  aria-label="لغة الترجمة"
                  value={selectedTranslation}
                  onChange={(e) => setSelectedTranslation(e.target.value)}
                  className="rounded-lg bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-2.5 py-1.5 text-stone-800 dark:text-stone-200"
                >
                  {GLOBAL_TRANSLATIONS.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.languageAr} — {tr.translatorAr}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setShowTranslation(!showTranslation)}
                  className={`px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
                    showTranslation
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500/50 text-emerald-900 dark:text-emerald-200'
                      : 'border-stone-200 dark:border-emerald-900 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {lang === 'ar' ? 'عرض الترجمة' : 'Translation'}
                </button>

                {mushafDisplayMode === 'surah' && (
                  <button
                    type="button"
                    onClick={() => setShowInlineTafsir(!showInlineTafsir)}
                    className={`px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
                      showInlineTafsir
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500/50 text-amber-900 dark:text-amber-200'
                        : 'border-stone-200 dark:border-emerald-900 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    {lang === 'ar' ? 'التفسير الميسر أسفل الآية' : 'Inline Tafsir'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowWaqfGuide(!showWaqfGuide)}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-emerald-900 text-stone-700 dark:text-stone-300 hover:border-emerald-600"
                >
                  {lang === 'ar' ? 'علامات الوقف والسجدة' : 'Waqf & Sajdah Guide'}
                </button>
              </div>

              {/* Offline Download Button */}
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAudioOffline}
                    onChange={(e) => setIncludeAudioOffline(e.target.checked)}
                    className="rounded accent-[#0E4A3A]"
                  />
                  <span>{lang === 'ar' ? 'مع الصوت' : 'With Audio'}</span>
                </label>

                <button
                  type="button"
                  onClick={() => void handleDownloadOffline()}
                  disabled={downloadProgress !== null}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E4A3A] hover:bg-[#0B3B2E] text-white font-semibold transition-colors"
                >
                  {downloadProgress !== null ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                      <span>{downloadProgress}%</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-amber-300" />
                      <span>{lang === 'ar' ? 'تنزيل دون إنترنت' : 'Save Offline'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Waqf & Sajdah Guide Collapsible */}
            {showWaqfGuide && (
              <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-colors ${mushafTokens.waqfGuideBox}`}>
                <div className={`font-bold ${mushafTokens.waqfGuideTitle}`}>
                  دليل علامات الوقف والضبط في مصحف المدينة النبوية:
                </div>
                <p>
                  <strong>مـ</strong> (وقف لازم) · <strong>لا</strong> (نهي عن الوقف القبيح) ·{' '}
                  <strong>ج</strong> (وقف جائز مستوي الطرفين) · <strong>صلے</strong> (الوصل أولى مع جواز الوقف) ·{' '}
                  <strong>قلے</strong> (الوقف أولى مع جواز الوصل) · <strong>تعانق الوقف (ۛ ۛ)</strong> (إذا وقفت على أحد الموضعين لا تقف على الآخر) ·{' '}
                  <strong>۩</strong> (موضع سجدة تلاوة مسنونة).
                </p>
              </div>
            )}

            {/* Scholarly Translation Attribution & Non-Replacement Notice */}
            {showTranslation && (
              <div className="text-[11px] text-stone-600 dark:text-stone-400 pt-1 flex flex-wrap items-center justify-between gap-2">
                <span>{t.translationNotice}</span>
                <span className="font-semibold text-[#0E4A3A] dark:text-amber-300">
                  المترجم: {currentTranslationMeta.translatorAr} · المصدر: {currentTranslationMeta.sourceAr}
                </span>
              </div>
            )}
          </div>

          {/* Loading Skeleton */}
          {isLoadingMushaf && (
            <div className={`rounded-2xl border p-8 space-y-4 transition-colors ${mushafTokens.loadingBox}`}>
              <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{MESSAGE_LIBRARY[lang].loading.mushaf}</span>
              </div>
              <div className="space-y-3 animate-pulse">
                <div className={`h-6 rounded w-1/3 mx-auto ${mushafTokens.loadingSkeletonPrimary}`} />
                <div className={`h-10 rounded w-full ${mushafTokens.loadingSkeletonSecondary}`} />
                <div className={`h-10 rounded w-11/12 mx-auto ${mushafTokens.loadingSkeletonSecondary}`} />
                <div className={`h-10 rounded w-4/5 mx-auto ${mushafTokens.loadingSkeletonSecondary}`} />
              </div>
            </div>
          )}

          {/* Structured Error State with Retry, Go Back & Offline Fallback */}
          {!isLoadingMushaf && mushafError && (
            <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-red-300 dark:border-red-900/60 p-8 text-center space-y-4">
              <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400 mx-auto" />
              <div className="space-y-1 max-w-xl mx-auto">
                <h3 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
                  {mushafError.message}
                </h3>
                {mushafError.refCode && (
                  <p className="text-xs font-mono text-stone-500">
                    رمز المرجع التشخيصي: {mushafError.refCode}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    mushafDisplayMode === 'surah'
                      ? void fetchSurahContent()
                      : void fetchPageContent()
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E4A3A] text-white text-xs font-semibold"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{t.retry}</span>
                </button>
                {canGoBack && (
                  <button
                    type="button"
                    onClick={goBack}
                    className="px-4 py-2 rounded-lg border border-stone-300 dark:border-emerald-800 text-xs font-medium text-stone-700 dark:text-stone-200"
                  >
                    {t.goBack}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigateTo('adhkar')}
                  className="px-4 py-2 rounded-lg bg-amber-600 text-white text-xs font-semibold"
                >
                  {t.continueOffline}
                </button>
              </div>
            </div>
          )}

          {/* MODE A: Paper-Like Mushaf Page View (1..604) */}
          {!isLoadingMushaf && !mushafError && mushafDisplayMode === 'page' && pageData && (
            <div className={`max-w-4xl mx-auto rounded-2xl p-6 sm:p-10 space-y-6 ${mushafTokens.pageContainer}`}>
              {/* Top Mushaf Page Margin Header */}
              <div className={`flex items-center justify-between text-xs sm:text-sm font-semibold border-b pb-3 ${mushafTokens.pageHeader}`}>
                <span>الجزء {pageData.juz} · الربع {pageData.hizbQuarter}</span>
                <span className={`font-display text-base sm:text-lg font-bold ${mushafTokens.pageHeaderTitle}`}>
                  {pageData.surahsOnPage.join(' · ')}
                </span>
                <span>صفحة {pageData.pageNumber} من 604</span>
              </div>

              {/* Continuous Paper-Like Verse Flow */}
              <div
                dir="rtl"
                className={`${fontClass} text-justify leading-[2.45] py-2 ${mushafTokens.scriptureText}`}
                style={{ fontSize: `${quranFontSize}px` }}
              >
                {pageData.ayahs.map((ayah) => {
                  const isPlayingThis =
                    audioState.isPlaying && audioState.globalAyahNumber === ayah.number;
                  return (
                    <React.Fragment key={ayah.number}>
                      {ayah.numberInSurah === 1 && ayah.surahNumber !== 1 && ayah.surahNumber !== 9 && (
                        <div className={`w-full text-center my-5 py-2.5 rounded-xl text-xl sm:text-2xl font-display font-bold ${mushafTokens.basmalahBanner}`}>
                          {ayah.surahNameAr} — بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                        </div>
                      )}
                      <span
                        onClick={() =>
                          playVerseAudio({
                            surahNumber: ayah.surahNumber || activeSurah,
                            ayahNumber: ayah.numberInSurah,
                            globalAyahNumber: ayah.number,
                            verseText: ayah.textUthmani,
                            audioUrl: ayah.audioUrl,
                          })
                        }
                        title="اضغط للاستماع إلى الآية"
                        className={`cursor-pointer rounded px-1 transition-colors ${
                          isPlayingThis ? mushafTokens.ayahPlayingSpan : mushafTokens.ayahIdleSpan
                        }`}
                      >
                        {ayah.textUthmani}{' '}
                        <span className={`inline-flex items-center justify-center text-[0.65em] font-sans font-bold mx-1 ${mushafTokens.ayahMedal}`}>
                          ﴿{ayah.numberInSurah}﴾
                        </span>
                        {ayah.sajda && (
                          <span className={`${mushafTokens.sajdahMark} mx-1`} title="موضع سجدة تلاوة">
                            ۩
                          </span>
                        )}{' '}
                      </span>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Optional Page Translations List */}
              {showTranslation && (
                <div className={`pt-4 border-t space-y-2.5 ${mushafTokens.divider}`}>
                  <h4 className={`text-xs font-bold ${mushafTokens.subtleHeading}`}>
                    ترجمة معاني آيات الصفحة ({currentTranslationMeta.languageAr}):
                  </h4>
                  {pageData.ayahs.map((a) => (
                    <p
                      key={`tr_${a.number}`}
                      dir="auto"
                      className={`text-xs sm:text-sm leading-relaxed ${mushafTokens.translationText}`}
                    >
                      <span className={`font-bold me-1.5 ${mushafTokens.translationRef}`}>
                        [{a.surahNumber}:{a.numberInSurah}]
                      </span>
                      {a.translationText}
                    </p>
                  ))}
                </div>
              )}

              {/* Bottom Mushaf Page Navigation Footer */}
              <div className={`pt-4 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${mushafTokens.divider}`}>
                <button
                  type="button"
                  disabled={activePage <= 1}
                  onClick={() =>
                    navigateTo('quran', { quranTab: 'mushaf', page: Math.max(1, activePage - 1) })
                  }
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg disabled:opacity-40 font-semibold transition-colors ${mushafTokens.pageNavBtn}`}
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>الصفحة السابقة ({Math.max(1, activePage - 1)})</span>
                </button>

                <label className={`inline-flex items-center gap-2 cursor-pointer ${mushafTokens.footerLabel}`}>
                  <input
                    type="checkbox"
                    checked={autoAdvancePage}
                    onChange={(e) => setAutoAdvancePage(e.target.checked)}
                    className="rounded accent-[#0E4A3A]"
                  />
                  <span>الانتقال التلقائي للصفحة التالية مع التلاوة</span>
                </label>

                <button
                  type="button"
                  disabled={activePage >= 604}
                  onClick={() =>
                    navigateTo('quran', { quranTab: 'mushaf', page: Math.min(604, activePage + 1) })
                  }
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg disabled:opacity-40 font-semibold transition-colors ${mushafTokens.pageNavBtn}`}
                >
                  <span>الصفحة التالية ({Math.min(604, activePage + 1)})</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* MODE B: Full Surah Reader View with Verse-by-Verse Study Tools */}
          {!isLoadingMushaf && !mushafError && mushafDisplayMode === 'surah' && surahData && (
            <div className={mushafTokens.surahReaderWrapper}>
              {/* Surah Ornate Information Banner */}
              <div className={`rounded-2xl p-6 border islamic-pattern-subtle ${mushafTokens.surahHeroBanner}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-amber-300 font-medium">
                      سورة رقم {currentSurahMeta.number} ·{' '}
                      {currentSurahMeta.revelationType === 'Makki' ? 'مكية' : 'مدنية'} · ترتيب النزول{' '}
                      {currentSurahMeta.revelationOrder} · عدد آياتها {currentSurahMeta.ayahCount} · تبدأ من صفحة{' '}
                      {currentSurahMeta.startPage}
                    </div>
                    <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">
                      سورة {currentSurahMeta.nameAr} — {currentSurahMeta.nameEn}
                    </h1>
                    <p className="text-xs sm:text-sm text-stone-200 mt-2 max-w-3xl leading-relaxed">
                      {currentSurahMeta.summaryAr}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => navigateTo('quran', { quranTab: 'surahs' })}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors"
                    >
                      <Layers className="w-4 h-4 text-amber-300" />
                      <span>{lang === 'ar' ? 'فهرس السور (114)' : 'Surah Index'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        navigateTo('quran', {
                          quranTab: 'tafsir',
                          surah: surahData.surahNumber,
                          ayah: activeAyah || 1,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-amber-300" />
                      <span>{lang === 'ar' ? 'تفسير السورة' : 'Surah Tafsir'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const first = surahData.ayahs[0];
                        if (first) {
                          playVerseAudio({
                            surahNumber: surahData.surahNumber,
                            ayahNumber: 1,
                            globalAyahNumber: first.number,
                            verseText: first.textUthmani,
                            audioUrl: first.audioUrl,
                            rangeEndAyah: surahData.numberOfAyahs,
                          });
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold"
                    >
                      <Play className="w-4 h-4" />
                      <span>تشغيل السورة كاملة</span>
                    </button>
                  </div>
                </div>

                {surahData.surahNumber !== 1 && surahData.surahNumber !== 9 && (
                  <div className="mt-5 pt-4 border-t border-white/15 text-center font-quran-uthmani text-2xl sm:text-3xl text-amber-200">
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                  </div>
                )}
              </div>

              {/* Ayah Cards List */}
              <div className="space-y-3">
                {surahData.ayahs.map((ayah) => {
                  const isPlayingThis =
                    audioState.isPlaying && audioState.globalAyahNumber === ayah.number;
                  const savedBm = bookmarks.find(
                    (b) =>
                      b.surahNumber === surahData.surahNumber &&
                      b.ayahNumber === ayah.numberInSurah
                  );

                  return (
                    <article
                      key={ayah.number}
                      id={`ayah-${ayah.numberInSurah}`}
                      className={`rounded-2xl p-5 sm:p-6 border transition-colors duration-200 ${
                        isPlayingThis ? mushafTokens.ayahCardPlaying : mushafTokens.ayahCardIdle
                      }`}
                    >
                      {/* Ayah Top Action Bar */}
                      <div className={`flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b text-xs ${mushafTokens.ayahTopBar}`}>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${mushafTokens.ayahMedal}`}>
                            {surahData.surahNumber}:{ayah.numberInSurah}
                          </span>
                          <span>·</span>
                          <span>صفحة {ayah.page}</span>
                          <span>·</span>
                          <span>الجزء {ayah.juz}</span>
                          {ayah.sajda && (
                            <>
                              <span>·</span>
                              <span className={`font-bold ${mushafTokens.sajdahMark}`}>
                                ۩ موضع سجدة تلاوة
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              playVerseAudio({
                                surahNumber: surahData.surahNumber,
                                ayahNumber: ayah.numberInSurah,
                                globalAyahNumber: ayah.number,
                                verseText: ayah.textUthmani,
                                audioUrl: ayah.audioUrl,
                              })
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${mushafTokens.ayahActionBtn}`}
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>{lang === 'ar' ? 'استماع' : 'Play'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setNoteModalVerse({
                                surahNumber: surahData.surahNumber,
                                ayahNumber: ayah.numberInSurah,
                                pageNumber: ayah.page,
                                surahName: currentSurahMeta.nameAr,
                                verseExcerpt: ayah.textUthmani,
                                note: savedBm?.note || '',
                                collectionTag: savedBm?.collectionTag || 'المفضلة',
                              })
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
                              savedBm ? mushafTokens.ayahBookmarkSavedBtn : mushafTokens.ayahActionBtn
                            }`}
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                            <span>{savedBm ? 'محفوظة / ملاحظة' : 'حفظ وملاحظة'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setPlaylistModalVerse({
                                surahNumber: surahData.surahNumber,
                                ayahNumber: ayah.numberInSurah,
                                globalAyahNumber: ayah.number,
                                surahNameAr: currentSurahMeta.nameAr,
                                verseExcerpt: ayah.textUthmani,
                              })
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${mushafTokens.ayahActionBtn}`}
                          >
                            <ListMusic className="w-3.5 h-3.5" />
                            <span>قائمة تشغيل</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setTafsirSurah(surahData.surahNumber);
                              setTafsirAyah(ayah.numberInSurah);
                              navigateTo('quran', {
                                quranTab: 'tafsir',
                                surah: surahData.surahNumber,
                                ayah: ayah.numberInSurah,
                              });
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-colors ${mushafTokens.ayahActionAccentBtn}`}
                          >
                            <span>التفاسير (7)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              saveReadingPosition(
                                surahData.surahNumber,
                                ayah.numberInSurah,
                                ayah.page,
                                false
                              )
                            }
                            className={`px-2.5 py-1 rounded-lg transition-colors ${mushafTokens.ayahActionBtn}`}
                            title="تعيين كآخر موضع قراءة"
                          >
                            علامة القراءة
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              const txt = `﴿ ${ayah.textUthmani} ﴾ [سورة ${currentSurahMeta.nameAr}: ${ayah.numberInSurah}]`;
                              await navigator.clipboard.writeText(txt).catch(() => {});
                              pushToast('success', MESSAGE_LIBRARY[lang].success.copied);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${mushafTokens.ayahActionBtn}`}
                            title="نسخ الآية مع التوثيق"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Sacred Arabic Text */}
                      <p
                        dir="rtl"
                        className={`${fontClass} text-right leading-[2.35] ${mushafTokens.scriptureText}`}
                        style={{ fontSize: `${quranFontSize}px` }}
                      >
                        {ayah.textDisplay || ayah.textUthmani}{' '}
                        <span className={`inline-block text-[0.65em] font-sans font-bold ms-1 ${mushafTokens.ayahMedal}`}>
                          ﴿{ayah.numberInSurah}﴾
                        </span>
                      </p>

                      {/* Side-by-side / Stacked Global Translation */}
                      {showTranslation && ayah.translationText && (
                        <div className={`mt-4 pt-3 border-t ${mushafTokens.divider}`}>
                          <p
                            dir="auto"
                            className={`text-sm sm:text-base leading-relaxed ${mushafTokens.translationText}`}
                          >
                            {ayah.translationText}
                          </p>
                        </div>
                      )}

                      {/* Inline Concise Tafsir Al-Muyassar */}
                      {showInlineTafsir && ayah.muyassarTafsir && (
                        <div className={`mt-3 p-3.5 rounded-xl border text-xs sm:text-sm leading-relaxed ${mushafTokens.inlineTafsirBox}`}>
                          <span className={`font-bold block mb-1 ${mushafTokens.inlineTafsirLabel}`}>
                            التفسير الميسر (مجمع الملك فهد):
                          </span>
                          {ayah.muyassarTafsir}
                        </div>
                      )}

                      {/* Personal Reflection Note if Saved */}
                      {savedBm?.note && (
                        <div className={`mt-3 p-3 rounded-xl border text-xs ${mushafTokens.noteBox}`}>
                          <span className="font-bold">ملاحظتي التدبرية ({savedBm.collectionTag}): </span>
                          {savedBm.note}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>

              {/* Next / Previous Surah Footer */}
              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  disabled={activeSurah <= 1}
                  onClick={() =>
                    navigateTo('quran', {
                      quranTab: 'mushaf',
                      surah: Math.max(1, activeSurah - 1),
                      ayah: 1,
                    })
                  }
                  className={`px-4 py-2.5 rounded-xl border disabled:opacity-40 text-xs font-semibold transition-colors ${mushafTokens.prevSurahBtn}`}
                >
                  السورة السابقة
                </button>
                <button
                  type="button"
                  disabled={activeSurah >= 114}
                  onClick={() =>
                    navigateTo('quran', {
                      quranTab: 'mushaf',
                      surah: Math.min(114, activeSurah + 1),
                      ayah: 1,
                    })
                  }
                  className={`px-4 py-2.5 rounded-xl disabled:opacity-40 text-xs font-semibold transition-colors ${mushafTokens.pageNavBtn}`}
                >
                  السورة التالية
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          2. COMPLETE 114 SURAHS INDEX TAB
         ===================================================================== */}
      {quranTab === 'surahs' && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-stone-400 absolute top-3 start-3" />
              <input
                type="text"
                value={surahFilterText}
                onChange={(e) => setSurahFilterText(e.target.value)}
                placeholder="ابحث باسم السورة أو رقمها (1 - 114)..."
                className="w-full ps-9 pe-3 py-2 rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 text-sm text-stone-900 dark:text-stone-100 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              {[
                { id: 'all', label: 'الكل (114)' },
                { id: 'Makki', label: 'السور المكية' },
                { id: 'Madani', label: 'السور المدنية' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSurahPlaceFilter(f.id as typeof surahPlaceFilter)}
                  className={`px-3 py-2 rounded-lg font-semibold ${
                    surahPlaceFilter === f.id
                      ? 'bg-[#0E4A3A] text-white dark:bg-amber-400 dark:text-stone-950'
                      : 'bg-stone-100 dark:bg-[#15251E] text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredSurahs.map((s) => (
              <div
                key={s.number}
                className="rounded-xl bg-white dark:bg-[#101C17] border border-stone-200/90 dark:border-emerald-950/80 p-4 flex flex-col justify-between gap-3 hover:border-[#0E4A3A] dark:hover:border-amber-400/70 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
                      {s.number}. سورة {s.nameAr}
                    </span>
                    <span className="text-xs text-stone-500 dark:text-stone-400">
                      {s.nameEn}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    {s.revelationType === 'Makki' ? 'مكية' : 'مدنية'} · {s.ayahCount} آية · الجزء {s.startJuz} · صفحة {s.startPage}
                  </p>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 line-clamp-2 leading-relaxed">
                    {s.summaryAr}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-stone-100 dark:border-emerald-950">
                  <button
                    type="button"
                    onClick={() =>
                      navigateTo('quran', {
                        quranTab: 'mushaf',
                        mushafMode: 'surah',
                        surah: s.number,
                        ayah: 1,
                        page: s.startPage,
                      })
                    }
                    className="flex-1 py-1.5 rounded-lg bg-[#0E4A3A] text-white text-xs font-semibold"
                  >
                    قراءة السورة
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTafsirSurah(s.number);
                      setTafsirAyah(1);
                      navigateTo('quran', { quranTab: 'tafsir', surah: s.number, ayah: 1 });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-[#15251E] text-xs font-medium text-stone-700 dark:text-stone-200"
                  >
                    التفسير
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          3. 30 JUZ & 60 HIZB INDEX TAB
         ===================================================================== */}
      {quranTab === 'juz' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_JUZ_INDEX.map((j) => (
            <div
              key={j.juz}
              className="rounded-xl bg-white dark:bg-[#101C17] border border-stone-200/90 dark:border-emerald-950/80 p-4 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="text-xs text-[#0E4A3A] dark:text-amber-300 font-bold">
                  الحزب {j.hizbStart} و {j.hizbEnd} (8 أرباع)
                </div>
                <h3 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                  {j.nameAr}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                  يبدأ من سورة {j.startSurahAr} (الآية {j.startAyah}) · صفحة المصحف {j.startPage}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMushafDisplayMode('page');
                    navigateTo('quran', { quranTab: 'mushaf', page: j.startPage });
                  }}
                  className="flex-1 py-2 rounded-lg bg-[#0E4A3A] text-white text-xs font-semibold"
                >
                  فتح صفحة المصحف ({j.startPage})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMushafDisplayMode('surah');
                    navigateTo('quran', {
                      quranTab: 'mushaf',
                      surah: j.startSurah,
                      ayah: j.startAyah,
                    });
                  }}
                  className="px-3 py-2 rounded-lg bg-stone-100 dark:bg-[#15251E] text-xs text-stone-800 dark:text-stone-200 font-medium"
                >
                  السورة
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =====================================================================
          4. AUDIO RECITATIONS, CUSTOM RANGE & PLAYLISTS TAB (Section 2)
         ===================================================================== */}
      {quranTab === 'recitations' && (
        <div className="space-y-6">
          {/* Custom Surah & Ayah Range Player for Memorization & Listening */}
          <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-5 space-y-4">
            <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
              مشغل التلاوات المتقدم وتكرار نطاق الآيات
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  القارئ المفضل
                </label>
                <select
                  value={selectedReciter}
                  onChange={(e) => setSelectedReciter(e.target.value)}
                  className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5 text-stone-900 dark:text-stone-100"
                >
                  {VERIFIED_RECITERS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nameAr} — {r.styleAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  السورة الكريمة
                </label>
                <select
                  value={activeSurah}
                  onChange={(e) =>
                    navigateTo('quran', { quranTab: 'recitations', surah: Number(e.target.value) })
                  }
                  className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5 text-stone-900 dark:text-stone-100"
                >
                  {ALL_SURAHS.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number}. سورة {s.nameAr} ({s.ayahCount} آية)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  من الآية — إلى الآية
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={currentSurahMeta.ayahCount}
                    value={rangeStart}
                    onChange={(e) => setRangeStart(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5 text-center font-mono"
                  />
                  <span>—</span>
                  <input
                    type="number"
                    min={rangeStart}
                    max={currentSurahMeta.ayahCount}
                    value={rangeEnd}
                    onChange={(e) =>
                      setRangeEnd(
                        Math.min(currentSurahMeta.ayahCount, Math.max(rangeStart, Number(e.target.value) || rangeStart))
                      )
                    }
                    className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5 text-center font-mono"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() =>
                    playVerseAudio({
                      surahNumber: activeSurah,
                      ayahNumber: rangeStart,
                      globalAyahNumber: 0,
                      rangeEndAyah: rangeEnd,
                      verseText: `تلاوة سورة ${currentSurahMeta.nameAr} من الآية ${rangeStart} إلى ${rangeEnd}`,
                    })
                  }
                  className="w-full py-2.5 rounded-xl bg-[#0E4A3A] hover:bg-[#0B3B2E] text-white font-bold inline-flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 text-amber-300" />
                  <span>بدء تشغيل النطاق</span>
                </button>
              </div>
            </div>
          </div>

          {/* All 10 Famous Reciters Directory */}
          <div>
            <h3 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100 mb-3">
              مكتبة القراء المعتمدين
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {VERIFIED_RECITERS.map((reciter) => {
                const isCurrent = selectedReciter === reciter.id;
                return (
                  <div
                    key={reciter.id}
                    className={`rounded-xl p-4 border transition-colors ${
                      isCurrent
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/50 border-[#0E4A3A] dark:border-amber-400'
                        : 'bg-white dark:bg-[#101C17] border-stone-200 dark:border-emerald-950'
                    }`}
                  >
                    <div className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                      {reciter.nameAr}
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      {reciter.riwayahAr} · {reciter.styleAr} · {reciter.countryAr}
                    </p>
                    <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-stone-100 dark:border-emerald-950">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedReciter(reciter.id);
                          const sampleSurah =
                            reciter.sampleGlobalAyah === 1735
                              ? 13
                              : reciter.sampleGlobalAyah === 262
                                ? 2
                                : 1;
                          const sampleAyah =
                            reciter.sampleGlobalAyah === 1735
                              ? 28
                              : reciter.sampleGlobalAyah === 262
                                ? 255
                                : 1;
                          const sampleText =
                            reciter.sampleGlobalAyah === 1735
                              ? 'ٱلَّذِينَ ءَامَنُوا۟ وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ ٱللَّهِ ۗ أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ'
                              : reciter.sampleGlobalAyah === 262
                                ? 'ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ'
                                : 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
                          playVerseAudio({
                            surahNumber: sampleSurah,
                            ayahNumber: sampleAyah,
                            globalAyahNumber: reciter.sampleGlobalAyah,
                            reciterId: reciter.id,
                            verseText: sampleText,
                          });
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#0E4A3A] text-white text-xs font-semibold"
                      >
                        <Play className="w-3.5 h-3.5 text-amber-300" />
                        <span>استماع نموذجي</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedReciter(reciter.id)}
                        className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-[#15251E] text-xs font-medium text-stone-800 dark:text-stone-200"
                      >
                        {isCurrent ? 'القارئ المختار' : 'اعتماد'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom User Playlists & Listening History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-5 space-y-3">
              <h3 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                قوائم التشغيل القرآنية الخاصة بك
              </h3>
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900/60 space-y-2"
                >
                  <div className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    {pl.name} ({pl.items.length} آيات)
                  </div>
                  <div className="space-y-1.5">
                    {pl.items.map((v, idx) => (
                      <div
                        key={`${v.surahNumber}_${v.ayahNumber}_${idx}`}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="truncate text-stone-700 dark:text-stone-300">
                          سورة {v.surahNameAr} ({v.ayahNumber}): {v.verseExcerpt}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            playVerseAudio({
                              surahNumber: v.surahNumber,
                              ayahNumber: v.ayahNumber,
                              globalAyahNumber: v.globalAyahNumber,
                              verseText: v.verseExcerpt,
                            })
                          }
                          className="text-[#0E4A3A] dark:text-amber-300 font-semibold shrink-0 hover:underline"
                        >
                          تشغيل
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-5 space-y-3">
              <h3 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                سجل الاستماع الأخير
              </h3>
              {listeningHistory.length === 0 ? (
                <p className="text-xs text-stone-500 py-4">لا يوجد سجل استماع بعد.</p>
              ) : (
                <div className="space-y-2">
                  {listeningHistory.slice(0, 8).map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 dark:bg-[#15251E] text-xs"
                    >
                      <span>
                        سورة {h.surahNameAr} · الآية {h.ayahNumber} — {h.reciterNameAr}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          playVerseAudio({
                            surahNumber: h.surahNumber,
                            ayahNumber: h.ayahNumber,
                            globalAyahNumber: 0,
                            reciterId: h.reciterId,
                            verseText: `سورة ${h.surahNameAr} · الآية ${h.ayahNumber}`,
                          })
                        }
                        className="text-[#0E4A3A] dark:text-amber-300 font-semibold"
                      >
                        إعادة تشغيل
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          5. MULTI-TAFSIR LIBRARY, WORD MEANINGS & ASBAB AL-NUZUL (Section 3)
         ===================================================================== */}
      {quranTab === 'tafsir' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
                  موسوعة التفاسير المقارنة ومعاني الكلمات وأسباب النزول
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  اعرض أكثر من تفسير معتمد للآية نفسها مع توثيق اسم الإمام والمصدر العلمي
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  aria-label="سورة التفسير"
                  value={tafsirSurah}
                  onChange={(e) => {
                    const nextSurah = Number(e.target.value);
                    setTafsirSurah(nextSurah);
                    setTafsirAyah(1);
                    navigateTo('quran', { quranTab: 'tafsir', surah: nextSurah, ayah: 1 });
                  }}
                  className="rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2 font-semibold"
                >
                  {ALL_SURAHS.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number}. سورة {s.nameAr}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="آية التفسير"
                  value={tafsirAyah}
                  onChange={(e) => {
                    const nextAyah = Number(e.target.value);
                    setTafsirAyah(nextAyah);
                    navigateTo('quran', { quranTab: 'tafsir', surah: tafsirSurah, ayah: nextAyah });
                  }}
                  className="rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2 font-mono"
                >
                  {Array.from(
                    { length: ALL_SURAHS[(tafsirSurah || 1) - 1]?.ayahCount || 7 },
                    (_, idx) => idx + 1
                  ).map((num) => (
                    <option key={num} value={num}>
                      الآية {num}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tafsir Editions Multi-Toggle */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 dark:border-emerald-950 text-xs">
              <span className="text-stone-500 font-semibold">التفاسير المعروضة:</span>
              {tafsirList.map((tf) => {
                const checked = enabledTafsirIds.includes(tf.id);
                return (
                  <button
                    key={tf.id}
                    type="button"
                    onClick={() =>
                      setEnabledTafsirIds((prev) =>
                        checked
                          ? prev.length > 1
                            ? prev.filter((x) => x !== tf.id)
                            : prev
                          : [...prev, tf.id]
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      checked
                        ? 'bg-[#0E4A3A] text-white dark:bg-amber-400 dark:text-stone-950'
                        : 'bg-stone-100 dark:bg-[#15251E] text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {tf.title}
                  </button>
                );
              })}
            </div>
          </div>

          {tafsirLoading ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 text-center text-sm text-[#0E4A3A] dark:text-amber-300 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{MESSAGE_LIBRARY[lang].loading.tafsir}</span>
            </div>
          ) : tafsirError ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#101C17] border border-red-300 text-center space-y-3">
              <p className="text-sm text-red-700 dark:text-red-300">{tafsirError}</p>
              <button
                type="button"
                onClick={() => void fetchMultiTafsir()}
                className="px-4 py-2 rounded-lg bg-[#0E4A3A] text-white text-xs font-semibold"
              >
                {t.retry}
              </button>
            </div>
          ) : (
            <>
              {/* Canonical Ayah Header */}
              {tafsirVerseText && (
                <div className="p-6 rounded-2xl bg-[#FBF9F5] dark:bg-[#0B1511] border border-amber-500/30 text-center">
                  <p className={`${fontClass} text-2xl sm:text-3xl text-stone-900 dark:text-stone-50 leading-[2.35]`}>
                    ﴿ {tafsirVerseText} ﴾
                  </p>
                </div>
              )}

              {/* Word-by-Word Meanings */}
              {wordMeanings.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-5 space-y-3">
                  <h3 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                    بيان مفردات الآية كلمةً كلمة
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                    {wordMeanings.map((w) => (
                      <div
                        key={w.id}
                        className="p-2.5 rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200/80 dark:border-emerald-900/60 text-center"
                      >
                        <div className="font-quran-uthmani text-xl text-stone-900 dark:text-stone-100">
                          {w.arabic}
                        </div>
                        <div className="text-[11px] text-stone-600 dark:text-stone-300 mt-1">
                          {w.meaningEn}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Side-by-Side Multi-Tafsir Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {tafsirList
                  .filter((tf) => enabledTafsirIds.includes(tf.id))
                  .map((tf) => (
                    <div
                      key={tf.id}
                      className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200/90 dark:border-emerald-950/80 p-5 space-y-3"
                    >
                      <div className="border-b border-stone-100 dark:border-emerald-950 pb-2.5">
                        <h3 className="font-display text-xl font-bold text-[#0E4A3A] dark:text-amber-300">
                          {tf.title}
                        </h3>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          المؤلف: {tf.author} · المصدر: {tf.source}
                        </p>
                      </div>
                      <p className="text-sm sm:text-base text-stone-800 dark:text-stone-200 leading-loose">
                        {tf.text}
                      </p>
                    </div>
                  ))}
              </div>

              {/* Authenticated Reasons for Revelation (أسباب النزول المحققة) */}
              <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-5 space-y-4">
                <h3 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
                  شواهد محققة من أسباب النزول المعتمدة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {ASBAB_AL_NUZUL_RECORDS.map((rec, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200/80 dark:border-emerald-900/60 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-[#0E4A3A] dark:text-amber-300">
                        <span>
                          سورة {rec.surahNameAr} · الآيات ({rec.ayahRange})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const nextAyah = Number(rec.ayahRange.split('-')[0].trim()) || 1;
                            setTafsirSurah(rec.surahNumber);
                            setTafsirAyah(nextAyah);
                            navigateTo('quran', {
                              quranTab: 'tafsir',
                              surah: rec.surahNumber,
                              ayah: nextAyah,
                            });
                          }}
                          className="underline"
                        >
                          عرض تفسيرها
                        </button>
                      </div>
                      <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-200 leading-relaxed">
                        {rec.sababAr}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        التخريج والمصدر: {rec.sourceAr}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* =====================================================================
          6. SIDE-BY-SIDE RECITER COMPARISON TAB (Section 23)
         ===================================================================== */}
      {quranTab === 'compare_reciters' && (
        <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-6 space-y-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
              مقارنة الأداء الصوتي والتجويدي بين القراء
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              استمع إلى الآية نفسها بصوت قارئين مختلفين لملاحظة مراتب الترتيل والتحقيق والمدود
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <select
              value={compareSurah}
              onChange={(e) => {
                setCompareSurah(Number(e.target.value));
                setCompareAyah(1);
              }}
              className="rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2 font-semibold"
            >
              {ALL_SURAHS.map((s) => (
                <option key={s.number} value={s.number}>
                  {s.number}. سورة {s.nameAr}
                </option>
              ))}
            </select>

            <select
              value={compareAyah}
              onChange={(e) => setCompareAyah(Number(e.target.value))}
              className="rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2 font-mono"
            >
              {Array.from(
                { length: ALL_SURAHS[(compareSurah || 1) - 1]?.ayahCount || 7 },
                (_, i) => i + 1
              ).map((a) => (
                <option key={a} value={a}>
                  الآية {a}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { label: 'القارئ الأول (أ)', value: reciterA, onChange: setReciterA },
              { label: 'القارئ الثاني (ب)', value: reciterB, onChange: setReciterB },
            ].map((slot) => {
              const profile =
                VERIFIED_RECITERS.find((r) => r.id === slot.value) || VERIFIED_RECITERS[0];
              return (
                <div
                  key={slot.label}
                  className="p-5 rounded-2xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 space-y-4"
                >
                  <div className="text-xs font-bold text-[#0E4A3A] dark:text-amber-300">
                    {slot.label}
                  </div>
                  <select
                    value={slot.value}
                    onChange={(e) => slot.onChange(e.target.value)}
                    className="w-full rounded-xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-900 px-3 py-2.5 text-sm font-semibold"
                  >
                    {VERIFIED_RECITERS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nameAr} — {r.styleAr}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-stone-600 dark:text-stone-300">
                    الرواية: {profile.riwayahAr} · الأسلوب: {profile.styleAr} · البلد: {profile.countryAr}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        playVerseAudio({
                          surahNumber: compareSurah,
                          ayahNumber: compareAyah,
                          globalAyahNumber: 0,
                          reciterId: profile.id,
                          verseText: `مقارنة تلاوة سورة ${ALL_SURAHS[compareSurah - 1]?.nameAr} · الآية ${compareAyah}`,
                        })
                      }
                      className="flex-1 py-2.5 rounded-xl bg-[#0E4A3A] text-white text-xs font-bold inline-flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 text-amber-300" />
                      <span>تشغيل بصوت {profile.nameAr}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReciter(profile.id);
                        pushToast('success', `تم اعتماد ${profile.nameAr} قارئاً افتراضياً`);
                      }}
                      className="px-3 py-2.5 rounded-xl border border-stone-300 dark:border-emerald-800 text-xs font-medium"
                    >
                      اعتماد
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          7. DEDICATED THEMATIC & FULL-TEXT QURANIC SEARCH TAB (Section 7)
         ===================================================================== */}
      {quranTab === 'search' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 p-5 space-y-4">
            <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
              البحث القرآني الذكي والفهرس الموضوعي
            </h2>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void runTabSearch();
                }}
                placeholder="اكتب كلمة، جملة قرآنية، أو موضوعاً (مثل: الطمأنينة، الصبر، الرحمة)..."
                className="flex-1 rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-4 py-2.5 text-sm"
              />
              <select
                value={searchScope}
                onChange={(e) => setSearchScope(e.target.value as typeof searchScope)}
                className="rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2.5 text-xs font-semibold"
              >
                <option value="quran">في آيات القرآن الكريم</option>
                <option value="tafsir">في التفسير الميسر</option>
                <option value="translation">في الترجمة الإنجليزية</option>
              </select>
              <button
                type="button"
                onClick={() => void runTabSearch()}
                className="px-5 py-2.5 rounded-xl bg-[#0E4A3A] text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
              >
                {isSearchingTab ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 text-amber-300" />
                )}
                <span>بحث</span>
              </button>
            </div>

            {/* Thematic Topics Directory */}
            <div className="pt-2">
              <div className="text-xs font-bold text-stone-500 mb-2">
                تصفح الآيات حسب الموضوعات القرآنية الكبرى:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {QURAN_THEMATIC_TOPICS.map((topic) => (
                  <div
                    key={topic.id}
                    className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900/70 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {topic.titleAr}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchInput(topic.queryKeyword);
                          void runTabSearch(topic.queryKeyword);
                        }}
                        className="text-xs text-[#0E4A3A] dark:text-amber-300 font-semibold hover:underline"
                      >
                        كل الشواهد
                      </button>
                    </div>
                    <div className="space-y-1">
                      {topic.references.map((r) => (
                        <button
                          key={`${r.surah}:${r.ayah}`}
                          type="button"
                          onClick={() =>
                            navigateTo('quran', {
                              quranTab: 'mushaf',
                              surah: r.surah,
                              ayah: r.ayah,
                            })
                          }
                          className="block text-xs text-stone-600 dark:text-stone-300 hover:text-[#0E4A3A] dark:hover:text-amber-300 text-start"
                        >
                          • {r.labelAr} (سورة {r.surahAr}: {r.ayah})
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-stone-500">
                عدد النتائج المطابقة: {searchResults.length}
              </div>
              {searchResults.map((res) => (
                <div
                  key={res.verseKey}
                  className="p-4 rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-950 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-[#0E4A3A] dark:text-amber-300 font-semibold">
                    <span>
                      {res.surahNameAr} · الآية {res.ayahNumber} ({res.verseKey}) · {res.editionName}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        navigateTo('quran', {
                          quranTab: 'mushaf',
                          surah: res.surahNumber,
                          ayah: res.ayahNumber,
                        })
                      }
                      className="underline"
                    >
                      فتح في المصحف
                    </button>
                  </div>
                  <p className="font-quran-uthmani text-xl text-stone-900 dark:text-stone-100 leading-loose">
                    {res.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bookmark & Reflection Note Modal */}
      {noteModalVerse && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
                حفظ الآية وتدوين ملاحظة تدبرية
              </h3>
              <button
                type="button"
                onClick={() => setNoteModalVerse(null)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="font-quran-uthmani text-lg text-stone-800 dark:text-stone-200 bg-stone-50 dark:bg-[#15251E] p-3 rounded-xl">
              ﴿ {noteModalVerse.verseExcerpt} ﴾ — سورة {noteModalVerse.surahName} ({noteModalVerse.ayahNumber})
            </p>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                تصنيف الحفظ:
              </label>
              <div className="flex flex-wrap gap-2">
                {['المفضلة', 'تدبر وتأمل', 'مراجعة الحفظ', 'أدعية قرآنية'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setNoteModalVerse({ ...noteModalVerse, collectionTag: tag })}
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      noteModalVerse.collectionTag === tag
                        ? 'bg-[#0E4A3A] text-white dark:bg-amber-400 dark:text-stone-950'
                        : 'bg-stone-100 dark:bg-[#15251E] text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                ملاحظتك الشخصية أو الفائدة التدبرية:
              </label>
              <textarea
                rows={3}
                value={noteModalVerse.note}
                onChange={(e) => setNoteModalVerse({ ...noteModalVerse, note: e.target.value })}
                placeholder="اكتب ما فتح الله به عليك من فائدة أو تذكير مرتبط بهذه الآية..."
                className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 p-3 text-sm"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setNoteModalVerse(null)}
                className="px-4 py-2 rounded-lg border border-stone-300 dark:border-emerald-800 text-xs font-medium"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  void toggleOrSaveBookmark(noteModalVerse);
                  setNoteModalVerse(null);
                }}
                className="px-4 py-2 rounded-lg bg-[#0E4A3A] text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>حفظ الآية والملاحظة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Custom Playlist Modal */}
      {playlistModalVerse && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl bg-white dark:bg-[#101C17] border border-stone-200 dark:border-emerald-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                إضافة الآية إلى قائمة تشغيل صوتية
              </h3>
              <button type="button" onClick={() => setPlaylistModalVerse(null)}>
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">اختر قائمة أو اكتب اسماً جديداً:</label>
              <input
                type="text"
                value={customPlaylistName}
                onChange={(e) => setCustomPlaylistName(e.target.value)}
                className="w-full rounded-xl bg-stone-50 dark:bg-[#15251E] border border-stone-200 dark:border-emerald-900 px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {playlists.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setCustomPlaylistName(p.name)}
                    className="px-2.5 py-1 rounded bg-stone-100 dark:bg-[#15251E] text-xs"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  addVerseToPlaylist(customPlaylistName, playlistModalVerse);
                  setPlaylistModalVerse(null);
                }}
                className="px-4 py-2 rounded-lg bg-[#0E4A3A] text-white text-xs font-semibold"
              >
                إضافة للقائمة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
