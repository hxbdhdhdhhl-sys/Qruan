import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import {
  auth,
  collection,
  db,
  doc,
  ensureQuranUserProfile,
  getDoc,
  handleFirestoreError,
  onSnapshot,
  query,
  removeCloudBookmark,
  sanitizeDocId,
  saveCloudHifzPlan,
  saveCloudKhatmahPlan,
  signInWithGoogle,
  signOutAccount,
  SUPER_ADMIN_EMAIL,
  syncReadingPositionToCloud,
  upsertCloudBookmark,
  where,
} from '../lib/firebase';
import { useOnlineStatus } from '../lib/pwa';
import { ALL_SURAHS, VERIFIED_RECITERS } from '../data/surahs';
import { WORLD_ISLAMIC_CITIES } from '../data/adhkarAndLibrary';
import { MESSAGE_LIBRARY } from '../data/i18n';
import type { CalcMethodId } from '../lib/prayerUtils';
import { OperationType } from '../types/quran';
import type {
  AdhkarTabId,
  AdminTabId,
  AppToast,
  AudioPlaybackState,
  BookmarkRecord,
  HifzPlanRecord,
  KhatmahPlanRecord,
  Language,
  MainNavId,
  MushafDisplayMode,
  MushafThemeMode,
  NotificationSettings,
  QuranFontStyle,
  QuranSubTab,
  ToolsSubTab,
  UserPublicProfile,
} from '../types/quran';

interface NavSnapshot {
  nav: MainNavId;
  quranTab: QuranSubTab;
  toolsTab: ToolsSubTab;
  surah: number;
  ayah: number;
  page: number;
  mushafDisplayMode: MushafDisplayMode;
  libraryCategory: string;
  activeLibraryBookId: string | null;
  activeLibraryChapterIdx: number;
  adhkarCategory: AdhkarTabId;
  adminTab: AdminTabId;
}

interface ConfirmDialogState {
  message: string;
  onConfirm: () => void;
}

interface ListeningHistoryItem {
  surahNumber: number;
  surahNameAr: string;
  ayahNumber: number;
  reciterId: string;
  reciterNameAr: string;
  timestampIso: string;
}

interface CustomPlaylistItem {
  id: string;
  name: string;
  items: Array<{
    surahNumber: number;
    ayahNumber: number;
    globalAyahNumber: number;
    surahNameAr: string;
    verseExcerpt: string;
  }>;
}

interface QuranAppContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  highContrastMode: boolean;
  setHighContrastMode: (v: boolean) => void;
  mushafThemeMode: MushafThemeMode;
  setMushafThemeMode: (mode: MushafThemeMode) => void;
  resolvedMushafSurface: 'paper' | 'night';
  quranFont: QuranFontStyle;
  setQuranFont: (f: QuranFontStyle) => void;
  quranFontSize: number;
  setQuranFontSize: (s: number) => void;
  selectedTranslation: string;
  setSelectedTranslation: (id: string) => void;
  selectedReciter: string;
  setSelectedReciter: (id: string) => void;

  // Navigation
  activeNav: MainNavId;
  quranTab: QuranSubTab;
  toolsTab: ToolsSubTab;
  mushafDisplayMode: MushafDisplayMode;
  setMushafDisplayMode: (mode: MushafDisplayMode) => void;
  libraryCategory: string;
  setLibraryCategory: (cat: string) => void;
  activeLibraryBookId: string | null;
  setActiveLibraryBookId: (id: string | null) => void;
  activeLibraryChapterIdx: number;
  setActiveLibraryChapterIdx: (idx: number) => void;
  adhkarCategory: AdhkarTabId;
  setAdhkarCategory: (cat: AdhkarTabId) => void;
  adminTab: AdminTabId;
  setAdminTab: (tab: AdminTabId) => void;
  activeSurah: number;
  activeAyah: number;
  activePage: number;
  canGoBack: boolean;
  navigateTo: (
    nav: MainNavId,
    opts?: {
      quranTab?: QuranSubTab;
      toolsTab?: ToolsSubTab;
      mushafMode?: MushafDisplayMode;
      surah?: number;
      ayah?: number;
      page?: number;
      libraryCategory?: string;
      libraryBookId?: string | null;
      libraryChapterIdx?: number;
      adhkarCategory?: AdhkarTabId;
      adminTab?: AdminTabId;
    }
  ) => void;
  goBack: () => void;
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;

  // Connectivity & Sync
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;

  // Auth & RBAC
  authReady: boolean;
  user: User | null;
  profile: UserPublicProfile | null;
  staffRole: 'super_admin' | 'admin' | 'moderator' | null;
  loginWithGoogle: () => Promise<void>;
  logoutUser: () => Promise<void>;

  // Reading Position, Bookmarks, Notes, Hifz, Khatmah
  lastRead: { surah: number; ayah: number; page: number };
  saveReadingPosition: (surah: number, ayah: number, page: number, silent?: boolean) => void;
  bookmarks: BookmarkRecord[];
  toggleOrSaveBookmark: (item: {
    surahNumber: number;
    ayahNumber: number;
    pageNumber: number;
    surahName: string;
    verseExcerpt: string;
    collectionTag?: string;
    note?: string;
  }) => Promise<void>;
  deleteBookmark: (id: string) => Promise<void>;
  hifzPlans: HifzPlanRecord[];
  upsertHifzPlan: (plan: HifzPlanRecord) => Promise<void>;
  khatmahPlans: KhatmahPlanRecord[];
  upsertKhatmahPlan: (plan: KhatmahPlanRecord) => Promise<void>;

  // Adhkar, Library & Location Preferences
  favoriteDhikrIds: string[];
  toggleFavoriteDhikr: (id: string) => void;
  savedBookIds: string[];
  toggleSavedBook: (id: string) => void;
  selectedCityId: string;
  setSelectedCityId: (id: string) => void;
  userCoords: { lat: number; lng: number; labelAr: string };
  setUserCoords: (coords: { lat: number; lng: number; labelAr: string }) => void;
  calcMethod: CalcMethodId;
  setCalcMethod: (m: CalcMethodId) => void;
  madhab: 'shafi' | 'hanafi';
  setMadhab: (m: 'shafi' | 'hanafi') => void;

  // Audio Recitation Engine
  audioState: AudioPlaybackState;
  playVerseAudio: (opts: {
    surahNumber: number;
    ayahNumber: number;
    globalAyahNumber: number;
    verseText: string;
    reciterId?: string;
    audioUrl?: string;
    rangeEndAyah?: number;
  }) => void;
  togglePlayPause: () => void;
  stopAudio: () => void;
  setPlaybackRate: (rate: number) => void;
  setRepeatMode: (mode: 'none' | 'ayah' | 'range') => void;
  setAutoAdvance: (auto: boolean) => void;
  setSleepTimer: (minutes: number | null) => void;
  listeningHistory: ListeningHistoryItem[];
  playlists: CustomPlaylistItem[];
  addVerseToPlaylist: (
    playlistName: string,
    verse: {
      surahNumber: number;
      ayahNumber: number;
      globalAyahNumber: number;
      surahNameAr: string;
      verseExcerpt: string;
    }
  ) => void;

  // Notifications, Toasts & Confirmations
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (next: Partial<NotificationSettings>) => void;
  inAppAlerts: Array<{
    id: string;
    titleAr: string;
    titleEn: string;
    messageAr: string;
    messageEn: string;
    category: string;
    createdAtIso: string;
    isRead: boolean;
  }>;
  markAllAlertsRead: () => void;
  toasts: AppToast[];
  pushToast: (kind: AppToast['kind'], message: string, refCode?: string) => void;
  dismissToast: (id: string) => void;
  confirmDialog: ConfirmDialogState | null;
  askConfirm: (message: string, onConfirm: () => void) => void;
  closeConfirm: () => void;
  reportDiagnosticsError: (scope: string, err: unknown) => Promise<string>;
}

const QuranAppContext = createContext<QuranAppContextValue | null>(null);

function readLocalJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function computeGlobalAyahNumber(surahNumber: number, ayahInSurah: number): number {
  let offset = 0;
  for (let i = 0; i < surahNumber - 1 && i < ALL_SURAHS.length; i++) {
    offset += ALL_SURAHS[i].ayahCount;
  }
  return offset + ayahInSurah;
}

export const QuranAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isOnline = useOnlineStatus();

  const [lang, setLangState] = useState<Language>(() =>
    readLocalJson<Language>('qr_lang', 'ar')
  );
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    readLocalJson<'light' | 'dark'>('qr_theme', 'light')
  );
  const [highContrastMode, setHighContrastMode] = useState<boolean>(() =>
    readLocalJson<boolean>('qr_a11y_contrast', false)
  );
  const [mushafThemeMode, setMushafThemeMode] = useState<MushafThemeMode>(() => {
    const saved = readLocalJson<string>('qr_mushaf_theme', 'paper');
    return saved === 'paper' || saved === 'night' || saved === 'auto' ? saved : 'paper';
  });
  const [quranFont, setQuranFont] = useState<QuranFontStyle>(() =>
    readLocalJson<QuranFontStyle>('qr_font', 'uthmani')
  );
  const [quranFontSize, setQuranFontSize] = useState<number>(() =>
    readLocalJson<number>('qr_font_size', 28)
  );
  const [selectedTranslation, setSelectedTranslation] = useState<string>(() =>
    readLocalJson<string>('qr_translation', 'en.sahih')
  );
  const [selectedReciter, setSelectedReciter] = useState<string>(() =>
    readLocalJson<string>('qr_reciter', 'ar.alafasy')
  );

  // Navigation State with Restore Last Route
  const [activeNav, setActiveNav] = useState<MainNavId>(() =>
    readLocalJson<MainNavId>('qr_last_nav', 'home')
  );
  const [quranTab, setQuranTab] = useState<QuranSubTab>('mushaf');
  const [toolsTab, setToolsTab] = useState<ToolsSubTab>('prayer');
  const [mushafDisplayMode, setMushafDisplayMode] = useState<MushafDisplayMode>(() => {
    try {
      const raw = localStorage.getItem('qr_mushaf_display_mode');
      if (raw === 'page' || raw === 'surah') return raw;
      const parsed = raw ? JSON.parse(raw) : 'surah';
      return parsed === 'page' || parsed === 'surah' ? parsed : 'surah';
    } catch {
      return 'surah';
    }
  });
  const [libraryCategory, setLibraryCategory] = useState<string>('all');
  const [activeLibraryBookId, setActiveLibraryBookId] = useState<string | null>(null);
  const [activeLibraryChapterIdx, setActiveLibraryChapterIdx] = useState<number>(0);
  const [adhkarCategory, setAdhkarCategory] = useState<AdhkarTabId>('morning');
  const [adminTab, setAdminTab] = useState<AdminTabId>('health');
  const [lastRead, setLastRead] = useState<{ surah: number; ayah: number; page: number }>(() =>
    readLocalJson('qr_last_read', { surah: 1, ayah: 1, page: 1 })
  );
  const [activeSurah, setActiveSurah] = useState<number>(() => lastRead.surah || 1);
  const [activeAyah, setActiveAyah] = useState<number>(() => lastRead.ayah || 1);
  const [activePage, setActivePage] = useState<number>(() => lastRead.page || 1);
  const [historyStack, setHistoryStack] = useState<NavSnapshot[]>([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Auth & Firestore User State
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserPublicProfile | null>(null);
  const [staffRole, setStaffRole] = useState<'super_admin' | 'admin' | 'moderator' | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Local-first Collections
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>(() =>
    readLocalJson<BookmarkRecord[]>('qr_bookmarks', [])
  );
  const [hifzPlans, setHifzPlans] = useState<HifzPlanRecord[]>(() =>
    readLocalJson<HifzPlanRecord[]>('qr_hifz_plans', [])
  );
  const [khatmahPlans, setKhatmahPlans] = useState<KhatmahPlanRecord[]>(() =>
    readLocalJson<KhatmahPlanRecord[]>('qr_khatmah_plans', [])
  );
  const [favoriteDhikrIds, setFavoriteDhikrIds] = useState<string[]>(() =>
    readLocalJson<string[]>('qr_fav_adhkar', ['dhikr_morning_kursi', 'dhikr_morning_sayyid_istighfar'])
  );
  const [savedBookIds, setSavedBookIds] = useState<string[]>(() =>
    readLocalJson<string[]>('qr_saved_books', ['book_saadi_tafsir'])
  );

  // Location & Prayer Preferences
  const [selectedCityId, setSelectedCityIdState] = useState<string>(() =>
    readLocalJson<string>('qr_city_id', 'makkah')
  );
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; labelAr: string }>(() =>
    readLocalJson('qr_coords', { lat: 21.4225, lng: 39.8262, labelAr: 'مكة المكرمة' })
  );
  const [calcMethod, setCalcMethod] = useState<CalcMethodId>(() =>
    readLocalJson<CalcMethodId>('qr_calc_method', 'UmmAlQura')
  );
  const [madhab, setMadhab] = useState<'shafi' | 'hanafi'>(() =>
    readLocalJson<'shafi' | 'hanafi'>('qr_madhab', 'shafi')
  );

  // Notification Settings & Alerts
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() =>
    readLocalJson<NotificationSettings>('qr_notif_settings', {
      prayerAlerts: true,
      adhkarAlerts: true,
      quranReminderTime: '20:00',
      hifzReminderTime: '06:00',
      soundEnabled: true,
      vibrationEnabled: true,
      quietHoursStart: '23:00',
      quietHoursEnd: '04:30',
      pauseAll: false,
    })
  );

  const [inAppAlerts, setInAppAlerts] = useState<
    Array<{
      id: string;
      titleAr: string;
      titleEn: string;
      messageAr: string;
      messageEn: string;
      category: string;
      createdAtIso: string;
      isRead: boolean;
    }>
  >(() =>
    readLocalJson('qr_in_app_alerts', [
      {
        id: 'welcome_wird',
        titleAr: 'الورد القرآني اليومي',
        titleEn: 'Daily Quranic Wird',
        messageAr: 'اجعل لك كل يوم ورداً من القرآن الكريم؛ قليلٌ دائم خير من كثير منقطع.',
        messageEn: 'Maintain a steady daily portion of the Noble Quran.',
        category: 'quran',
        createdAtIso: new Date().toISOString(),
        isRead: false,
      },
      {
        id: 'adhkar_reminder',
        titleAr: 'تذكير الأذكار الموثقة',
        titleEn: 'Authenticated Adhkar Reminder',
        messageAr: 'حصّن يومك بأذكار الصباح والمساء الثابتة في الصحيحين.',
        messageEn: 'Begin and end your day with authenticated morning and evening Adhkar.',
        category: 'adhkar',
        createdAtIso: new Date().toISOString(),
        isRead: false,
      },
    ])
  );

  const [toasts, setToasts] = useState<AppToast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Audio Recitation State & HTMLAudioElement
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioState, setAudioState] = useState<AudioPlaybackState>({
    isPlaying: false,
    isLoading: false,
    reciterId: selectedReciter,
    surahNumber: 1,
    surahNameAr: 'الفاتحة',
    ayahNumber: 1,
    globalAyahNumber: 1,
    verseText: '',
    playbackRate: 1,
    repeatMode: 'none',
    rangeStartAyah: 1,
    rangeEndAyah: 7,
    autoAdvance: true,
    sleepTimerMinutes: null,
    sleepEndsAtMs: null,
  });

  const [listeningHistory, setListeningHistory] = useState<ListeningHistoryItem[]>(() =>
    readLocalJson<ListeningHistoryItem[]>('qr_listen_history', [])
  );
  const [playlists, setPlaylists] = useState<CustomPlaylistItem[]>(() =>
    readLocalJson<CustomPlaylistItem[]>('qr_playlists', [
      {
        id: 'pl_tranquility',
        name: 'آيات السكينة والطمأنينة',
        items: [
          {
            surahNumber: 13,
            ayahNumber: 28,
            globalAyahNumber: 1735,
            surahNameAr: 'الرعد',
            verseExcerpt: 'أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ',
          },
          {
            surahNumber: 2,
            ayahNumber: 255,
            globalAyahNumber: 262,
            surahNameAr: 'البقرة',
            verseExcerpt: 'ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ',
          },
        ],
      },
    ])
  );

  const pushToast = useCallback(
    (kind: AppToast['kind'], message: string, refCode?: string) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, kind, message, refCode }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const askConfirm = useCallback((message: string, onConfirm: () => void) => {
    setConfirmDialog({ message, onConfirm });
  }, []);

  const closeConfirm = useCallback(() => setConfirmDialog(null), []);

  const reportDiagnosticsError = useCallback(async (scope: string, err: unknown): Promise<string> => {
    const fallbackRef = `ERR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    try {
      const res = await fetch('/api/telemetry/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope,
          message: err instanceof Error ? err.message : String(err),
        }),
      });
      if (res.ok) {
        const d = await res.json();
        return String(d.refCode || fallbackRef);
      }
    } catch {
      // Offline safe
    }
    return fallbackRef;
  }, []);

  // Sync HTML dir, lang, theme, and high-contrast classes
  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('qr_lang', JSON.stringify(lang));
  }, [lang]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('qr_theme', JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (highContrastMode) {
      root.classList.add('a11y-high-contrast');
    } else {
      root.classList.remove('a11y-high-contrast');
    }
    localStorage.setItem('qr_a11y_contrast', JSON.stringify(highContrastMode));
  }, [highContrastMode]);

  useEffect(() => {
    localStorage.setItem('qr_mushaf_theme', JSON.stringify(mushafThemeMode));
  }, [mushafThemeMode]);

  useEffect(() => {
    try {
      localStorage.setItem('qr_mushaf_display_mode', mushafDisplayMode);
    } catch {
      // Ignore storage quota issues
    }
  }, [mushafDisplayMode]);

  useEffect(() => {
    localStorage.setItem('qr_font', JSON.stringify(quranFont));
  }, [quranFont]);

  useEffect(() => {
    localStorage.setItem('qr_font_size', JSON.stringify(quranFontSize));
  }, [quranFontSize]);

  useEffect(() => {
    localStorage.setItem('qr_translation', JSON.stringify(selectedTranslation));
  }, [selectedTranslation]);

  useEffect(() => {
    localStorage.setItem('qr_reciter', JSON.stringify(selectedReciter));
    setAudioState((s) => ({ ...s, reciterId: selectedReciter }));
  }, [selectedReciter]);

  useEffect(() => {
    localStorage.setItem('qr_fav_adhkar', JSON.stringify(favoriteDhikrIds));
  }, [favoriteDhikrIds]);

  useEffect(() => {
    localStorage.setItem('qr_saved_books', JSON.stringify(savedBookIds));
  }, [savedBookIds]);

  useEffect(() => {
    localStorage.setItem('qr_coords', JSON.stringify(userCoords));
    localStorage.setItem('qr_city_id', JSON.stringify(selectedCityId));
    localStorage.setItem('qr_calc_method', JSON.stringify(calcMethod));
    localStorage.setItem('qr_madhab', JSON.stringify(madhab));
  }, [userCoords, selectedCityId, calcMethod, madhab]);

  useEffect(() => {
    localStorage.setItem('qr_notif_settings', JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  useEffect(() => {
    localStorage.setItem('qr_in_app_alerts', JSON.stringify(inAppAlerts));
  }, [inAppAlerts]);

  useEffect(() => {
    localStorage.setItem('qr_listen_history', JSON.stringify(listeningHistory));
  }, [listeningHistory]);

  useEffect(() => {
    localStorage.setItem('qr_playlists', JSON.stringify(playlists));
  }, [playlists]);

  // Parse URL Hash deep links (#surah=18&ayah=10 or #nav=quran) & keyboard shortcut '/'
  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash) return;
      const params = new URLSearchParams(hash);
      const s = Number(params.get('surah'));
      const a = Number(params.get('ayah') || 1);
      const p = Number(params.get('page'));
      const n = params.get('nav') as MainNavId | null;

      if (s >= 1 && s <= 114) {
        const meta = ALL_SURAHS[s - 1];
        setActiveSurah(s);
        setActiveAyah(Math.max(1, Math.min(meta.ayahCount, a)));
        setActivePage(meta.startPage);
        setActiveNav('quran');
        setQuranTab('mushaf');
      } else if (p >= 1 && p <= 604) {
        setActivePage(p);
        setActiveNav('quran');
        setQuranTab('mushaf');
      } else if (n) {
        setActiveNav(n);
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);

    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('hashchange', applyHash);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const navigateTo = useCallback(
    (
      nav: MainNavId,
      opts?: {
        quranTab?: QuranSubTab;
        toolsTab?: ToolsSubTab;
        mushafMode?: MushafDisplayMode;
        surah?: number;
        ayah?: number;
        page?: number;
        libraryCategory?: string;
        libraryBookId?: string | null;
        libraryChapterIdx?: number;
        adhkarCategory?: AdhkarTabId;
        adminTab?: AdminTabId;
      }
    ) => {
      const nextQuranTab = opts?.quranTab ?? quranTab;
      const nextToolsTab = opts?.toolsTab ?? toolsTab;
      const nextMushafMode = opts?.mushafMode ?? mushafDisplayMode;
      const nextSurah =
        opts?.surah && opts.surah >= 1 && opts.surah <= 114 ? opts.surah : activeSurah;
      const nextSurahMeta = ALL_SURAHS[nextSurah - 1] || ALL_SURAHS[0];
      const nextAyah =
        opts?.surah && opts.surah >= 1 && opts.surah <= 114
          ? opts.ayah
            ? Math.max(1, Math.min(nextSurahMeta.ayahCount, opts.ayah))
            : 1
          : opts?.ayah
            ? Math.max(1, Math.min(nextSurahMeta.ayahCount, opts.ayah))
            : activeAyah;
      const nextPage =
        opts?.page && opts.page >= 1 && opts.page <= 604
          ? opts.page
          : opts?.surah && opts.surah >= 1 && opts.surah <= 114
            ? nextSurahMeta.startPage
            : activePage;
      const nextLibCategory = opts?.libraryCategory ?? libraryCategory;
      const nextLibBookId =
        opts && 'libraryBookId' in opts ? (opts.libraryBookId ?? null) : activeLibraryBookId;
      const nextLibChapterIdx = opts?.libraryChapterIdx ?? activeLibraryChapterIdx;
      const nextAdhkarCat = opts?.adhkarCategory ?? adhkarCategory;
      const nextAdminTab = opts?.adminTab ?? adminTab;

      const isIdentical =
        nav === activeNav &&
        nextQuranTab === quranTab &&
        nextToolsTab === toolsTab &&
        nextMushafMode === mushafDisplayMode &&
        nextSurah === activeSurah &&
        nextAyah === activeAyah &&
        nextPage === activePage &&
        nextLibCategory === libraryCategory &&
        nextLibBookId === activeLibraryBookId &&
        nextLibChapterIdx === activeLibraryChapterIdx &&
        nextAdhkarCat === adhkarCategory &&
        nextAdminTab === adminTab;

      if (!isIdentical) {
        setHistoryStack((prev) => {
          const current: NavSnapshot = {
            nav: activeNav,
            quranTab,
            toolsTab,
            surah: activeSurah,
            ayah: activeAyah,
            page: activePage,
            mushafDisplayMode,
            libraryCategory,
            activeLibraryBookId,
            activeLibraryChapterIdx,
            adhkarCategory,
            adminTab,
          };
          return [...prev.slice(-19), current];
        });
      }

      setActiveNav(nav);
      localStorage.setItem('qr_last_nav', JSON.stringify(nav));

      if (opts?.quranTab) setQuranTab(opts.quranTab);
      if (opts?.toolsTab) setToolsTab(opts.toolsTab);
      if (opts?.mushafMode) setMushafDisplayMode(opts.mushafMode);
      if (opts?.surah && opts.surah >= 1 && opts.surah <= 114) {
        setActiveSurah(nextSurah);
        setActiveAyah(nextAyah);
        setActivePage(nextPage);
      } else {
        if (opts?.ayah) setActiveAyah(nextAyah);
        if (opts?.page && opts.page >= 1 && opts.page <= 604) {
          setActivePage(opts.page);
        }
      }
      if (opts?.libraryCategory !== undefined) setLibraryCategory(opts.libraryCategory);
      if (opts && 'libraryBookId' in opts) setActiveLibraryBookId(opts.libraryBookId ?? null);
      if (opts?.libraryChapterIdx !== undefined) setActiveLibraryChapterIdx(opts.libraryChapterIdx);
      if (opts?.adhkarCategory !== undefined) setAdhkarCategory(opts.adhkarCategory);
      if (opts?.adminTab !== undefined) setAdminTab(opts.adminTab);

      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [
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
    ]
  );

  const goBack = useCallback(() => {
    setHistoryStack((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setActiveNav(last.nav);
      localStorage.setItem('qr_last_nav', JSON.stringify(last.nav));
      setQuranTab(last.quranTab);
      setToolsTab(last.toolsTab);
      setMushafDisplayMode(last.mushafDisplayMode);
      setActiveSurah(last.surah);
      setActiveAyah(last.ayah);
      setActivePage(last.page);
      setLibraryCategory(last.libraryCategory);
      setActiveLibraryBookId(last.activeLibraryBookId);
      setActiveLibraryChapterIdx(last.activeLibraryChapterIdx);
      setAdhkarCategory(last.adhkarCategory);
      setAdminTab(last.adminTab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return prev.slice(0, -1);
    });
  }, []);

  // Firebase Auth & Real-Time Listeners
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (!fbUser) {
        setProfile(null);
        setStaffRole(null);
        setAuthReady(true);
        return;
      }

      try {
        const prof = await ensureQuranUserProfile(fbUser, lang);
        setProfile(prof);
        if (prof.lastSurah >= 1) {
          setLastRead({ surah: prof.lastSurah, ayah: prof.lastAyah, page: prof.lastPage });
        }

        if (fbUser.emailVerified && fbUser.email === SUPER_ADMIN_EMAIL) {
          setStaffRole('super_admin');
        } else if (fbUser.emailVerified) {
          try {
            const roleSnap = await getDoc(doc(db, 'staff_roles', sanitizeDocId(fbUser.uid)));
            if (roleSnap.exists()) {
              const r = roleSnap.data().role;
              setStaffRole(r === 'admin' ? 'admin' : r === 'moderator' ? 'moderator' : null);
            } else {
              setStaffRole(null);
            }
          } catch {
            setStaffRole(null);
          }
        }
      } catch {
        // Offline auth fallback
      } finally {
        setAuthReady(true);
      }
    });
    return () => unsub();
  }, [lang]);

  // Attach Firestore Listeners for Authenticated User
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) return;
    const safeUid = sanitizeDocId(user.uid);

    const bmQuery = query(collection(db, 'bookmarks'), where('userId', '==', safeUid));
    const unsubBm = onSnapshot(
      bmQuery,
      (snap) => {
        const items: BookmarkRecord[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: String(data.userId),
            surahNumber: Number(data.surahNumber),
            ayahNumber: Number(data.ayahNumber),
            pageNumber: Number(data.pageNumber || 1),
            surahName: String(data.surahName),
            verseExcerpt: String(data.verseExcerpt),
            collectionTag: String(data.collectionTag || 'المفضلة'),
            note: String(data.note || ''),
            synced: true,
            updatedAtIso: new Date().toISOString(),
          };
        });
        setBookmarks(items);
        localStorage.setItem('qr_bookmarks', JSON.stringify(items));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'bookmarks')
    );

    const hifzQuery = query(collection(db, 'hifz_plans'), where('userId', '==', safeUid));
    const unsubHifz = onSnapshot(
      hifzQuery,
      (snap) => {
        const items: HifzPlanRecord[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: String(data.userId),
            title: String(data.title),
            targetScope: String(data.targetScope),
            dailyAyahs: Number(data.dailyAyahs),
            durationDays: Number(data.durationDays),
            memorizedAyahsCount: Number(data.memorizedAyahsCount),
            totalTargetAyahs: Number(data.totalTargetAyahs),
            currentSurah: Number(data.currentSurah),
            currentAyah: Number(data.currentAyah),
            reminderTime: String(data.reminderTime || '06:00'),
            status: (data.status as HifzPlanRecord['status']) || 'active',
            updatedAtIso: new Date().toISOString(),
          };
        });
        setHifzPlans(items);
        localStorage.setItem('qr_hifz_plans', JSON.stringify(items));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'hifz_plans')
    );

    const khQuery = query(collection(db, 'khatmah_plans'), where('userId', '==', safeUid));
    const unsubKh = onSnapshot(
      khQuery,
      (snap) => {
        const items: KhatmahPlanRecord[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: String(data.userId),
            title: String(data.title),
            durationDays: Number(data.durationDays),
            dailyPages: Number(data.dailyPages),
            completedPages: Number(data.completedPages),
            currentJuz: Number(data.currentJuz),
            reminderTime: String(data.reminderTime || '20:00'),
            shareConsent: Boolean(data.shareConsent),
            status: (data.status as KhatmahPlanRecord['status']) || 'active',
            updatedAtIso: new Date().toISOString(),
          };
        });
        setKhatmahPlans(items);
        localStorage.setItem('qr_khatmah_plans', JSON.stringify(items));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'khatmah_plans')
    );

    // Broadcast notifications listener
    const bcQuery = query(collection(db, 'notifications'), where('scope', '==', 'broadcast'));
    const unsubBc = onSnapshot(
      bcQuery,
      (snap) => {
        const bcItems = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            titleAr: String(data.titleAr || ''),
            titleEn: String(data.titleEn || ''),
            messageAr: String(data.messageAr || ''),
            messageEn: String(data.messageEn || ''),
            category: String(data.category || 'system'),
            createdAtIso: new Date().toISOString(),
            isRead: false,
          };
        });
        if (bcItems.length > 0) {
          setInAppAlerts((prev) => {
            const existingIds = new Set(prev.map((x) => x.id));
            const fresh = bcItems.filter((x) => !existingIds.has(x.id));
            return fresh.length > 0 ? [...fresh, ...prev] : prev;
          });
        }
      },
      () => {
        // Non-fatal if offline
      }
    );

    return () => {
      unsubBm();
      unsubHifz();
      unsubKh();
      unsubBc();
    };
  }, [authReady, user]);

  // Automatic Background Sync when Returning Online
  useEffect(() => {
    if (!isOnline || !user || !user.emailVerified || pendingSyncCount === 0) return;
    let cancelled = false;
    const flushSync = async () => {
      setIsSyncing(true);
      try {
        await syncReadingPositionToCloud(user.uid, lastRead.surah, lastRead.ayah, lastRead.page);
        for (const bm of bookmarks.filter((b) => b.synced === false)) {
          await upsertCloudBookmark(user.uid, bm);
        }
        if (!cancelled) {
          setPendingSyncCount(0);
          pushToast('success', MESSAGE_LIBRARY[lang].success.synced);
        }
      } catch {
        // Keep queued
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    };
    void flushSync();
    return () => {
      cancelled = true;
    };
  }, [isOnline, user, pendingSyncCount, lastRead, bookmarks, lang, pushToast]);

  const loginWithGoogle = useCallback(async () => {
    try {
      await signInWithGoogle();
      pushToast('success', MESSAGE_LIBRARY[lang].welcome[0]);
    } catch (err) {
      const refCode = await reportDiagnosticsError('auth:google', err);
      pushToast('error', MESSAGE_LIBRARY[lang].errors.authFailed, refCode);
    }
  }, [lang, pushToast, reportDiagnosticsError]);

  const logoutUser = useCallback(async () => {
    await signOutAccount();
    pushToast('info', lang === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Signed out successfully');
  }, [lang, pushToast]);

  const saveReadingPosition = useCallback(
    (surah: number, ayah: number, page: number, silent = false) => {
      const next = { surah, ayah, page };
      setLastRead(next);
      localStorage.setItem('qr_last_read', JSON.stringify(next));
      if (user && user.emailVerified) {
        if (isOnline) {
          void syncReadingPositionToCloud(user.uid, surah, ayah, page);
        } else {
          setPendingSyncCount((c) => c + 1);
        }
      }
      if (!silent) {
        pushToast('success', MESSAGE_LIBRARY[lang].success.readingPositionSaved);
      }
    },
    [user, isOnline, lang, pushToast]
  );

  const toggleOrSaveBookmark = useCallback(
    async (item: {
      surahNumber: number;
      ayahNumber: number;
      pageNumber: number;
      surahName: string;
      verseExcerpt: string;
      collectionTag?: string;
      note?: string;
    }) => {
      const localId = sanitizeDocId(
        `bm_${user?.uid || 'guest'}_${item.surahNumber}_${item.ayahNumber}`
      );
      const record: BookmarkRecord = {
        id: localId,
        userId: user?.uid || 'guest',
        surahNumber: item.surahNumber,
        ayahNumber: item.ayahNumber,
        pageNumber: item.pageNumber,
        surahName: item.surahName,
        verseExcerpt: item.verseExcerpt,
        collectionTag: item.collectionTag || 'المفضلة',
        note: item.note ?? '',
        synced: Boolean(user && isOnline),
        updatedAtIso: new Date().toISOString(),
      };

      setBookmarks((prev) => {
        const filtered = prev.filter(
          (x) => !(x.surahNumber === item.surahNumber && x.ayahNumber === item.ayahNumber)
        );
        const updated = [record, ...filtered];
        localStorage.setItem('qr_bookmarks', JSON.stringify(updated));
        return updated;
      });

      if (user && user.emailVerified) {
        if (isOnline) {
          await upsertCloudBookmark(user.uid, record);
        } else {
          setPendingSyncCount((c) => c + 1);
        }
      }
      pushToast(
        'success',
        item.note
          ? MESSAGE_LIBRARY[lang].success.noteSaved
          : MESSAGE_LIBRARY[lang].success.bookmarkSaved
      );
    },
    [user, isOnline, lang, pushToast]
  );

  const deleteBookmark = useCallback(
    async (id: string) => {
      setBookmarks((prev) => {
        const updated = prev.filter((x) => x.id !== id);
        localStorage.setItem('qr_bookmarks', JSON.stringify(updated));
        return updated;
      });
      if (user && user.emailVerified && isOnline) {
        await removeCloudBookmark(id);
      }
      pushToast('info', MESSAGE_LIBRARY[lang].success.bookmarkRemoved);
    },
    [user, isOnline, lang, pushToast]
  );

  const upsertHifzPlan = useCallback(
    async (plan: HifzPlanRecord) => {
      setHifzPlans((prev) => {
        const filtered = prev.filter((p) => p.id !== plan.id);
        const updated = [plan, ...filtered];
        localStorage.setItem('qr_hifz_plans', JSON.stringify(updated));
        return updated;
      });
      if (user && user.emailVerified && isOnline) {
        await saveCloudHifzPlan(user.uid, plan);
      }
      pushToast('success', MESSAGE_LIBRARY[lang].success.hifzUpdated);
    },
    [user, isOnline, lang, pushToast]
  );

  const upsertKhatmahPlan = useCallback(
    async (plan: KhatmahPlanRecord) => {
      setKhatmahPlans((prev) => {
        const filtered = prev.filter((p) => p.id !== plan.id);
        const updated = [plan, ...filtered];
        localStorage.setItem('qr_khatmah_plans', JSON.stringify(updated));
        return updated;
      });
      if (user && user.emailVerified && isOnline) {
        await saveCloudKhatmahPlan(user.uid, plan);
      }
      pushToast('success', MESSAGE_LIBRARY[lang].success.khatmahCreated);
    },
    [user, isOnline, lang, pushToast]
  );

  const setSelectedCityId = useCallback((cityId: string) => {
    setSelectedCityIdState(cityId);
    const city = WORLD_ISLAMIC_CITIES.find((c) => c.id === cityId);
    if (city) {
      setUserCoords({ lat: city.lat, lng: city.lng, labelAr: city.nameAr });
      setCalcMethod(city.defaultMethod);
    }
  }, []);

  // Clean up any legacy cross-origin opaque cache entries that could block HTMLAudioElement
  const activeObjectUrlRef = useRef<string | null>(null);
  useEffect(() => {
    if (typeof caches === 'undefined') return;
    caches
      .open('quran-audio-recitations-cache')
      .then(async (cache) => {
        const keys = await cache.keys();
        for (const req of keys) {
          if (req.url.includes('cdn.islamic.network')) {
            await cache.delete(req);
          }
        }
      })
      .catch(() => {
        // Ignore cache cleanup errors
      });
    return () => {
      if (activeObjectUrlRef.current) {
        URL.revokeObjectURL(activeObjectUrlRef.current);
        activeObjectUrlRef.current = null;
      }
    };
  }, []);

  const resolvePlayableSource = useCallback(async (canonicalPath: string): Promise<string> => {
    if (activeObjectUrlRef.current) {
      URL.revokeObjectURL(activeObjectUrlRef.current);
      activeObjectUrlRef.current = null;
    }
    if (typeof caches !== 'undefined') {
      try {
        const cache = await caches.open('quran-audio-recitations-cache');
        const cachedResp = await cache.match(canonicalPath);
        if (cachedResp && cachedResp.ok && cachedResp.status === 200) {
          const rawBlob = await cachedResp.blob();
          if (rawBlob.size > 256) {
            const mp3Blob =
              rawBlob.type === 'audio/mpeg'
                ? rawBlob
                : new Blob([rawBlob], { type: 'audio/mpeg' });
            const objUrl = URL.createObjectURL(mp3Blob);
            activeObjectUrlRef.current = objUrl;
            return objUrl;
          }
        }
      } catch {
        // Fall back to direct same-origin stream
      }
    }
    return canonicalPath;
  }, []);

  // Audio Recitation Engine Setup
  const playVerseAudio = useCallback(
    (opts: {
      surahNumber: number;
      ayahNumber: number;
      globalAyahNumber?: number;
      verseText: string;
      reciterId?: string;
      audioUrl?: string;
      rangeEndAyah?: number;
    }) => {
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.preload = 'auto';
      }
      const el = audioRef.current;
      const reciter = opts.reciterId || selectedReciter;
      const globalNum =
        opts.globalAyahNumber && opts.globalAyahNumber >= 1
          ? opts.globalAyahNumber
          : computeGlobalAyahNumber(opts.surahNumber, opts.ayahNumber);
      const surahMeta = ALL_SURAHS[opts.surahNumber - 1] || ALL_SURAHS[0];
      const reciterMeta =
        VERIFIED_RECITERS.find((r) => r.id === reciter) || VERIFIED_RECITERS[0];

      // Always route through our verified same-origin HTTP Range audio endpoint
      const canonicalAudioPath = `/api/quran/audio/${encodeURIComponent(reciter)}/${globalNum}`;

      el.pause();

      setAudioState((prev) => ({
        ...prev,
        isLoading: true,
        isPlaying: true,
        reciterId: reciter,
        surahNumber: opts.surahNumber,
        surahNameAr: surahMeta.nameAr,
        ayahNumber: opts.ayahNumber,
        globalAyahNumber: globalNum,
        verseText: opts.verseText,
        rangeStartAyah: opts.ayahNumber,
        rangeEndAyah: opts.rangeEndAyah || surahMeta.ayahCount,
      }));

      setListeningHistory((prev) => {
        const entry: ListeningHistoryItem = {
          surahNumber: opts.surahNumber,
          surahNameAr: surahMeta.nameAr,
          ayahNumber: opts.ayahNumber,
          reciterId: reciter,
          reciterNameAr: reciterMeta.nameAr,
          timestampIso: new Date().toISOString(),
        };
        const deduped = prev.filter(
          (h) => !(h.surahNumber === entry.surahNumber && h.ayahNumber === entry.ayahNumber && h.reciterId === entry.reciterId)
        );
        return [entry, ...deduped].slice(0, 25);
      });

      // OS MediaSession Lock-Screen Integration
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: `سورة ${surahMeta.nameAr} — الآية ${opts.ayahNumber}`,
            artist: reciterMeta.nameAr,
            album: 'اطمئنان القرآن – Quran Reassurance',
          });
        } catch {
          // Ignore unsupported browser quirks
        }
      }

      void resolvePlayableSource(canonicalAudioPath).then((resolvedSrc) => {
        el.src = resolvedSrc;
        el.playbackRate = audioState.playbackRate;
        el.load();
        el.play()
          .then(() => {
            setAudioState((prev) => ({ ...prev, isLoading: false, isPlaying: true }));
          })
          .catch(async (err) => {
            // Rapidly switching tracks aborts the prior play() promise; ignore benign AbortError
            if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
              return;
            }
            setAudioState((prev) => ({ ...prev, isLoading: false, isPlaying: false }));
            const refCode = await reportDiagnosticsError('audio:play', err);
            pushToast('error', MESSAGE_LIBRARY[lang].errors.audioFailed, refCode);
          });
      });
    },
    [
      selectedReciter,
      audioState.playbackRate,
      lang,
      pushToast,
      reportDiagnosticsError,
      resolvePlayableSource,
    ]
  );

  // Handle Audio Ended -> Repeat / Auto-Advance + Sleep Timer Check
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';
    }
    const el = audioRef.current;

    const handleEnded = () => {
      setAudioState((prev) => {
        if (prev.sleepEndsAtMs && Date.now() >= prev.sleepEndsAtMs) {
          return { ...prev, isPlaying: false, sleepTimerMinutes: null, sleepEndsAtMs: null };
        }

        if (prev.repeatMode === 'ayah') {
          el.currentTime = 0;
          void el.play().catch(() => {});
          return prev;
        }

        // Sheikh Abdulrahman Mossad streams full/selected Surah passages rather than split single-ayah clips
        if (prev.reciterId === 'ar.abdulrahmanmossad') {
          return { ...prev, isPlaying: false };
        }

        const surahMeta = ALL_SURAHS[prev.surahNumber - 1] || ALL_SURAHS[0];
        const maxAyah = Math.min(surahMeta.ayahCount, prev.rangeEndAyah || surahMeta.ayahCount);

        if (prev.autoAdvance && prev.ayahNumber < maxAyah) {
          const nextAyah = prev.ayahNumber + 1;
          const nextGlobal = computeGlobalAyahNumber(prev.surahNumber, nextAyah);
          const nextPath = `/api/quran/audio/${encodeURIComponent(prev.reciterId)}/${nextGlobal}`;
          void resolvePlayableSource(nextPath).then((src) => {
            el.src = src;
            el.playbackRate = prev.playbackRate;
            el.load();
            void el.play().catch(() => {});
          });
          return {
            ...prev,
            ayahNumber: nextAyah,
            globalAyahNumber: nextGlobal,
            verseText: `سورة ${surahMeta.nameAr} · الآية ${nextAyah}`,
          };
        }

        if (prev.repeatMode === 'range') {
          const restartGlobal = computeGlobalAyahNumber(prev.surahNumber, prev.rangeStartAyah);
          const restartPath = `/api/quran/audio/${encodeURIComponent(prev.reciterId)}/${restartGlobal}`;
          void resolvePlayableSource(restartPath).then((src) => {
            el.src = src;
            el.playbackRate = prev.playbackRate;
            el.load();
            void el.play().catch(() => {});
          });
          return {
            ...prev,
            ayahNumber: prev.rangeStartAyah,
            globalAyahNumber: restartGlobal,
          };
        }

        return { ...prev, isPlaying: false };
      });
    };

    el.addEventListener('ended', handleEnded);
    return () => {
      el.removeEventListener('ended', handleEnded);
    };
  }, [resolvePlayableSource]);

  // Sleep Timer Watcher
  useEffect(() => {
    if (!audioState.sleepEndsAtMs) return;
    const timer = window.setInterval(() => {
      if (audioState.sleepEndsAtMs && Date.now() >= audioState.sleepEndsAtMs) {
        audioRef.current?.pause();
        setAudioState((s) => ({
          ...s,
          isPlaying: false,
          sleepTimerMinutes: null,
          sleepEndsAtMs: null,
        }));
        pushToast(
          'info',
          lang === 'ar'
            ? 'تم إيقاف التلاوة تلقائياً حسب المؤقت المحدد'
            : 'Recitation paused automatically by sleep timer'
        );
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [audioState.sleepEndsAtMs, lang, pushToast]);

  const togglePlayPause = useCallback(() => {
    const el = audioRef.current;
    if (!el || !el.src) return;
    if (audioState.isPlaying) {
      el.pause();
      setAudioState((s) => ({ ...s, isPlaying: false }));
    } else {
      el.play()
        .then(() => setAudioState((s) => ({ ...s, isPlaying: true })))
        .catch(() => setAudioState((s) => ({ ...s, isPlaying: false })));
    }
  }, [audioState.isPlaying]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setAudioState((s) => ({ ...s, isPlaying: false, isLoading: false }));
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    setAudioState((s) => ({ ...s, playbackRate: rate }));
  }, []);

  const setRepeatMode = useCallback((mode: 'none' | 'ayah' | 'range') => {
    setAudioState((s) => ({ ...s, repeatMode: mode }));
  }, []);

  const setAutoAdvance = useCallback((auto: boolean) => {
    setAudioState((s) => ({ ...s, autoAdvance: auto }));
  }, []);

  const setSleepTimer = useCallback(
    (minutes: number | null) => {
      setAudioState((s) => ({
        ...s,
        sleepTimerMinutes: minutes,
        sleepEndsAtMs: minutes ? Date.now() + minutes * 60 * 1000 : null,
      }));
      if (minutes) {
        pushToast(
          'info',
          lang === 'ar'
            ? `تم ضبط مؤقت إيقاف التلاوة بعد ${minutes} دقيقة`
            : `Sleep timer set for ${minutes} minutes`
        );
      }
    },
    [lang, pushToast]
  );

  const addVerseToPlaylist = useCallback(
    (
      playlistName: string,
      verse: {
        surahNumber: number;
        ayahNumber: number;
        globalAyahNumber: number;
        surahNameAr: string;
        verseExcerpt: string;
      }
    ) => {
      setPlaylists((prev) => {
        const cleanName = playlistName.trim() || 'قائمتي القرآنية';
        const existing = prev.find((p) => p.name === cleanName);
        if (existing) {
          return prev.map((p) =>
            p.id === existing.id
              ? {
                  ...p,
                  items: [
                    verse,
                    ...p.items.filter(
                      (i) =>
                        !(i.surahNumber === verse.surahNumber && i.ayahNumber === verse.ayahNumber)
                    ),
                  ],
                }
              : p
          );
        }
        return [
          {
            id: `pl_${Date.now()}`,
            name: cleanName,
            items: [verse],
          },
          ...prev,
        ];
      });
      pushToast(
        'success',
        lang === 'ar' ? 'تمت إضافة الآية إلى قائمة التشغيل' : 'Verse added to playlist'
      );
    },
    [lang, pushToast]
  );

  const toggleFavoriteDhikr = useCallback((id: string) => {
    setFavoriteDhikrIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]
    );
  }, []);

  const toggleSavedBook = useCallback(
    (id: string) => {
      setSavedBookIds((prev) => {
        const exists = prev.includes(id);
        pushToast(
          'info',
          exists
            ? lang === 'ar'
              ? 'تمت إزالة الكتاب من قائمة القراءة لاحقاً'
              : 'Removed from Reading List'
            : lang === 'ar'
              ? 'تم حفظ الكتاب للقراءة لاحقاً'
              : 'Saved to Reading List'
        );
        return exists ? prev.filter((x) => x !== id) : [id, ...prev];
      });
    },
    [lang, pushToast]
  );

  const updateNotificationSettings = useCallback((next: Partial<NotificationSettings>) => {
    setNotificationSettings((prev) => ({ ...prev, ...next }));
  }, []);

  const markAllAlertsRead = useCallback(() => {
    setInAppAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
  }, []);

  const resolvedMushafSurface: 'paper' | 'night' = useMemo(() => {
    if (mushafThemeMode === 'auto') {
      return theme === 'dark' ? 'night' : 'paper';
    }
    return mushafThemeMode;
  }, [mushafThemeMode, theme]);

  const value = useMemo<QuranAppContextValue>(
    () => ({
      lang,
      setLang: setLangState,
      theme,
      toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
      highContrastMode,
      setHighContrastMode,
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
      activeNav,
      quranTab,
      toolsTab,
      mushafDisplayMode,
      setMushafDisplayMode,
      libraryCategory,
      setLibraryCategory,
      activeLibraryBookId,
      setActiveLibraryBookId,
      activeLibraryChapterIdx,
      setActiveLibraryChapterIdx,
      adhkarCategory,
      setAdhkarCategory,
      adminTab,
      setAdminTab,
      activeSurah,
      activeAyah,
      activePage,
      canGoBack: historyStack.length > 0,
      navigateTo,
      goBack,
      isSearchModalOpen,
      setIsSearchModalOpen,
      isNotificationsOpen,
      setIsNotificationsOpen,
      isOnline,
      isSyncing,
      pendingSyncCount,
      authReady,
      user,
      profile,
      staffRole,
      loginWithGoogle,
      logoutUser,
      lastRead,
      saveReadingPosition,
      bookmarks,
      toggleOrSaveBookmark,
      deleteBookmark,
      hifzPlans,
      upsertHifzPlan,
      khatmahPlans,
      upsertKhatmahPlan,
      favoriteDhikrIds,
      toggleFavoriteDhikr,
      savedBookIds,
      toggleSavedBook,
      selectedCityId,
      setSelectedCityId,
      userCoords,
      setUserCoords,
      calcMethod,
      setCalcMethod,
      madhab,
      setMadhab,
      audioState,
      playVerseAudio,
      togglePlayPause,
      stopAudio,
      setPlaybackRate,
      setRepeatMode,
      setAutoAdvance,
      setSleepTimer,
      listeningHistory,
      playlists,
      addVerseToPlaylist,
      notificationSettings,
      updateNotificationSettings,
      inAppAlerts,
      markAllAlertsRead,
      toasts,
      pushToast,
      dismissToast,
      confirmDialog,
      askConfirm,
      closeConfirm,
      reportDiagnosticsError,
    }),
    [
      lang,
      theme,
      highContrastMode,
      mushafThemeMode,
      resolvedMushafSurface,
      quranFont,
      quranFontSize,
      selectedTranslation,
      selectedReciter,
      activeNav,
      quranTab,
      toolsTab,
      mushafDisplayMode,
      libraryCategory,
      activeLibraryBookId,
      activeLibraryChapterIdx,
      adhkarCategory,
      adminTab,
      activeSurah,
      activeAyah,
      activePage,
      historyStack.length,
      navigateTo,
      goBack,
      isSearchModalOpen,
      isNotificationsOpen,
      isOnline,
      isSyncing,
      pendingSyncCount,
      authReady,
      user,
      profile,
      staffRole,
      loginWithGoogle,
      logoutUser,
      lastRead,
      saveReadingPosition,
      bookmarks,
      toggleOrSaveBookmark,
      deleteBookmark,
      hifzPlans,
      upsertHifzPlan,
      khatmahPlans,
      upsertKhatmahPlan,
      favoriteDhikrIds,
      toggleFavoriteDhikr,
      savedBookIds,
      toggleSavedBook,
      selectedCityId,
      setSelectedCityId,
      userCoords,
      calcMethod,
      madhab,
      audioState,
      playVerseAudio,
      togglePlayPause,
      stopAudio,
      setPlaybackRate,
      setRepeatMode,
      setAutoAdvance,
      setSleepTimer,
      listeningHistory,
      playlists,
      addVerseToPlaylist,
      notificationSettings,
      updateNotificationSettings,
      inAppAlerts,
      markAllAlertsRead,
      toasts,
      pushToast,
      dismissToast,
      confirmDialog,
      askConfirm,
      closeConfirm,
      reportDiagnosticsError,
    ]
  );

  return <QuranAppContext.Provider value={value}>{children}</QuranAppContext.Provider>;
};

export function useQuranApp(): QuranAppContextValue {
  const ctx = useContext(QuranAppContext);
  if (!ctx) {
    throw new Error('useQuranApp must be used inside QuranAppProvider');
  }
  return ctx;
}
